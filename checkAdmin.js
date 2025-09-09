import 'dotenv/config'; 
import admin from 'firebase-admin';

// Build the service account object from environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Validate environment variables
if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error('❌ Missing Firebase environment variables');
  process.exit(1);
}

// Initialize the Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

const uidToSetAsAdmin = '9YpHtiFsu2gwspHZgFrp5DFPAFJ3';

async function setAdminClaim() {
  try {
    console.log('Setting admin claim for UID:', uidToSetAsAdmin);
    
    // First check if user exists
    const userRecord = await admin.auth().getUser(uidToSetAsAdmin);
    console.log(`User found: ${userRecord.email}`);
    
    // Set the admin custom claim
    await admin.auth().setCustomUserClaims(uidToSetAsAdmin, { admin: true });
    console.log('✅ Admin claim set successfully!');
    
    // Verify the claim was set
    const updatedUser = await admin.auth().getUser(uidToSetAsAdmin);
    console.log('Updated Custom Claims:', updatedUser.customClaims);
    
    console.log('🎉 User is now an admin!');
    console.log('⚠️  User must sign out and sign back in for changes to take effect');
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ User not found with UID:', uidToSetAsAdmin);
    } else {
      console.error('❌ Error setting admin claim:', error);
    }
  }
}

// Run the function
setAdminClaim();