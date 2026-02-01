import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const firestoreInstance = getFirestore();

// Opción 1: Mantener para código antiguo que busca 'adminDb'
export const adminDb = firestoreInstance;

// Opción 2: Nueva exportación estándar para tu código nuevo que busca 'db'
export const db = firestoreInstance;
