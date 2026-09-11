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
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CodeSubmission,
  TeamActivity,
  SampleDataset,
  TrainingSessionConfig,
} from '../types';

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
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connected to Firestore (2026onboarding ready)');
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
    (snapshot) => {
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
    (snapshot) => {
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

export function subscribeToDatasets(
  sessionId: string = DEFAULT_SESSION_ID,
  onData: (datasets: SampleDataset[]) => void,
  onError?: (err: any) => void
) {
  const path = `sessions/${sessionId}/datasets`;
  const q = query(collection(db, path));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: SampleDataset[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as SampleDataset), id: docSnap.id });
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
  submission: CodeSubmission
) {
  const path = `sessions/${sessionId}/submissions`;
  try {
    await setDoc(doc(db, path, submission.id), cleanForFirestore(submission), { merge: true });
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

export async function saveDatasetToFirebase(
  sessionId: string = DEFAULT_SESSION_ID,
  dataset: SampleDataset
) {
  const path = `sessions/${sessionId}/datasets`;
  try {
    await setDoc(doc(db, path, dataset.id), dataset, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${dataset.id}`);
    throw error;
  }
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
  initialDatasets: SampleDataset[],
  initialConfig: TrainingSessionConfig
) {
  const path = `sessions/${sessionId}`;
  try {
    const teamsSnap = await getDocs(collection(db, `${path}/teams`));
    if (teamsSnap.empty) {
      console.log(`[Firebase] Initializing ${sessionId} data in Firestore...`);
      // Seed Config
      await setDoc(doc(db, path), {
        sessionId,
        trainingTitle: initialConfig.trainingTitle,
        sessionConfig: initialConfig,
        updatedAt: new Date().toISOString(),
      });
      // Seed Teams
      for (const t of initialTeams) {
        await setDoc(doc(db, `${path}/teams`, t.id), t);
      }
      // Seed Submissions
      for (const s of initialSubmissions) {
        await setDoc(doc(db, `${path}/submissions`, s.id), s);
      }
      // Seed Datasets
      for (const d of initialDatasets) {
        await setDoc(doc(db, `${path}/datasets`, d.id), d);
      }
      console.log(`[Firebase] ${sessionId} seeding completed.`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
