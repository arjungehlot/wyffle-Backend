import express from 'express';
import { ApplicationService } from '../services/applicationService';
import { verifyToken, requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const applicationService = new ApplicationService();

// Submit application (authenticated users only)
router.post('/', verifyToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const applicationData = req.body;

    const applicationId = await applicationService.createApplication(uid, applicationData);
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit application'
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
router.put('/:uid/status', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.params;
    const { status } = req.body;

    if (!['pending', 'shortlisted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    await applicationService.updateApplicationStatus(uid, status);
    
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

// New route: Get application by ID (authenticated users)
router.get('/:id', verifyToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const application = await applicationService.getApplicationById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Optional: Add ownership check if users should only see their own applications
    if (application.uid !== req.user!.uid && !req.user!.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
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