# Wyffle Internship Management Backend

A comprehensive Firebase-based backend system for managing internship applications, student profiles, payments, and documents.

## 🚀 Features

### Core Functionality
- **Application Management**: Complete application submission and review workflow
- **Student Dashboard**: Comprehensive profile management and progress tracking
- **Payment Integration**: Secure Razorpay integration with coupon system
- **Document Management**: File uploads for certificates, invoices, and portfolios
- **Real-time Updates**: Live status synchronization between admin and students
- **Role-based Access**: Secure admin and student role management

### Technical Features
- **Firebase Firestore**: Scalable NoSQL database with security rules
- **Cloud Functions**: Automated workflows and email notifications
- **Firebase Storage**: Secure file storage with access controls
- **TypeScript**: Full type safety and modern JavaScript features
- **RESTful APIs**: Well-structured endpoint design
- **Comprehensive Security**: Field-level access control and validation

## 🛠 Tech Stack

- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **Payment**: Razorpay Integration
- **Runtime**: Node.js 18
- **Language**: TypeScript
- **Framework**: Express.js

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- A Firebase project set up
- Razorpay account for payment processing
- Email service credentials (Gmail/SMTP)

## ⚙️ Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd wyffle-backend
npm install
```

### 2. Firebase Configuration
```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Set up environment variables for functions
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
firebase functions:config:set admin.email="admin@wyffle.com"
firebase functions:config:set razorpay.key_id="rzp_test_xxxx"
firebase functions:config:set razorpay.key_secret="your_secret"
firebase functions:config:set frontend.url="http://localhost:5173"
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Application Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
COURSE_PRICE=399
DISCOUNT_PRICE=299
COUPON_CODE=TOP100

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@wyffle.com
```

### 4. Deploy Security Rules and Indexes
```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy storage rules
firebase deploy --only storage
```

### 5. Deploy Cloud Functions
```bash
# Deploy functions
firebase deploy --only functions
```

### 6. Set up Admin User
After deployment, set admin claims for the first admin user:
```bash
# Using Firebase CLI
firebase auth:export users.json
# Then set admin claim via Firebase Console Custom Claims
```

## 🏗 Database Schema

### Collections Structure

#### `/applications/{uid}`
```typescript
{
  uid: string;
  fullName: string;
  email: string;
  phoneNo: string;
  dateOfBirth: string;
  location: string;
  college: string;
  degree: string;
  yearOfGraduation: number;
  skills: string[];
  interestedFields: string[];
  resumeFileUrl?: string;
  resumeLink?: string;
  motivation: string;
  availability: string;
  source: string;
  status: 'pending' | 'shortlisted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
```

#### `/students/{uid}`
```typescript
{
  uid: string;
  applicationId: string;
  // ... application fields ...
  
  // Student specific fields
  coverImage?: string;
  profileImage?: string;
  institute?: string;
  course?: string;
  branch?: string;
  year?: string;
  enrollmentDate?: Date;
  bio?: string;
  batchName?: string;
  activeDays: number;
  projectsBuilt: number;
  progressPercentage: number;
  internshipStatus: 'active' | 'inactive' | 'completed';
  
  // Status tracking
  status: 'shortlisted' | 'active' | 'completed' | 'rejected';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'not_selected';
  
  // Progress steps
  progressSteps: {
    applicationSubmitted: boolean;
    resumeShortlisted: boolean;
    interviewCompleted: boolean;
    paymentProcess: boolean;
    internshipActive: boolean;
    finalShowcase: boolean;
    certificateReady: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### `/payments/{paymentId}`
```typescript
{
  uid: string;
  studentId: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  couponUsed?: string;
  discountAmount?: number;
  finalAmount: number;
  razorpayOrderId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `/documents/{documentId}`
```typescript
{
  uid: string;
  studentId: string;
  documentType: 'offer_letter' | 'invoice' | 'certificate' | 'project_portfolio';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔌 API Endpoints

### Authentication Required
All endpoints require Firebase Authentication token in headers:
```
Authorization: Bearer <firebase-id-token>
```

### Applications
- `POST /api/applications` - Submit application
- `GET /api/applications/my-application` - Get user's application
- `GET /api/applications` - Get all applications (admin only)
- `PUT /api/applications/:uid/status` - Update application status (admin only)

### Students
- `GET /api/students` - Get all students (admin only)
- `GET /api/students/profile` - Get current user's profile
- `PUT /api/students/profile` - Update user's profile
- `GET /api/students/:uid` - Get specific student (admin only)
- `PUT /api/students/:uid` - Update student (admin only)
- `PUT /api/students/:uid/status` - Update student status (admin only)
- `PUT /api/students/:uid/payment-status` - Update payment status (admin only)
- `PUT /api/students/:uid/progress` - Update progress (admin only)
- `PUT /api/students/:uid/progress-step` - Update progress step (admin only)

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Get payment history
- `POST /api/payments/apply-coupon` - Apply coupon code

### Documents
- `POST /api/documents/upload/:studentUid` - Upload document (admin only)
- `GET /api/documents/my-documents` - Get user's documents
- `GET /api/documents/student/:studentUid` - Get student documents (admin only)
- `PUT /api/documents/:documentId/status` - Enable/disable document (admin only)
- `DELETE /api/documents/:documentId` - Delete document (admin only)

### Admin
- `POST /api/admin/set-admin/:uid` - Set admin claim (admin only)
- `POST /api/admin/remove-admin/:uid` - Remove admin claim (admin only)
- `GET /api/admin/user-claims/:uid` - Get user claims (admin only)

## 🔧 Development

### Run Local Development Server
```bash
# Start the Express server
npm run dev

# Or start Firebase emulators
npm run functions:serve
```

### Build for Production
```bash
npm run build
```

### Deploy to Production
```bash
# Deploy functions only
npm run functions:deploy

# Deploy everything
firebase deploy
```

## 🔐 Security

### Firestore Security Rules
- Users can only access their own data
- Admins have full access with custom claims
- Sensitive fields are protected from user modification
- Document access is controlled by enabled flag

### Firebase Storage Rules
- Users can upload their own resumes and profile images
- Admins can upload documents for students
- File size limits enforced
- Proper access control per document type

## 📧 Email Notifications

Automated emails are sent for:
- Application submission confirmation
- Application status updates (shortlisted/rejected)
- Payment successful confirmation
- Admin notifications for new applications

## 💰 Payment Flow

1. User gets shortlisted
2. Payment option becomes available in dashboard
3. User can apply coupon code `TOP100` for discount
4. Payment order created via Razorpay
5. Payment verification with signature validation
6. Student status updated to active
7. Invoice generated and stored
8. Progress updated automatically

## 📊 Monitoring & Logging

- Cloud Functions logs available in Firebase Console
- Payment logs for debugging Razorpay integration
- Application and student activity tracking
- Automated cleanup of old data

## 🚀 Cloud Functions

Automated workflows handle:
- Email notifications on status changes
- Progress tracking updates
- Invoice generation
- Data cleanup and maintenance
- Payment verification

## 🔄 Data Flow

```
Application Submission → Email Confirmation
         ↓
Admin Review → Status Update → Email Notification
         ↓
Shortlisted → Student Record Created → Progress Initialized
         ↓
Payment Process → Razorpay Integration → Verification
         ↓
Success → Status Active → Progress Updated → Invoice Generated
```

## 📚 Support

For technical support or questions:
1. Check the logs in Firebase Console
2. Review API endpoint responses for error details
3. Verify environment variables and configurations
4. Check Firestore security rules for access issues

## 🎯 Future Enhancements

- Batch management system
- Mentor assignment workflow
- Project submission portal
- Advanced analytics dashboard
- Mobile app API support
- Integration with learning management systems