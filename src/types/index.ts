export interface ApplicationData {
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

export interface StudentData {
  uid: string;
  applicationId: string;
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

export interface PaymentData {
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

export interface DocumentData {
  uid: string;
  studentId: string;
  documentType: 'offer_letter' | 'invoice' | 'certificate' | 'project_portfolio';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string; // admin uid
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: any;
  created_at: number;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}