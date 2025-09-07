import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  CreditCard,
  Settings,
  Search,
  Filter,
  Mail,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  X,
  Download,
  Send,
  RefreshCw,
  Upload,
  Trash2,
  UserCheck,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import ApiService from '../services/api';
import logo from "../Assets/Logo-BG.jpg";

// Interface definitions
interface Student {
  uid: string;
  fullName: string;
  email: string;
  phoneNo: string;
  institute?: string;
  course?: string;
  branch?: string;
  year?: string;
  status: string;
  paymentStatus: string;
  progressPercentage: number;
  batchName?: string;
  activeDays?: number;
  projectsBuilt?: number;
  bio?: string;
  profileImage?: string;
  createdAt: string;
  skills: string[];
  location?: string;
  resumeLink?: string;
  college?: string;
  degree?: string;
  yearOfGraduation?: number;
  interestedFields?: string[];
  motivation?: string;
  availability?: string;
  source?: string;
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

interface Application {
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
  resumeLink?: string;
  motivation: string;
  availability: string;
  source: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  id: string;
  uid: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  isEnabled: boolean;
  createdAt: string;
}

interface Payment {
  uid: string;
  orderId: string;
  amount: number;
  status: string;
  couponUsed?: string;
  finalAmount: number;
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("students");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isAppViewModalOpen, setIsAppViewModalOpen] = useState<boolean>(false);
  const [isAppEditModalOpen, setIsAppEditModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [editedApplication, setEditedApplication] = useState<Application | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState<string>("offer_letter");
  const [uploadStudentUid, setUploadStudentUid] = useState<string>("");

  const tabs = [
    { id: "students", label: "Students", icon: Users },
    { id: "applications", label: "Applications", icon: FileText },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const statusOptions = [
    "shortlisted",
    "active",
    "completed",
    "rejected",
    "pending",
  ];
  
  const paymentStatusOptions = [
    "paid",
    "pending",
    "failed",
    "not_selected",
  ];

  const applicationStatusOptions = [
    "pending",
    "shortlisted",
    "rejected",
  ];

  const documentTypes = [
    { value: "offer_letter", label: "Offer Letter" },
    { value: "certificate", label: "Certificate" },
    { value: "invoice", label: "Invoice" },
    { value: "project_portfolio", label: "Project Portfolio" },
  ];

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          await authenticateAdmin();
        } else {
          setIsAuthenticated(true);
          fetchData();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        await authenticateAdmin();
      }
    };

