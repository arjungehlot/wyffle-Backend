import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  FileText,
  Download,
  MessageCircle,
  Settings,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  Camera,     
  Edit,        
  Save,
  CreditCard,
  Upload,
  Phone,
  MapPin,
  GraduationCap,
  BookOpen,
  Target,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";
import { MdPayment } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ApiService from '../services/api';

// ----------------------
// Types
// ----------------------
interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  firstName?: string;
  lastName?: string;
}

interface StudentData {
  uid: string;
  fullName: string;
  email: string;
  phoneNo?: string;
  institute?: string;
  course?: string;
  branch?: string;
  year?: string;
  status: string;
  progressPercentage: number;
  paymentStatus: string;
  createdAt: string;
  profileImage?: string;
  coverImage?: string;
  bio?: string;
  batchName?: string;
  activeDays?: number;
  projectsBuilt?: number;
  location?: string;
  skills?: string[];
  interestedFields?: string[];
  dateOfBirth?: string;
  progressSteps?: {
    applicationSubmitted: boolean;
    resumeShortlisted: boolean;
    interviewCompleted: boolean;
    paymentProcess: boolean;
    internshipActive: boolean;
    finalShowcase: boolean;
    certificateReady: boolean;
  };
}

interface StatusStep {
  name: string;
  status: "completed" | "active" | "pending";
  date: string;
}

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  isEnabled: boolean;
  createdAt: string;
}

