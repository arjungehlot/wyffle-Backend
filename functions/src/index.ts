import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Configure email transporter (configure with your email service)
const transporter = nodemailer.createTransporter({
  service: 'gmail', // or your email service
  auth: {
    user: functions.config().email?.user || process.env.EMAIL_USER,
    pass: functions.config().email?.password || process.env.EMAIL_PASSWORD,
  },
});

// Trigger when application is created
export const onApplicationCreated = functions.firestore
  .document('applications/{uid}')
  .onCreate(async (snapshot, context) => {
    try {
      const applicationData = snapshot.data();
      const uid = context.params.uid;

      console.log(`New application created for user: ${uid}`);

      // Send confirmation email to user
      if (applicationData.email) {
        await transporter.sendMail({
          from: functions.config().email?.user || process.env.EMAIL_USER,
          to: applicationData.email,
          subject: 'Application Submitted - Wyffle Internship',
          html: `
            <h2>Application Submitted Successfully!</h2>
            <p>Dear ${applicationData.fullName},</p>
            <p>Thank you for applying to the Wyffle Internship Program. We have received your application and our team will review it shortly.</p>
            <p>You will receive an email notification once your application status is updated.</p>
            <br>
            <p>Best regards,<br>Wyffle Team</p>
          `,
        });
      }

      // Send notification to admin (optional)
      const adminEmail = functions.config().admin?.email || process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await transporter.sendMail({
          from: functions.config().email?.user || process.env.EMAIL_USER,
          to: adminEmail,
          subject: 'New Internship Application - Wyffle',
          html: `
            <h2>New Application Received</h2>
            <p>A new internship application has been submitted:</p>
            <ul>
              <li><strong>Name:</strong> ${applicationData.fullName}</li>
              <li><strong>Email:</strong> ${applicationData.email}</li>
              <li><strong>College:</strong> ${applicationData.college}</li>
              <li><strong>Skills:</strong> ${applicationData.skills?.join(', ') || 'N/A'}</li>
            </ul>
            <p>Please review the application in the admin panel.</p>
          `,
        });
      }

      return null;
    } catch (error) {
      console.error('Error processing application creation:', error);
      return null;
    }
  });

// Trigger when application status is updated
export const onApplicationStatusUpdated = functions.firestore
  .document('applications/{uid}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const uid = context.params.uid;

      // Check if status changed
      if (beforeData.status !== afterData.status) {
        console.log(`Application status updated for user: ${uid} from ${beforeData.status} to ${afterData.status}`);

        // Send email notification based on new status
        let emailSubject = '';
        let emailContent = '';

        switch (afterData.status) {
          case 'shortlisted':
            emailSubject = 'Congratulations! You have been shortlisted - Wyffle Internship';
            emailContent = `
              <h2>Congratulations! 🎉</h2>
              <p>Dear ${afterData.fullName},</p>
              <p>Great news! Your application for the Wyffle Internship Program has been <strong>shortlisted</strong>.</p>
              <p>You can now proceed with the payment to secure your spot in the program. Please login to your dashboard to complete the payment process.</p>
              <p>Payment Details:</p>
              <ul>
                <li>Course Fee: ₹399</li>
                <li>Use coupon code <strong>TOP100</strong> to get the discounted price of ₹299</li>
              </ul>
              <p>Login to your dashboard: <a href="${functions.config().frontend?.url || process.env.FRONTEND_URL}/dashboard">Dashboard</a></p>
              <br>
              <p>Best regards,<br>Wyffle Team</p>
            `;
            break;

          case 'rejected':
            emailSubject = 'Application Update - Wyffle Internship';
            emailContent = `
              <h2>Application Update</h2>
              <p>Dear ${afterData.fullName},</p>
              <p>Thank you for your interest in the Wyffle Internship Program. After careful consideration, we regret to inform you that we cannot move forward with your application at this time.</p>
              <p>We encourage you to apply for future programs and continue developing your skills.</p>
              <br>
              <p>Best regards,<br>Wyffle Team</p>
            `;
            break;
        }

        if (emailSubject && afterData.email) {
          await transporter.sendMail({
            from: functions.config().email?.user || process.env.EMAIL_USER,
            to: afterData.email,
            subject: emailSubject,
            html: emailContent,
          });
        }
      }

      return null;
    } catch (error) {
      console.error('Error processing application status update:', error);
      return null;
    }
  });

