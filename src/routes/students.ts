import express from 'express';
import { StudentService } from '../services/studentService';
import { verifyToken, requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const studentService = new StudentService();

// Get all students (admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const students = await studentService.getAllStudents();
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students'
    });
  }
});

// Get current user's student profile
router.get('/profile', verifyToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const student = await studentService.getStudent(uid);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student profile'
    });
  }
});

// Update student profile
router.put('/profile', verifyToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const updateData = req.body;

    // Remove sensitive fields that users can't update
    delete updateData.uid;
    delete updateData.status;
    delete updateData.paymentStatus;
    delete updateData.progressSteps;
    delete updateData.createdAt;

    await studentService.updateStudent(uid, updateData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Get specific student (admin only)
router.get('/:uid', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const student = await studentService.getStudent(uid);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student'
    });
  }
});

// Update student (admin only)
router.put('/:uid', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const updateData = req.body;

    await studentService.updateStudent(uid, updateData);
    
    res.json({
      success: true,
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update student'
    });
  }
});

// Update student status (admin only)
router.put('/:uid/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { status } = req.body;

    if (!['shortlisted', 'active', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    await studentService.updateStudentStatus(uid, status);
    
    res.json({
      success: true,
      message: 'Student status updated successfully'
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update student status'
    });
  }
});

// Update payment status (admin only)
router.put('/:uid/payment-status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { paymentStatus } = req.body;

    if (!['paid', 'pending', 'failed', 'not_selected'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment status'
      });
    }

    await studentService.updatePaymentStatus(uid, paymentStatus);
    
    res.json({
      success: true,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment status'
    });
  }
});

// Update progress (admin only)
router.put('/:uid/progress', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { progressPercentage } = req.body;

    if (typeof progressPercentage !== 'number' || progressPercentage < 0 || progressPercentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid progress percentage'
      });
    }

    await studentService.updateProgress(uid, progressPercentage);
    
    res.json({
      success: true,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress'
    });
  }
});

// Update progress step (admin only)
router.put('/:uid/progress-step', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { step, completed } = req.body;

    const validSteps = [
      'applicationSubmitted',
      'resumeShortlisted',
      'interviewCompleted',
      'paymentProcess',
      'internshipActive',
      'finalShowcase',
      'certificateReady'
    ];

    if (!validSteps.includes(step)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid progress step'
      });
    }

    await studentService.updateProgressStep(uid, step, completed);
    
    res.json({
      success: true,
      message: 'Progress step updated successfully'
    });
  } catch (error) {
    console.error('Error updating progress step:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress step'
    });
  }
});

export default router;