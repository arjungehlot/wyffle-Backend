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
router.get('/', verifyToken, requireAdmin, async (req, res) => {
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
router.put('/:uid/status', verifyToken, requireAdmin, async (req, res) => {
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

export default router;