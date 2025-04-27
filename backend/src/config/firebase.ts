import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccount) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID
});

export const db = admin.firestore();
export const auth = admin.auth();
export default admin; 