    checkAuth();
  }, []);

  const authenticateAdmin = async () => {
    try {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
      
      const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const token = await userCredential.user.getIdToken();
      
      localStorage.setItem('accessToken', token);
      localStorage.setItem('adminUser', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        isAdmin: true
      }));
      
      setIsAuthenticated(true);
      toast.success('Admin authenticated successfully');
      fetchData();
    } catch (error) {
      console.error('Admin authentication failed:', error);
      toast.error('Admin authentication failed');
    }
  };

  // Fetch data from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch students
      try {
        const studentsData = await ApiService.getAllStudents();
        setStudents(studentsData.data || []);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
      
      // Fetch applications
      try {
        const applicationsData = await ApiService.getAllApplications();
        setApplications(applicationsData.data || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
      }

      // Fetch payments
      try {
        const paymentsData = await ApiService.getPaymentHistory();
        setPayments(paymentsData.data || []);
      } catch (error) {
        console.error('Error fetching payments:', error);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "text-blue-700 bg-blue-100";
      case "shortlisted":
        return "text-yellow-700 bg-yellow-100";
      case "completed":
        return "text-green-700 bg-green-100";
      case "pending":
        return "text-gray-700 bg-gray-100";
      case "rejected":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case "paid":
        return "text-green-700 bg-green-100";
      case "pending":
        return "text-yellow-700 bg-yellow-100";
      case "failed":
        return "text-red-700 bg-red-100";
      case "not_selected":
        return "text-gray-700 bg-gray-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.college?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.college.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewStudent = (student: Student): void => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleViewApplication = (application: Application): void => {
    setSelectedApplication(application);
    setIsAppViewModalOpen(true);
  };

  const handleEditStudent = (student: Student): void => {
    setSelectedStudent(student);
    setEditedStudent({ ...student });
    setIsEditModalOpen(true);
  };

  const handleEditApplication = (application: Application): void => {
    setSelectedApplication(application);
    setEditedApplication({ ...application });
    setIsAppEditModalOpen(true);
  };

  const handleSaveStudentChanges = async (): Promise<void> => {
    if (!editedStudent) return;
    
    try {
      await ApiService.updateStudent(editedStudent.uid, editedStudent);
      toast.success("Student updated successfully");
      fetchData();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student");
    }
  };

  const handleSaveApplicationChanges = async (): Promise<void> => {
    if (!editedApplication) return;
    
    try {
      await ApiService.updateApplicationStatus(editedApplication.uid, editedApplication.status);
      toast.success("Application updated successfully");
      fetchData();
      setIsAppEditModalOpen(false);
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application");
    }
  };

  const handleUpdateStudentStatus = async (uid: string, status: string): Promise<void> => {
    try {
      await ApiService.updateStudentStatus(uid, status);
      toast.success("Student status updated successfully");
      fetchData();
    } catch (error) {
      console.error("Error updating student status:", error);
      toast.error("Failed to update student status");
    }
  };

  const handleUpdatePaymentStatus = async (uid: string, paymentStatus: string): Promise<void> => {
    try {
      await ApiService.updatePaymentStatus(uid, paymentStatus);
      toast.success("Payment status updated successfully");
      fetchData();
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to update payment status");
    }
  };

  const handleUpdateProgress = async (uid: string, progressPercentage: number): Promise<void> => {
    try {
      await ApiService.updateProgress(uid, progressPercentage);
      toast.success("Progress updated successfully");
      fetchData();
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const handleUploadDocument = async (): Promise<void> => {
    if (!uploadFile || !uploadStudentUid) {
      toast.error("Please select a file and student");
      return;
    }

    try {
      await ApiService.uploadDocument(uploadStudentUid, uploadFile, uploadDocumentType);
      toast.success("Document uploaded successfully");
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadStudentUid("");
      fetchData();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    }
  };

  const handleSendEmail = (email: string): void => {
    window.open(
      `mailto:${email}?subject=Update from Wyffle Internship Program`,
      "_blank"
    );
  };

  const handleDownloadResume = (resumeLink: string): void => {
    window.open(resumeLink, "_blank");
  };

  // Modal Components
  const ViewStudentModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Student Details</h3>
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center">
                  {selectedStudent.profileImage ? (
                    <img 
                      src={selectedStudent.profileImage} 
                      alt={selectedStudent.fullName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {selectedStudent.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-semibold">{selectedStudent.fullName}</h4>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                  <p className="text-gray-600">{selectedStudent.phoneNo}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold mb-3">Academic Information</h5>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">College:</span> {selectedStudent.college}</p>
                    <p><span className="text-gray-500">Course:</span> {selectedStudent.course}</p>
                    <p><span className="text-gray-500">Branch:</span> {selectedStudent.branch}</p>
                    <p><span className="text-gray-500">Year:</span> {selectedStudent.year}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3">Program Details</h5>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-sm ${getStatusColor(selectedStudent.status)}`}>
                        {selectedStudent.status}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500">Payment:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-sm ${getPaymentStatusColor(selectedStudent.paymentStatus)}`}>
                        {selectedStudent.paymentStatus}
                      </span>
                    </p>
                    <p><span className="text-gray-500">Progress:</span> {selectedStudent.progressPercentage}%</p>
                    <p><span className="text-gray-500">Batch:</span> {selectedStudent.batchName || "Not assigned"}</p>
                  </div>
                </div>
              </div>

              {selectedStudent.skills && (
                <div>
                  <h5 className="font-semibold mb-3">Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                {selectedStudent.resumeLink && (
                  <motion.button
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleDownloadResume(selectedStudent.resumeLink!)}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Resume</span>
                  </motion.button>
                )}
                <motion.button
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleSendEmail(selectedStudent.email)}
                >
                  <Send className="w-4 h-4" />
                  <span>Send Email</span>
                </motion.button>
                <motion.button
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    setUploadStudentUid(selectedStudent.uid);
                    setIsUploadModalOpen(true);
                    setIsViewModalOpen(false);
                  }}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Document</span>
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  const EditStudentModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Edit Student</h3>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {editedStudent && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editedStudent.status}
                  onChange={(e) => setEditedStudent({...editedStudent, status: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <select
                  value={editedStudent.paymentStatus}
                  onChange={(e) => setEditedStudent({...editedStudent, paymentStatus: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {paymentStatusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedStudent.progressPercentage}
                  onChange={(e) => setEditedStudent({...editedStudent, progressPercentage: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Name</label>
                <input
                  type="text"
                  value={editedStudent.batchName || ""}
                  onChange={(e) => setEditedStudent({...editedStudent, batchName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <motion.button
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold"
                  whileHover={{ scale: 1.02 }}
                  onClick={handleSaveStudentChanges}
                >
                  Save Changes
                </motion.button>
                <motion.button
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  const UploadDocumentModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl max-w-md w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Upload Document</h3>
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
              <select
                value={uploadStudentUid}
                onChange={(e) => setUploadStudentUid(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.uid} value={student.uid}>
                    {student.fullName} ({student.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <select
                value={uploadDocumentType}
                onChange={(e) => setUploadDocumentType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <motion.button
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold"
                whileHover={{ scale: 1.02 }}
                onClick={handleUploadDocument}
              >
                Upload
              </motion.button>
              <motion.button
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold"
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderTabContent = (): JSX.Element => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case "students":
        return (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <motion.button
                className="bg-purple-600 text-white px-4 py-3 rounded-xl font-medium flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                onClick={handleRefresh}
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </motion.button>

              <motion.button
                className="bg-green-600 text-white px-4 py-3 rounded-xl font-medium flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Upload className="w-5 h-5" />
                <span>Upload Document</span>
              </motion.button>
            </div>

            {/* Students List */}
            <div className="space-y-4">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No students found</p>
                </div>
              ) : (
                filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.uid}
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {student.fullName?.split(" ").map((n) => n[0]).join("")}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{student.fullName}</h3>
                            <p className="text-gray-600">{student.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">College</p>
                            <p className="font-medium text-gray-900">{student.college || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Course</p>
                            <p className="font-medium text-gray-900">{student.course || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Progress</p>
                            <p className="font-medium text-gray-900">{student.progressPercentage}%</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(student.status)}`}>
                            {student.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(student.paymentStatus)}`}>
                            Payment: {student.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <motion.button
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handleViewStudent(student)}
                        >
                          <Eye className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handleSendEmail(student.email)}
                        >
                          <Mail className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );

      case "applications":
        return (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  {applicationStatusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <motion.button
                className="bg-purple-600 text-white px-4 py-3 rounded-xl font-medium flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                onClick={handleRefresh}
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </motion.button>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No applications found</p>
                </div>
              ) : (
                filteredApplications.map((application, index) => (
                  <motion.div
                    key={application.uid}
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {application.fullName.split(" ").map((n) => n[0]).join("")}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{application.fullName}</h3>
                            <p className="text-gray-600">{application.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">College</p>
                            <p className="font-medium text-gray-900">{application.college}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Degree</p>
                            <p className="font-medium text-gray-900">{application.degree}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Graduation Year</p>
                            <p className="font-medium text-gray-900">{application.yearOfGraduation}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                            {application.status}
                          </span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            Applied: {new Date(application.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <motion.button
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handleViewApplication(application)}
                        >
                          <Eye className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handleEditApplication(application)}
                        >
                          <Edit className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handleSendEmail(application.email)}
                        >
                          <Mail className="w-5 h-5" />
                        </motion.button>
                        {application.status === 'pending' && (
                          <motion.button
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            onClick={() => handleUpdateStudentStatus(application.uid, 'shortlisted')}
                          >
                            <UserCheck className="w-5 h-5" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );

      case "payments":
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Management</h3>
              
              {/* Payment Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">₹{payments.reduce((sum, p) => sum + (p.status === 'paid' ? p.finalAmount : 0), 0)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Paid Students</p>
                      <p className="text-2xl font-bold text-blue-600">{students.filter(s => s.paymentStatus === 'paid').length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-xl">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Pending Payments</p>
                      <p className="text-2xl font-bold text-yellow-600">{students.filter(s => s.paymentStatus === 'pending').length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-xl">
                  <div className="flex items-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Failed Payments</p>
                      <p className="text-2xl font-bold text-red-600">{students.filter(s => s.paymentStatus === 'failed').length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Actions */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">Quick Actions</h4>
                {students.filter(s => s.paymentStatus === 'pending').map((student) => (
                  <div key={student.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleUpdatePaymentStatus(student.uid, 'paid')}
                      >
                        Mark as Paid
                      </motion.button>
                      <motion.button
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleUpdatePaymentStatus(student.uid, 'failed')}
                      >
                        Mark as Failed
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
            <p className="text-gray-600">This section is under development.</p>
          </motion.div>
        );
    }
  };

  const stats = [
    {
      label: "Total Students",
      value: students.length,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Active Interns",
      value: students.filter((s) => s.status === "active").length,
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Pending Applications",
      value: applications.filter((a) => a.status === "pending").length,
      icon: AlertTriangle,
      color: "from-yellow-500 to-orange-500",
    },
    {
      label: "Completed",
      value: students.filter((s) => s.status === "completed").length,
      icon: CheckCircle,
      color: "from-purple-500 to-violet-500",
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating admin access...</p>
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
                  <img src={logo} alt="logo" className="rounded-md" />
                </div>
                <span className="text-2xl font-bold gradient-text">Wyffle</span>
              </Link>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 font-medium">Admin Panel</span>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                onClick={handleRefresh}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </motion.button>

              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

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

      {/* Modals */}
      {isViewModalOpen && <ViewStudentModal />}
      {isEditModalOpen && <EditStudentModal />}
      {isUploadModalOpen && <UploadDocumentModal />}
    </div>
  );
};

export default AdminPanel;