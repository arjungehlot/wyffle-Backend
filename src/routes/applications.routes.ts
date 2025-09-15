import express from 'express';
import { ApplicationService } from '../services/applicationService';
import { verifyToken, requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';

const router = express.Router();
const applicationService = new ApplicationService();

// Submit application (authenticated users only)
router.post("/", verifyToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const applicationData = req.body;

    // ✅ Ensure we always check userId
    const existingApp = await db
      .collection("applications")
      .where("userId", "==", uid)
      .limit(1)
      .get();

    if (!existingApp.empty) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted an application.",
      });
    }

    // ✅ Always save with userId
    const newApplication = {
      ...applicationData,
      userId: uid,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("applications").add(newApplication);

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      applicationId: docRef.id,
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit application",
    });
  }
});


// Get user's application
router.get('/my-application', verifyToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const application = await applicationService.getApplication(uid);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application'
    });
  }
});

// Get all applications (admin only)
router.get('/', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const applications = await applicationService.getAllApplications();
    
    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
});

// Update application status (admin only)
router.put('/:id/status', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;  // <-- this should match application.id
    const { status } = req.body;

    if (!['pending', 'shortlisted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    await applicationService.updateApplicationStatus(id, status);

    res.json({
      success: true,
      message: 'Application status updated successfully'
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application status'
    });
  }
});


// New route: Get application by UID (authenticated users)
router.get("/:id", verifyToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;   // not uid
    if (!id) {
      return res.status(400).json({ success: false, error: "Application ID is required" });
    }

    const application = await applicationService.getApplicationById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    // Ownership check
    if (application.userId !== req.user!.uid && !req.user!.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch application",
    });
  }
});


// New route: Update application (users can update their own)
router.put('/:id', verifyToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const uid = req.user!.uid;
    const updateData = req.body;

    // Verify the user owns this application
    const application = await applicationService.getApplicationById(id);
    if (!application || application.uid !== uid) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own application'
      });
    }

    await applicationService.updateApplication(id, updateData);
    
    res.json({
      success: true,
      message: 'Application updated successfully'
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application'
    });
  }
});

export default router;