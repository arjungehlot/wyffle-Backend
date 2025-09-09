import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../config/firebase';
import { PaymentData, RazorpayOrder, PaymentVerification } from '../types';
import { StudentService } from './studentService';

export class PaymentService {
  private razorpay: Razorpay;
  private paymentsCollection = db.collection('payments');
  private studentService = new StudentService();

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createOrder(uid: string, couponCode?: string): Promise<{ orderId: string; amount: number; currency: string }> {
    try {
      const student = await this.studentService.getStudent(uid);
      if (!student || student.status !== 'shortlisted') throw new Error('Student not eligible for payment');

      let amount = parseInt(process.env.COURSE_PRICE!) * 100;
      let discountAmount = 0;
      let finalAmount = amount;

      if (couponCode && couponCode.toUpperCase() === process.env.COUPON_CODE) {
        finalAmount = parseInt(process.env.DISCOUNT_PRICE!) * 100;
        discountAmount = amount - finalAmount;
      }

      // ✅ Safe receipt id (<=40 chars)
      const shortUid = uid.substring(0, 10);
      const receiptId = `receipt_${shortUid}_${Date.now()}`;

      const options = {
        amount: finalAmount,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          studentId: uid,
          couponUsed: couponCode || '',
          discountAmount: discountAmount.toString(),
        },
      };

      const order = await this.razorpay.orders.create(options) as RazorpayOrder;

      const paymentData: PaymentData = {
        uid,
        studentId: uid,
        orderId: order.id,
        amount: amount / 100,
        currency: order.currency,
        status: 'created',
        couponUsed: couponCode,
        discountAmount: discountAmount / 100,
        finalAmount: finalAmount / 100,
        razorpayOrderId: order.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.paymentsCollection.doc(order.id).set(paymentData);

      return {
        orderId: order.id,
        amount: finalAmount,
        currency: order.currency,
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  async verifyPayment(verification: PaymentVerification): Promise<boolean> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verification;

      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) throw new Error('Invalid payment signature');

      await this.paymentsCollection.doc(razorpay_order_id).update({
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: 'paid',
        updatedAt: new Date(),
      });

      const paymentDoc = await this.paymentsCollection.doc(razorpay_order_id).get();
      const paymentData = paymentDoc.data() as PaymentData;

      await this.studentService.updatePaymentStatus(paymentData.uid, 'paid');

      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw new Error('Payment verification failed');
    }
  }

  async getPaymentHistory(uid: string) {
    const snapshot = await this.paymentsCollection.where('uid', '==', uid).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => doc.data() as PaymentData);
  }

  async applyCoupon(couponCode: string) {
    const isValid = couponCode.toUpperCase() === process.env.COUPON_CODE;
    const originalPrice = parseInt(process.env.COURSE_PRICE!);
    const discountPrice = parseInt(process.env.DISCOUNT_PRICE!);

    return isValid
      ? { valid: true, discount: originalPrice - discountPrice, finalPrice: discountPrice }
      : { valid: false, discount: 0, finalPrice: originalPrice };
  }
}
