@@ .. @@
 import React, { useState, useEffect } from 'react';
+import { useAuth } from '../contexts/AuthContext';
+import apiService from '../services/api';
 import { 
   Users, 
   FileText, 
@@ .. @@
   Eye,
   Download,
   Upload,
-  Settings
+  Settings,
+  AlertCircle,
+  Loader,
+  CheckCircle
 } from 'lucide-react';

 const Admin = () => {
+  const { isAdmin } = useAuth();
   const [activeTab, setActiveTab] = useState('applications');
+  const [loading, setLoading] = useState(false);
+  const [error, setError] = useState('');

+  if (!isAdmin) {
+    return (
+      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
+        <div className="text-center">
+          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
+          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
+          <p className="text-gray-600">You don't have admin privileges to access this page.</p>
+        </div>
+      </div>
+    );
+  }
+
   const renderTabContent = () => {
     switch (activeTab) {
       case 'applications':
@@ .. @@
 };

 const ApplicationsTab = () => {
-  // Mock data - replace with actual API calls
-  const applications = [
-    {
-      uid: '1',
-      fullName: 'John Doe',
-      email: 'john@example.com',
-      college: 'MIT',
-      skills: ['React', 'Node.js'],
-      status: 'pending',
-      createdAt: '2024-01-15'
-    },
-    // Add more mock applications
-  ];
+  const [applications, setApplications] = useState([]);
+  const [loading, setLoading] = useState(true);
+  const [error, setError] = useState('');
+  const [updating, setUpdating] = useState({});
+
+  useEffect(() => {
+    fetchApplications();
+  }, []);
+
+  const fetchApplications = async () => {
+    try {
+      setLoading(true);
+      const response = await apiService.getAllApplications();
+      setApplications(response.data);
+    } catch (error) {
+      setError(error.message || 'Failed to fetch applications');
+    } finally {
+      setLoading(false);
+    }
+  };
+
+  const handleStatusUpdate = async (uid, status) => {
+    try {
+      setUpdating({ ...updating, [uid]: true });
+      await apiService.updateApplicationStatus(uid, status);
+      await fetchApplications(); // Refresh data
+    } catch (error) {
+      setError(error.message || 'Failed to update status');
+    } finally {
+      setUpdating({ ...updating, [uid]: false });
+    }
+  };
+
+  if (loading) {
+    return (
+      <div className="text-center py-8">
+        <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
+        <p className="text-gray-600">Loading applications...</p>
+      </div>
+    );
+  }

   return (
@@ .. @@
         <h2 className="text-2xl font-bold text-gray-900">Applications Management</h2>
         <p className="text-gray-600">Review and manage internship applications</p>
       </div>
+      
+      {error && (
+        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
+          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
+          <span className="text-red-700">{error}</span>
+        </div>
+      )}
       
       <div className="bg-white rounded-lg shadow overflow-hidden">
-        <div className="overflow-x-auto">
+        {applications.length === 0 ? (
+          <div className="p-8 text-center">
+            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
+            <p className="text-gray-600">No applications found</p>
+          </div>
+        ) : (
+          <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200">
@@ .. @@
               {applications.map((app) => (
                 <tr key={app.uid} className="hover:bg-gray-50">
@@ .. @@
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
-                    {new Date(app.createdAt).toLocaleDateString()}
+                    {new Date(app.createdAt.seconds ? app.createdAt.seconds * 1000 : app.createdAt).toLocaleDateString()}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
@@ .. @@
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                     <button
-                      onClick={() => handleStatusUpdate(app.uid, 'shortlisted')}
+                      onClick={() => handleStatusUpdate(app.uid, 'shortlisted')}
+                      disabled={updating[app.uid] || app.status === 'shortlisted'}
-                      className="text-green-600 hover:text-green-900"
+                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                     >
-                      Shortlist
+                      {updating[app.uid] ? 'Updating...' : 'Shortlist'}
                     </button>
                     <button
-                      onClick={() => handleStatusUpdate(app.uid, 'rejected')}
+                      onClick={() => handleStatusUpdate(app.uid, 'rejected')}
+                      disabled={updating[app.uid] || app.status === 'rejected'}
-                      className="text-red-600 hover:text-red-900"
+                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                     >
-                      Reject
+                      {updating[app.uid] ? 'Updating...' : 'Reject'}
                     </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
-        </div>
+          </div>
+        )}
       </div>
     </div>
   );
 };

 const StudentsTab = () => {
-  // Mock data - replace with actual API calls
-  const students = [
-    {
-      uid: '1',
-      fullName: 'Jane Smith',
-      email: 'jane@example.com',
-      batchName: 'Batch 2024-A',
-      status: 'active',
-      paymentStatus: 'paid',
-      progressPercentage: 75
-    },
-    // Add more mock students
-  ];
+  const [students, setStudents] = useState([]);
+  const [loading, setLoading] = useState(true);
+  const [error, setError] = useState('');
+  const [updating, setUpdating] = useState({});
+  const [selectedStudent, setSelectedStudent] = useState(null);
+  const [showUploadModal, setShowUploadModal] = useState(false);
+
+  useEffect(() => {
+    fetchStudents();
+  }, []);
+
+  const fetchStudents = async () => {
+    try {
+      setLoading(true);
+      const response = await apiService.getAllStudents();
+      setStudents(response.data);
+    } catch (error) {
+      setError(error.message || 'Failed to fetch students');
+    } finally {
+      setLoading(false);
+    }
+  };
+
+  const handleStatusUpdate = async (uid, status) => {
+    try {
+      setUpdating({ ...updating, [uid]: true });
+      await apiService.updateStudentStatus(uid, status);
+      await fetchStudents();
+    } catch (error) {
+      setError(error.message || 'Failed to update status');
+    } finally {
+      setUpdating({ ...updating, [uid]: false });
+    }
+  };
+
+  const handleProgressUpdate = async (uid, progress) => {
+    try {
+      setUpdating({ ...updating, [uid]: true });
+      await apiService.updateProgress(uid, parseInt(progress));
+      await fetchStudents();
+    } catch (error) {
+      setError(error.message || 'Failed to update progress');
+    } finally {
+      setUpdating({ ...updating, [uid]: false });
+    }
+  };
+
+  if (loading) {
+    return (
+      <div className="text-center py-8">
+        <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
+        <p className="text-gray-600">Loading students...</p>
+      </div>
+    );
+  }

   return (
@@ .. @@
         <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
         <p className="text-gray-600">Manage student profiles and progress</p>
       </div>
+      
+      {error && (
+        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
+          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
+          <span className="text-red-700">{error}</span>
+        </div>
+      )}
       
       <div className="bg-white rounded-lg shadow overflow-hidden">
-        <div className="overflow-x-auto">
+        {students.length === 0 ? (
+          <div className="p-8 text-center">
+            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
+            <p className="text-gray-600">No students found</p>
+          </div>
+        ) : (
+          <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200">
@@ .. @@
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
+              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Update Progress</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
@@ .. @@
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="w-full bg-gray-200 rounded-full h-2">
                       <div 
                         className="bg-blue-600 h-2 rounded-full" 
                         style={{ width: `${student.progressPercentage}%` }}
                       ></div>
                     </div>
                     <span className="text-sm text-gray-600">{student.progressPercentage}%</span>
                   </td>
+                  <td className="px-6 py-4 whitespace-nowrap">
+                    <input
+                      type="number"
+                      min="0"
+                      max="100"
+                      defaultValue={student.progressPercentage}
+                      onBlur={(e) => handleProgressUpdate(student.uid, e.target.value)}
+                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
+                      disabled={updating[student.uid]}
+                    />
+                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                     <button
+                      onClick={() => {
+                        setSelectedStudent(student);
+                        setShowUploadModal(true);
+                      }}
                       className="text-blue-600 hover:text-blue-900"
                     >
                       <Upload className="h-4 w-4" />
                     </button>
                     <select
                       value={student.status}
-                      onChange={(e) => handleStatusUpdate(student.uid, e.target.value)}
+                      onChange={(e) => handleStatusUpdate(student.uid, e.target.value)}
+                      disabled={updating[student.uid]}
                       className="text-sm border border-gray-300 rounded px-2 py-1"
                     >
                       <option value="shortlisted">Shortlisted</option>
@@ .. @@
               ))}
             </tbody>
           </table>
-        </div>
+          </div>
+        )}
       </div>
+      
+      {/* Upload Modal */}
+      {showUploadModal && (
+        <DocumentUploadModal
+          student={selectedStudent}
+          onClose={() => {
+            setShowUploadModal(false);
+            setSelectedStudent(null);
+          }}
+          onSuccess={() => {
+            setShowUploadModal(false);
+            setSelectedStudent(null);
+            fetchStudents();
+          }}
+        />
+      )}
     </div>
   );
 };

+const DocumentUploadModal = ({ student, onClose, onSuccess }) => {
+  const [file, setFile] = useState(null);
+  const [documentType, setDocumentType] = useState('offer_letter');
+  const [uploading, setUploading] = useState(false);
+  const [error, setError] = useState('');
+
+  const handleUpload = async () => {
+    if (!file) {
+      setError('Please select a file');
+      return;
+    }
+
+    try {
+      setUploading(true);
+      setError('');
+      await apiService.uploadDocument(student.uid, file, documentType);
+      onSuccess();
+    } catch (error) {
+      setError(error.message || 'Upload failed');
+    } finally {
+      setUploading(false);
+    }
+  };
+
+  return (
+    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
+      <div className="bg-white rounded-lg p-6 w-full max-w-md">
+        <h3 className="text-lg font-semibold mb-4">Upload Document for {student.fullName}</h3>
+        
+        {error && (
+          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
+            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
+            <span className="text-red-700 text-sm">{error}</span>
+          </div>
+        )}
+        
+        <div className="space-y-4">
+          <div>
+            <label className="block text-sm font-medium text-gray-700 mb-2">
+              Document Type
+            </label>
+            <select
+              value={documentType}
+              onChange={(e) => setDocumentType(e.target.value)}
+              className="w-full border border-gray-300 rounded-md px-3 py-2"
+            >
+              <option value="offer_letter">Offer Letter</option>
+              <option value="invoice">Invoice</option>
+              <option value="certificate">Certificate</option>
+              <option value="project_portfolio">Project Portfolio</option>
+            </select>
+          </div>
+          
+          <div>
+            <label className="block text-sm font-medium text-gray-700 mb-2">
+              File
+            </label>
+            <input
+              type="file"
+              onChange={(e) => setFile(e.target.files[0])}
+              className="w-full border border-gray-300 rounded-md px-3 py-2"
+              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
+            />
+          </div>
+        </div>
+        
+        <div className="flex justify-end space-x-3 mt-6">
+          <button
+            onClick={onClose}
+            disabled={uploading}
+            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
+          >
+            Cancel
+          </button>
+          <button
+            onClick={handleUpload}
+            disabled={uploading || !file}
+            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
+          >
+            {uploading ? 'Uploading...' : 'Upload'}
+          </button>
+        </div>
+      </div>
+    </div>
+  );
+};
+
 const PaymentsTab = () => {
-  // Mock data - replace with actual API calls
-  const payments = [
-    {
-      uid: '1',
-      studentName: 'Jane Smith',
-      amount: 299,
-      status: 'paid',
-      createdAt: '2024-01-20',
-      couponUsed: 'TOP100'
-    },
-    // Add more mock payments
-  ];
+  const [payments, setPayments] = useState([]);
+  const [loading, setLoading] = useState(true);
+  const [error, setError] = useState('');
+
+  useEffect(() => {
+    // Note: You'll need to create an admin endpoint to get all payments
+    // For now, this will show empty state
+    setLoading(false);
+  }, []);
+
+  if (loading) {
+    return (
+      <div className="text-center py-8">
+        <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
+        <p className="text-gray-600">Loading payments...</p>
+      </div>
+    );
+  }

   return (
@@ .. @@
         <h2 className="text-2xl font-bold text-gray-900">Payments Management</h2>
         <p className="text-gray-600">Monitor payment transactions</p>
       </div>
+      
+      {error && (
+        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
+          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
+          <span className="text-red-700">{error}</span>
+        </div>
+      )}
       
       <div className="bg-white rounded-lg shadow overflow-hidden">
-        <div className="overflow-x-auto">
+        {payments.length === 0 ? (
+          <div className="p-8 text-center">
+            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
+            <p className="text-gray-600">No payments found</p>
+          </div>
+        ) : (
+          <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200">
@@ .. @@
               {payments.map((payment) => (
                 <tr key={payment.uid} className="hover:bg-gray-50">
@@ .. @@
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
-                    {new Date(payment.createdAt).toLocaleDateString()}
+                    {new Date(payment.createdAt.seconds ? payment.createdAt.seconds * 1000 : payment.createdAt).toLocaleDateString()}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
-        </div>
+          </div>
+        )}
       </div>
     </div>
   );