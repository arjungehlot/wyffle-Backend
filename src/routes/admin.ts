import express from 'express';
import { auth } from '../config/firebase';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Set admin claim
router.post('/set-admin/:uid', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    
    await auth.setCustomUserClaims(uid, { admin: true });
    
    res.json({
      success: true,
      message: 'Admin claim set successfully'
    });
  } catch (error) {
    console.error('Error setting admin claim:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set admin claim'
    });
  }
});

// Remove admin claim
router.post('/remove-admin/:uid', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    
    await auth.setCustomUserClaims(uid, { admin: false });
    
    res.json({
      success: true,
      message: 'Admin claim removed successfully'
    });
  } catch (error) {
    console.error('Error removing admin claim:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove admin claim'
    });
  }
});

// Get user claims
router.get('/user-claims/:uid', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    
    const userRecord = await auth.getUser(uid);
    
    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        customClaims: userRecord.customClaims || {}
      }
    });
  } catch (error) {
    console.error('Error fetching user claims:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user claims'
    });
  }
});

export default router;