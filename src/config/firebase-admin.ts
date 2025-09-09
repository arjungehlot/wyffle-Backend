import admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config();

// For production (best practice): use env variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
} as admin.ServiceAccount;

// Initialize only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // ✅ use correct env variable
  });
}

export const db = admin.firestore();
export const storage = admin.storage();
export const bucket = admin.storage().bucket(); // ✅ add this
export const auth = admin.auth();

export default admin;
