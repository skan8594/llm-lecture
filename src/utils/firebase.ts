/**
 * Firebase Firestore Client & Realtime Sync for 2026onboarding Session
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  updateDoc,
  writeBatch,
  getDocsFromServer,
  getDocFromServer,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CodeSubmission,
  TeamActivity,
  TrainingSessionConfig,
} from '../types';
import { createDefaultTeam } from '../data/teamData';
import { DEFAULT_CURRICULUM_SESSIONS } from '../data/curriculumData';
import { publicationState } from '../data/publishedModules';

export const DEFAULT_SESSION_ID = '2026onboarding';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Must include firestoreDatabaseId if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Error Handling conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on startup as mandated by Firebase Skill
export async function testConnection(sessionId: string = DEFAULT_SESSION_ID): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'sessions', sessionId));
    console.log(`[Firebase] Connected to Firestore (${sessionId} ready)`);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database initializing.');
    }
    // Still return false or true depending on error, does not crash app
    return false;
  }
}

// Subscriptions
export function subscribeToSubmissions(
  sessionId: string = DEFAULT_SESSION_ID,
  onData: (submissions: CodeSubmission[]) => void,
  onError?: (err: any) => void
) {
  const path = `sessions/${sessionId}/submissions`;
  const q = query(collection(db, path));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return;
      const items: CodeSubmission[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as CodeSubmission), id: docSnap.id });
      });
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      if (onError) onError(err);
    }
  );
}

export function subscribeToTeams(
  sessionId: string = DEFAULT_SESSION_ID,
  onData: (teams: TeamActivity[]) => void,
  onError?: (err: any) => void
) {
  const path = `sessions/${sessionId}/teams`;
  const q = query(collection(db, path), orderBy('teamNumber', 'asc'));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return;
      const items: TeamActivity[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as TeamActivity), id: docSnap.id });
      });
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      if (onError) onError(err);
    }
  );
}

export function subscribeToSessionConfig(
  sessionId: string = DEFAULT_SESSION_ID,
  onData: (config: TrainingSessionConfig) => void,
  onError?: (err: any) => void
) {
  const path = `sessions/${sessionId}`;
  const docRef = doc(db, path);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.sessionConfig) {
          onData(data.sessionConfig as TrainingSessionConfig);
        }
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(err);
    }
  );
}

function cleanForFirestore<T extends Record<string, any>>(obj: T): any {
  const res: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      res[k] = v;
    }
  }
  return res;
}

// Writers
export async function saveSubmissionToFirebase(
  sessionId: string = DEFAULT_SESSION_ID,
  submission: CodeSubmission,
  team?: TeamActivity
) {
  const path = `sessions/${sessionId}/submissions`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, path, submission.id), cleanForFirestore(submission), { merge: true });
    if (team) {
      batch.set(doc(db, `sessions/${sessionId}/teams`, team.id), cleanForFirestore(team), { merge: true });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${submission.id}`);
    throw error;
  }
}

export async function updateTeamInFirebase(
  sessionId: string = DEFAULT_SESSION_ID,
  team: TeamActivity
) {
  const path = `sessions/${sessionId}/teams`;
  try {
    await setDoc(doc(db, path, team.id), cleanForFirestore(team), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${team.id}`);
    throw error;
  }
}

// Read from the server before resetting so a quota/offline error cannot erase unbacked-up records.
export async function resetStudentDataInFirebase(
  sessionId: string,
  onBackupReady: (backup: object) => Promise<boolean>
) {
  const root = `sessions/${sessionId}`;
  const [submissions, teams, votes] = await Promise.all([
    getDocsFromServer(collection(db, `${root}/submissions`)),
    getDocsFromServer(collection(db, `${root}/teams`)),
    getDocsFromServer(collection(db, `${root}/votes`)),
  ]);
  const defaultTeams = Array.from({ length: 32 }, (_, i) => createDefaultTeam(i + 1));
  const defaultIds = new Set(defaultTeams.map(team => team.id));
  const extraTeams = teams.docs.filter(item => !defaultIds.has(item.id));
  if (submissions.size + votes.size + extraTeams.length + 32 > 500) {
    throw new Error('초기화할 기록이 500건을 넘어 안전한 일괄 초기화를 할 수 없습니다. 관리자에게 문의하세요.');
  }
  const backup = {
    sessionId,
    exportedAt: new Date().toISOString(),
    submissions: submissions.docs.map(item => ({ id: item.id, ...item.data() })),
    teams: teams.docs.map(item => ({ id: item.id, ...item.data() })),
    votes: votes.docs.map(item => ({ id: item.id, ...item.data() })),
  };
  if (!await onBackupReady(backup)) return false;

  const batch = writeBatch(db);
  submissions.docs.forEach(item => batch.delete(item.ref));
  votes.docs.forEach(item => batch.delete(item.ref));
  extraTeams.forEach(item => batch.delete(item.ref));
  defaultTeams.forEach(team => batch.set(doc(db, `${root}/teams`, team.id), cleanForFirestore(team)));
  await batch.commit();
  return true;
}

export async function recordVoteInFirebase(
  sessionId: string = DEFAULT_SESSION_ID,
  submissionId: string,
  voterToken: string,
  newVotesCount: number
) {
  const subPath = `sessions/${sessionId}/submissions/${submissionId}`;
  const votePath = `sessions/${sessionId}/votes/${submissionId}_${voterToken}`;
  try {
    await updateDoc(doc(db, subPath), {
      votes: newVotesCount,
    });
    await setDoc(doc(db, votePath), {
      submissionId,
      voterToken,
      timestamp: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, subPath);
    throw error;
  }
}

export async function updateSessionConfigInFirebase(
  sessionId: string = DEFAULT_SESSION_ID,
  config: TrainingSessionConfig
) {
  const path = `sessions/${sessionId}`;
  try {
    await setDoc(
      doc(db, path),
      {
        sessionId,
        sessionConfig: config,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Initial Seeder for 2026onboarding
export async function seedSessionIfEmpty(
  sessionId: string = DEFAULT_SESSION_ID,
  initialTeams: TeamActivity[],
  initialSubmissions: CodeSubmission[],
  initialConfig: TrainingSessionConfig
) {
  const path = `sessions/${sessionId}`;
  try {
    const sessionSnap = await getDocFromServer(doc(db, path));
    if (sessionSnap.data()?.teamsSeeded) return;
    const teamsSnap = await getDocsFromServer(collection(db, `${path}/teams`));
    if (teamsSnap.empty) {
      console.log(`[Firebase] Initializing ${sessionId} data in Firestore...`);
      const batch = writeBatch(db);
      batch.set(doc(db, path), {
        sessionId,
        trainingTitle: initialConfig.trainingTitle,
        sessionConfig: initialConfig,
        openModules: publicationState(DEFAULT_CURRICULUM_SESSIONS),
        teamsSeeded: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      for (const t of initialTeams) {
        batch.set(doc(db, `${path}/teams`, t.id), cleanForFirestore(t));
      }
      for (const s of initialSubmissions) {
        batch.set(doc(db, `${path}/submissions`, s.id), s);
      }
      await batch.commit();
      console.log(`[Firebase] ${sessionId} seeding completed.`);
    } else {
      await setDoc(doc(db, path), { teamsSeeded: true }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