// Trigger when student is created (shortlisted)
export const onStudentCreated = functions.firestore
  .document('students/{uid}')
  .onCreate(async (snapshot, context) => {
    try {
      const studentData = snapshot.data();
      const uid = context.params.uid;

      console.log(`Student record created for user: ${uid}`);

      // Initialize progress tracking
      await db.collection('students').doc(uid).update({
        'progressSteps.applicationSubmitted': true,
        'progressSteps.resumeShortlisted': true,
        progressPercentage: 25, // 2 out of 7 steps completed
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    } catch (error) {
      console.error('Error processing student creation:', error);
      return null;
    }
  });

// Trigger when payment is successful
export const onPaymentSuccess = functions.firestore
  .document('payments/{paymentId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const paymentId = context.params.paymentId;

      // Check if payment status changed to 'paid'
      if (beforeData.status !== 'paid' && afterData.status === 'paid') {
        console.log(`Payment successful for order: ${paymentId}`);

        const uid = afterData.uid;

        // Update student progress
        await db.collection('students').doc(uid).update({
          paymentStatus: 'paid',
          'progressSteps.paymentProcess': true,
          'progressSteps.internshipActive': true,
          progressPercentage: 60, // 4 out of 7 steps completed
          internshipStatus: 'active',
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Get student data for email
        const studentDoc = await db.collection('students').doc(uid).get();
        const studentData = studentDoc.data();

        // Send payment confirmation email
        if (studentData?.email) {
          await transporter.sendMail({
            from: functions.config().email?.user || process.env.EMAIL_USER,
            to: studentData.email,
            subject: 'Payment Successful - Welcome to Wyffle Internship!',
            html: `
              <h2>Payment Successful! Welcome aboard! 🚀</h2>
              <p>Dear ${studentData.fullName},</p>
              <p>Congratulations! Your payment has been processed successfully and you are now enrolled in the Wyffle Internship Program.</p>
              
              <h3>Payment Details:</h3>
              <ul>
                <li><strong>Payment ID:</strong> ${afterData.paymentId}</li>
                <li><strong>Amount Paid:</strong> ₹${afterData.finalAmount}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
              
              <p>Your internship is now <strong>active</strong>! You can track your progress and access all resources from your dashboard.</p>
              
              <p>Access your dashboard: <a href="${functions.config().frontend?.url || process.env.FRONTEND_URL}/dashboard">Dashboard</a></p>
              
              <h3>What's Next?</h3>
              <ul>
                <li>Complete your profile setup</li>
                <li>Attend the orientation session</li>
                <li>Start working on your first project</li>
                <li>Connect with your mentor</li>
              </ul>
              
              <p>We're excited to have you on this journey!</p>
              
              <br>
              <p>Best regards,<br>Wyffle Team</p>
            `,
          });
        }

        console.log(`Student status updated to active for user: ${uid}`);
      }

      return null;
    } catch (error) {
      console.error('Error processing payment success:', error);
      return null;
    }
  });

// Generate invoice after successful payment
export const generateInvoice = functions.firestore
  .document('payments/{paymentId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();

      if (beforeData.status !== 'paid' && afterData.status === 'paid') {
        const paymentId = context.params.paymentId;
        const uid = afterData.uid;

        // Generate invoice document
        const invoiceData = {
          uid,
          studentId: uid,
          documentType: 'invoice',
          fileName: `invoice_${paymentId}.pdf`,
          fileUrl: '', // This would be generated by a PDF service
          fileSize: 0,
          mimeType: 'application/pdf',
          uploadedBy: 'system',
          isEnabled: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentDetails: {
            paymentId: afterData.paymentId,
            orderId: afterData.orderId,
            amount: afterData.finalAmount,
            couponUsed: afterData.couponUsed,
            discountAmount: afterData.discountAmount,
          },
        };

        await db.collection('documents').add(invoiceData);
        console.log(`Invoice generated for payment: ${paymentId}`);
      }

      return null;
    } catch (error) {
      console.error('Error generating invoice:', error);
      return null;
    }
  });

// Cleanup function for old data (runs daily)
export const cleanupOldData = functions.pubsub
  .schedule('0 2 * * *') // Run daily at 2 AM
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Clean up old rejected applications
      const rejectedApplications = await db
        .collection('applications')
        .where('status', '==', 'rejected')
        .where('updatedAt', '<', thirtyDaysAgo)
        .limit(100)
        .get();

      const batch = db.batch();
      rejectedApplications.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      if (!rejectedApplications.empty) {
        await batch.commit();
        console.log(`Cleaned up ${rejectedApplications.size} old rejected applications`);
      }

      return null;
    } catch (error) {
      console.error('Error in cleanup function:', error);
      return null;
    }
  });

// Health check function
export const healthCheck = functions.https.onRequest((request, response) => {
  response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    functions: [
      'onApplicationCreated',
      'onApplicationStatusUpdated',
      'onStudentCreated',
      'onPaymentSuccess',
      'generateInvoice',
      'cleanupOldData',
    ],
  });
});