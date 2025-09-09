import express from 'express';
import { PaymentService } from '../services/paymentService';
import { verifyToken, requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const paymentService = new PaymentService();

router.post('/create-order', verifyToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { couponCode } = req.body;

    const order = await paymentService.createOrder(uid, couponCode);
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to create payment order' });
  }
});

router.post('/verify', verifyToken, requireAuth, async (req, res) => {
  try {
    const verification = req.body;
    const isValid = await paymentService.verifyPayment(verification);

    if (!isValid) return res.status(400).json({ success: false, error: 'Payment verification failed' });

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

router.get('/history', verifyToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const payments = await paymentService.getPaymentHistory(uid);
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment history' });
  }
});

router.post('/apply-coupon', verifyToken, requireAuth, async (req, res) => {
  try {
    const { couponCode } = req.body;
    if (!couponCode) return res.status(400).json({ success: false, error: 'Coupon code is required' });

    const result = await paymentService.applyCoupon(couponCode);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ success: false, error: 'Failed to apply coupon' });
  }
});

export default router;
