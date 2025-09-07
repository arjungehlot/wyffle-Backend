import admin from 'firebase-admin';
// Note the 'with { type: "json" }' part for importing JSON files in ES modules
import serviceAccount from './wyffle-firebase-adminsdk-fbsvc-32d4e4741b.json' with { type: 'json' };

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// The UID of the user you want to make an admin
const uidToMakeAdmin = '9YpHtiFsu2gwspHZgFrp5DFPAFJ3';

// Set the custom claim
try {
  await admin.auth().setCustomUserClaims(uidToMakeAdmin, { admin: true });
  console.log(`Successfully set admin claim for user: ${uidToMakeAdmin}`);
} catch (error) {
  console.error('Error setting custom claims:', error);
}