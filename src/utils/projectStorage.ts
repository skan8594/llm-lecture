import firebaseConfig from '../../firebase-applet-config.json';

export const projectStorageKey = (key: string) => `${firebaseConfig.projectId}:${key}`;
