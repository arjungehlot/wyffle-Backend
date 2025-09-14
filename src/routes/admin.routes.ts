import express from 'express';
// import admin from 'firebase-admin'; // Import Admin SDK
import { verifyToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import admin from '../config/firebase'; // Your admin setup file
const router = express.Router();

// --------------------
// Set admin claim (Admin only)
// --------------------
router.post('/set-admin/:uid', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.params;

    // Use Firebase Admin SDK, not Client SDK
    await admin.auth().setCustomUserClaims(uid, { admin: true });

    res.json({
      success: true,
      message: 'Admin claim set successfully',
    });
  } catch (error) {
    console.error('Error setting admin claim:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set admin claim',
    });
  }
});

// --------------------
// Remove admin claim (Admin only)
// --------------------
router.post('/remove-admin/:uid', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.params;

    // Use Firebase Admin SDK
    await admin.auth().setCustomUserClaims(uid, { admin: false });

    res.json({
      success: true,
      message: 'Admin claim removed successfully',
    });
  } catch (error) {
    console.error('Error removing admin claim:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove admin claim',
    });
  }
});

// --------------------
// Get user claims (Admin only)
// --------------------
router.get('/user-claims/:uid', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.params;

    // Use Firebase Admin SDK
    const userRecord = await admin.auth().getUser(uid);

    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        customClaims: userRecord.customClaims || {},
      },
    });
  } catch (error) {
    console.error('Error fetching user claims:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user claims',
    });
  }
});

export default router;