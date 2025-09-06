import 'dotenv/config'; 
import admin from 'firebase-admin';

// Build the service account object from environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Initialize the Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Paste the UID of the user you are trying to make an admin
const uidToCheck = '9YpHtiFsu2gwspHZgFrp5DFPAFJ3';

// Fetch the user record from Firebase
admin.auth().getUser(uidToCheck)
  .then((userRecord) => {
    console.log(`Successfully fetched user data for: ${userRecord.email}`);
    console.log('Custom Claims:', userRecord.customClaims); // This is the important part!
  })
  .catch((error) => {
    console.error('Error fetching user data:', error);
  });