interface Payment {
  orderId: string;
  amount: number;
  finalAmount: number;
  status: string;
  couponUsed?: string;
  createdAt: string;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ----------------------
// Component
// ----------------------
const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponApplied, setCouponApplied] = useState<boolean>(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalPrice, setFinalPrice] = useState<number>(399);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedProfile, setEditedProfile] = useState<Partial<StudentData>>({});

  const tabs: Tab[] = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "profile", label: "Profile", icon: User },
    { id: "status", label: "Status", icon: TrendingUp },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "payments", label: "Payments", icon: MdPayment },
    { id: "mentorship", label: "Mentorship", icon: MessageCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserData({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        await fetchStudentData(user.uid);
      } else {
        // Redirect to login if no user
        window.location.href = "/login";
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchStudentData = async (uid: string) => {
    try {
      setLoading(true);
      
      // Fetch student profile
      try {
        const profileData = await ApiService.getMyProfile();
        setStudentData(profileData.data);
        setEditedProfile(profileData.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        // If no student profile exists, create a basic one from user data
        const basicProfile: StudentData = {
          uid,
          fullName: userData?.displayName || "Student",
          email: userData?.email || "",
          status: "pending",
          progressPercentage: 0,
          paymentStatus: "not_selected",
          createdAt: new Date().toISOString(),
        };
        setStudentData(basicProfile);
        setEditedProfile(basicProfile);
      }

      // Fetch documents
      try {
        const documentsData = await ApiService.getMyDocuments();
        setDocuments(documentsData.data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }

      // Fetch payment history
      try {
        const paymentsData = await ApiService.getPaymentHistory();
        setPayments(paymentsData.data || []);
      } catch (error) {
        console.error('Error fetching payments:', error);
      }

    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("Failed to fetch student data");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const path = `${type}-images/${userData?.uid}/${file.name}`;
        const imageUrl = await ApiService.uploadToFirebase(file, path);
        
        if (type === 'profile') {
          setEditedProfile(prev => ({ ...prev, profileImage: imageUrl }));
        } else {
          setEditedProfile(prev => ({ ...prev, coverImage: imageUrl }));
        }
        
        toast.success(`${type} image uploaded successfully`);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      await ApiService.updateMyProfile(editedProfile);
      setStudentData(prev => ({ ...prev, ...editedProfile } as StudentData));
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    }
  };

  const handleApplyCoupon = async () => {
    try {
      const result = await ApiService.applyCoupon(couponCode);
      if (result.data.valid) {
        setCouponApplied(true);
        setDiscountAmount(result.data.discount);
        setFinalPrice(result.data.finalPrice);
        toast.success(`Coupon applied! You saved ₹${result.data.discount}`);
      } else {
        toast.error("Invalid coupon code");
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error("Failed to apply coupon");
    }
  };

  const handlePayment = async () => {
    try {
      if (studentData?.status !== 'shortlisted') {
        toast.error("You need to be shortlisted to make payment");
        return;
      }

      const orderData = await ApiService.createPaymentOrder(couponApplied ? couponCode : undefined);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: "Wyffle Internship",
        description: "Internship Program Fee",
        order_id: orderData.data.orderId,
        handler: async (response: any) => {
          try {
            await ApiService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment successful!");
            fetchStudentData(userData!.uid);
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: studentData?.fullName,
          email: studentData?.email,
          contact: studentData?.phoneNo,
        },
        theme: {
          color: "#7C3AED",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error("Failed to create payment order");
    }
  };

  const handleDownloadDocument = (document: Document) => {
    window.open(document.fileUrl, '_blank');
  };

  const getInitials = (fullName: string): string => {
    const names = fullName.split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const getStatusSteps = (): StatusStep[] => {
    const steps = studentData?.progressSteps;
    return [
      { 
        name: "Application Submitted", 
        status: steps?.applicationSubmitted ? "completed" : "pending", 
        date: steps?.applicationSubmitted ? studentData?.createdAt || "" : "TBD" 
      },
      { 
        name: "Resume Shortlisted", 
        status: steps?.resumeShortlisted ? "completed" : "pending", 
        date: steps?.resumeShortlisted ? studentData?.createdAt || "" : "TBD" 
      },
      { 
        name: "Interview Completed", 
        status: steps?.interviewCompleted ? "completed" : "pending", 
        date: steps?.interviewCompleted ? studentData?.createdAt || "" : "TBD" 
      },
      { 
        name: "Payment Processed", 
        status: steps?.paymentProcess ? "completed" : studentData?.status === 'shortlisted' ? "active" : "pending", 
        date: steps?.paymentProcess ? studentData?.createdAt || "" : "TBD" 
      },
      { 
        name: "Internship Active", 
        status: steps?.internshipActive ? "completed" : "pending", 
        date: steps?.internshipActive ? studentData?.createdAt || "" : "TBD" 
      },
      { 
        name: "Final Showcase", 
        status: steps?.finalShowcase ? "completed" : "pending", 
        date: steps?.finalShowcase ? studentData?.createdAt || "" : "TBD" 
      },
      { 
        name: "Certificate Ready", 
        status: steps?.certificateReady ? "completed" : "pending", 
        date: steps?.certificateReady ? studentData?.createdAt || "" : "TBD" 
      },
    ];
  };

  const renderTabContent = () => {
    if (!studentData) return null;
    
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* Welcome Card */}
            <motion.div
              className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 rounded-2xl text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {studentData.fullName}! 👋
              </h2>
              <p className="text-purple-100">
                You're {studentData.progressPercentage}% through your internship journey.
                Keep up the great work!
              </p>

              {/* Progress Bar */}
              <div className="mt-6 bg-white/20 rounded-full h-3">
                <motion.div
                  className="bg-white rounded-full h-3"
                  initial={{ width: 0 }}
                  animate={{ width: `${studentData.progressPercentage}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Calendar,
                  label: "Days Active",
                  value: studentData.activeDays || 0,
                  color: "from-blue-500 to-cyan-500",
                },
                {
                  icon: Award,
                  label: "Projects",
                  value: studentData.projectsBuilt || 0,
                  color: "from-green-500 to-emerald-500",
                },
                {
                  icon: Clock,
                  label: "Progress",
                  value: `${studentData.progressPercentage}%`,
                  color: "from-orange-500 to-red-500",
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </h3>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Current Status */}
            <motion.div
              className="bg-white p-8 rounded-2xl shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Current Status
              </h3>
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  studentData.status === 'active' ? 'bg-green-500 animate-pulse' :
                  studentData.status === 'shortlisted' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`} />
                <span className="text-lg font-medium text-gray-700 capitalize">
                  {studentData.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  studentData.status === 'active' ? 'bg-green-100 text-green-700' :
                  studentData.status === 'shortlisted' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {studentData.status === 'active' ? 'On Track' :
                   studentData.status === 'shortlisted' ? 'Payment Pending' :
                   'Under Review'}
                </span>
              </div>
            </motion.div>
          </div>
        );

      case "profile":
        return (
          <motion.div
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-purple-500 to-indigo-600 relative">
              {studentData.coverImage && (
                <img 
                  src={studentData.coverImage} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <motion.label 
                  htmlFor="cover-upload"
                  className="cursor-pointer bg-white bg-opacity-90 text-purple-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit className="w-4 h-4" />
                  <span>Change Cover</span>
                  <input 
                    id="cover-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'cover')}
                  />
                </motion.label>
              </div>
            </div>

            {/* Profile Content */}
            <div className="px-8 pb-8">
              {/* Profile Image */}
              <div className="flex flex-col items-center -mt-16">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
                    {studentData.profileImage ? (
                      <img 
                        src={studentData.profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-600 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold">
                          {getInitials(studentData.fullName)}
                        </span>
                      </div>
                    )}
                  </div>
                  <motion.label 
                    htmlFor="profile-upload"
                    className="absolute bottom-2 right-2 bg-purple-600 text-white p-2 rounded-full cursor-pointer shadow-md"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Camera className="w-4 h-4" />
                    <input 
                      id="profile-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'profile')}
                    />
                  </motion.label>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-4">
                  {studentData.fullName}
                </h2>
                <p className="text-gray-600">{studentData.course} • {studentData.institute}</p>
              </div>

              {/* Profile Information */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Profile Information
                  </h3>
                  <motion.button
                    className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                      isEditing 
                        ? 'bg-green-600 text-white' 
                        : 'bg-purple-600 text-white'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      if (isEditing) {
                        handleSaveProfile();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                  >
                    {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
                  </motion.button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editedProfile.fullName || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, fullName: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={editedProfile.email || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editedProfile.phoneNo || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, phoneNo: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <GraduationCap className="w-4 h-4 inline mr-2" />
                      Institute
                    </label>
                    <input
                      type="text"
                      value={editedProfile.institute || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, institute: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <BookOpen className="w-4 h-4 inline mr-2" />
                      Course
                    </label>
                    <input
                      type="text"
                      value={editedProfile.course || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, course: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Target className="w-4 h-4 inline mr-2" />
                      Branch
                    </label>
                    <input
                      type="text"
                      value={editedProfile.branch || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, branch: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Year
                    </label>
                    <input
                      type="text"
                      value={editedProfile.year || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, year: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={editedProfile.location || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Bio Section */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editedProfile.bio || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 disabled:bg-gray-50"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Skills Section */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editedProfile.skills?.join(', ') || ''}
                    onChange={(e) => setEditedProfile(prev => ({ 
                      ...prev, 
                      skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                    }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="React, Node.js, Python, etc."
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "status":
        return (
          <motion.div
            className="bg-white p-8 rounded-2xl shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Internship Progress
            </h3>
            <div className="space-y-4">
              {getStatusSteps().map((step, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 rounded-xl border border-gray-100"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === "completed"
                        ? "bg-green-100"
                        : step.status === "active"
                        ? "bg-blue-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {step.status === "completed" && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {step.status === "active" && (
                      <Clock className="w-5 h-5 text-blue-600" />
                    )}
                    {step.status === "pending" && (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{step.name}</h4>
                    <p className="text-sm text-gray-500">
                      {step.date !== 'TBD' ? new Date(step.date).toLocaleDateString() : step.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "documents":
        return (
          <motion.div
            className="bg-white p-8 rounded-2xl shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Documents & Downloads
            </h3>
            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No documents available yet</p>
                  <p className="text-gray-400">Documents will appear here once uploaded by admin</p>
                </div>
              ) : (
                documents.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center space-x-4">
                      <FileText className="w-6 h-6 text-purple-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{doc.fileName}</h4>
                        <p className="text-sm text-gray-500 capitalize">{doc.documentType.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-400">
                          Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </motion.button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        );

      case "payments":
        return (
          <motion.div
            className="bg-white p-8 rounded-2xl shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Payment Details
            </h3>
            
            {/* Batch Information */}
            <div className="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-200">
              <h4 className="text-lg font-semibold text-purple-800 mb-2">
                {studentData.batchName || "Web Development Internship"}
              </h4>
              <p className="text-gray-600">Join our exclusive web development program with hands-on projects and mentorship</p>
            </div>
            
            {/* Payment Status */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Payment Status</h4>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className={`w-3 h-3 rounded-full ${
                  studentData.paymentStatus === "not_selected" ? "bg-gray-400" :
                  studentData.paymentStatus === "pending" ? "bg-yellow-400" :
                  studentData.paymentStatus === "paid" ? "bg-green-400" :
                  "bg-red-400"
                }`}></div>
                <span className="font-medium text-gray-700 capitalize">
                  {studentData.paymentStatus.replace('_', ' ')}
                </span>
                {studentData.paymentStatus === "not_selected" && (
                  <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    Not Shortlisted
                  </span>
                )}
                {studentData.paymentStatus === "pending" && (
                  <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    Payment Required
                  </span>
                )}
                {studentData.paymentStatus === "paid" && (
                  <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Payment Complete
                  </span>
                )}
              </div>
            </div>
            
            {/* Pricing Information */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Pricing Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Program Fee</span>
                  <span className="font-medium">₹399/-</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({couponCode})</span>
                    <span className="font-medium">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-lg">
                  <span>Total Amount</span>
                  <span>₹{finalPrice}/-</span>
                </div>
              </div>
            </div>
            
            {/* Coupon Application */}
            {studentData.status === 'shortlisted' && studentData.paymentStatus !== 'paid' && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Apply Coupon</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <motion.button
                    className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleApplyCoupon}
                  >
                    Apply
                  </motion.button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Use code <span className="font-mono bg-gray-100 px-2 py-1 rounded">TOP100</span> for ₹100 instant discount
                </p>
              </div>
            )}
            
            {/* Payment Button */}
            {studentData.status === 'shortlisted' && studentData.paymentStatus !== 'paid' && (
              <motion.button
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
              >
                Pay Now - ₹{finalPrice}/-
              </motion.button>
            )}

            {/* Not Selected Message */}
            {studentData.status !== 'shortlisted' && studentData.status !== 'active' && (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-200">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">
                    Payment will be available once your application is shortlisted.
                  </span>
                </div>
              </div>
            )}
            
            {/* Payment Success Message */}
            {studentData.paymentStatus === 'paid' && (
              <motion.div
                className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">
                    Payment successful! Your enrollment is confirmed.
                  </span>
                </div>
              </motion.div>
            )}

            {/* Payment History */}
            {payments.length > 0 && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h4>
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <div key={payment.orderId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium">Order #{payment.orderId}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{payment.finalAmount}</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );

      default:
        return (
          <motion.div
            className="bg-white p-8 rounded-2xl shadow-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Coming Soon</h3>
            <p className="text-gray-600">
              This section is under development.
            </p>
          </motion.div>
        );
    }
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!userData || !studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please login to access your dashboard</p>
          <Link to="/login" className="bg-purple-600 text-white px-6 py-3 rounded-lg">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">W</span>
                </div>
                <span className="text-2xl font-bold gradient-text">Wyffle</span>
              </Link>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 font-medium">Student Dashboard</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">{studentData.fullName}</p>
                <p className="text-sm text-gray-500">
                  {studentData.institute || 'Student'}
                </p>
              </div>
              {studentData.profileImage ? (
                <img
                  src={studentData.profileImage}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {getInitials(studentData.fullName)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <motion.div
              className="bg-white rounded-2xl shadow-lg p-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-purple-600 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    whileHover={{ x: activeTab === tab.id ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;