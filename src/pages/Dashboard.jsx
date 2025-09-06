@@ .. @@
 import React, { useState, useEffect } from 'react';
+import { useAuth } from '../contexts/AuthContext';
+import apiService from '../services/api';
 import { 
   User, 
   BookOpen, 
@@ .. @@
   Calendar,
   Award,
   FileText,
-  Settings
+  Settings,
+  AlertCircle,
+  Loader
 } from 'lucide-react';

 const Dashboard = () => {
+  const { currentUser } = useAuth();
   const [activeTab, setActiveTab] = useState('overview');
+  const [studentData, setStudentData] = useState(null);
+  const [loading, setLoading] = useState(true);
+  const [error, setError] = useState('');

-  // Mock data - replace with actual API calls
-  const studentData = {
-    fullName: 'John Doe',
-    email: 'john.doe@example.com',
-    batchName: 'Batch 2024-A',
-    activeDays: 45,
-    projectsBuilt: 3,
-    progressPercentage: 75,
-    internshipStatus: 'active',
-    status: 'active',
-    paymentStatus: 'paid',
-    progressSteps: {
-      applicationSubmitted: true,
-      resumeShortlisted: true,
-      interviewCompleted: true,
-      paymentProcess: true,
-      internshipActive: true,
-      finalShowcase: false,
-      certificateReady: false
-    }
-  };
+  useEffect(() => {
+    fetchStudentData();
+  }, []);
+
+  const fetchStudentData = async () => {
+    try {
+      setLoading(true);
+      const response = await apiService.getMyProfile();
+      setStudentData(response.data);
+    } catch (error) {
+      setError(error.message || 'Failed to fetch profile data');
+    } finally {
+      setLoading(false);
+    }
+  };

   const progressSteps = [
@@ .. @@
     { key: 'certificateReady', label: 'Certificate Ready', icon: Award }
   ];

+  if (loading) {
+    return (
+      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
+        <div className="text-center">
+          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
+          <p className="text-gray-600">Loading your dashboard...</p>
+        </div>
+      </div>
+    );
+  }
+
+  if (error) {
+    return (
+      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
+        <div className="text-center">
+          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
+          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
+          <p className="text-gray-600 mb-4">{error}</p>
+          <button 
+            onClick={fetchStudentData}
+            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
+          >
+            Try Again
+          </button>
+        </div>
+      </div>
+    );
+  }
+
+  if (!studentData) {
+    return (
+      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
+        <div className="text-center">
+          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
+          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Profile Found</h2>
+          <p className="text-gray-600">Please submit your application first.</p>
+        </div>
+      </div>
+    );
+  }
+
   const renderTabContent = () => {
     switch (activeTab) {
       case 'overview':
@@ .. @@
         return <ProfileTab studentData={studentData} />;
       case 'status':
-        return <StatusTab progressSteps={progressSteps} studentData={studentData} />;
+        return <StatusTab progressSteps={progressSteps} studentData={studentData} onRefresh={fetchStudentData} />;
       case 'documents':
-        return <DocumentsTab />;
+        return <DocumentsTab studentData={studentData} />;
       case 'payments':
-        return <PaymentsTab studentData={studentData} />;
+        return <PaymentsTab studentData={studentData} onRefresh={fetchStudentData} />;
       default:
         return <OverviewTab studentData={studentData} />;
     }
@@ .. @@
 };

 const OverviewTab = ({ studentData }) => (
@@ .. @@
 );

-const ProfileTab = ({ studentData }) => {
+const ProfileTab = ({ studentData: initialData }) => {
+  const [studentData, setStudentData] = useState(initialData);
   const [isEditing, setIsEditing] = useState(false);
+  const [loading, setLoading] = useState(false);
+  const [error, setError] = useState('');
+  const [success, setSuccess] = useState('');

   const handleSave = async () => {
-    // API call to save profile data
-    setIsEditing(false);
+    try {
+      setLoading(true);
+      setError('');
+      await apiService.updateMyProfile(studentData);
+      setSuccess('Profile updated successfully!');
+      setIsEditing(false);
+      setTimeout(() => setSuccess(''), 3000);
+    } catch (error) {
+      setError(error.message || 'Failed to update profile');
+    } finally {
+      setLoading(false);
+    }
   };

@@ .. @@
   return (
     <div className="space-y-6">
+      {error && (
+        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
+          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
+          <span className="text-red-700">{error}</span>
+        </div>
+      )}
+      
+      {success && (
+        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
+          <span className="text-green-700">{success}</span>
+        </div>
+      )}
+      
       <div className="bg-white rounded-lg shadow p-6">
@@ .. @@
           <div className="flex justify-end space-x-3">
             {isEditing ? (
               <>
                 <button
                   onClick={() => setIsEditing(false)}
+                  disabled={loading}
                   className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleSave}
-                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
+                  disabled={loading}
+                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                 >
-                  Save Changes
+                  {loading ? 'Saving...' : 'Save Changes'}
                 </button>
               </>
             ) : (
@@ .. @@
 };

-const StatusTab = ({ progressSteps, studentData }) => (
+const StatusTab = ({ progressSteps, studentData, onRefresh }) => (
   <div className="space-y-6">
@@ .. @@
 );

-const DocumentsTab = () => {
-  const documents = [
-    { name: 'Offer Letter', type: 'offer_letter', available: true, url: '#' },
-    { name: 'Payment Invoice', type: 'invoice', available: true, url: '#' },
-    { name: 'Completion Certificate', type: 'certificate', available: false, url: null },
-    { name: 'Project Portfolio', type: 'project_portfolio', available: false, url: null }
-  ];
+const DocumentsTab = ({ studentData }) => {
+  const [documents, setDocuments] = useState([]);
+  const [loading, setLoading] = useState(true);
+  const [error, setError] = useState('');
+
+  useEffect(() => {
+    fetchDocuments();
+  }, []);
+
+  const fetchDocuments = async () => {
+    try {
+      setLoading(true);
+      const response = await apiService.getMyDocuments();
+      setDocuments(response.data);
+    } catch (error) {
+      setError(error.message || 'Failed to fetch documents');
+    } finally {
+      setLoading(false);
+    }
+  };
+
+  if (loading) {
+    return (
+      <div className="text-center py-8">
+        <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
+        <p className="text-gray-600">Loading documents...</p>
+      </div>
+    );
+  }

   return (
@@ .. @@
         <h3 className="text-lg font-semibold text-gray-900">Available Documents</h3>
         <p className="text-gray-600">Download your internship documents</p>
       </div>
+      
+      {error && (
+        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
+          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
+          <span className="text-red-700">{error}</span>
+        </div>
+      )}
       
       <div className="bg-white rounded-lg shadow">
-        {documents.map((doc, index) => (
+        {documents.length === 0 ? (
+          <div className="p-8 text-center">
+            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
+            <p className="text-gray-600">No documents available yet</p>
+          </div>
+        ) : (
+          documents.map((doc, index) => (
           <div key={index} className="flex items-center justify-between p-4 border-b last:border-b-0">
             <div className="flex items-center">
               <FileText className="h-5 w-5 text-gray-400 mr-3" />
               <div>
-                <p className="font-medium text-gray-900">{doc.name}</p>
-                <p className="text-sm text-gray-500">
-                  {doc.available ? 'Ready for download' : 'Not available yet'}
-                </p>
+                <p className="font-medium text-gray-900">{doc.fileName}</p>
+                <p className="text-sm text-gray-500">{doc.documentType.replace('_', ' ')}</p>
               </div>
             </div>
-            {doc.available ? (
+            {doc.isEnabled ? (
               <a
-                href={doc.url}
+                href={doc.fileUrl}
+                target="_blank"
+                rel="noopener noreferrer"
                 className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
               >
                 Download
@@ -456,11 +580,12 @@ const DocumentsTab = () => {
               </span>
             )}
           </div>
-        ))}
+          ))
+        )}
       </div>
     </div>
   );
 };

-const PaymentsTab = ({ studentData }) => {
+const PaymentsTab = ({ studentData, onRefresh }) => {
   const [couponCode, setCouponCode] = useState('');
   const [couponApplied, setCouponApplied] = useState(false);
@@ .. @@
   const [paymentLoading, setPaymentLoading] = useState(false);
+  const [couponLoading, setCouponLoading] = useState(false);
+  const [error, setError] = useState('');
+  const [paymentHistory, setPaymentHistory] = useState([]);

   const originalPrice = 399;
   const discountedPrice = 299;
@@ .. @@
   const finalPrice = couponApplied ? discountedPrice : originalPrice;

+  useEffect(() => {
+    fetchPaymentHistory();
+  }, []);
+
+  const fetchPaymentHistory = async () => {
+    try {
+      const response = await apiService.getPaymentHistory();
+      setPaymentHistory(response.data);
+    } catch (error) {
+      console.error('Failed to fetch payment history:', error);
+    }
+  };
+
   const handleApplyCoupon = async () => {
-    // API call to validate coupon
-    if (couponCode === 'TOP100') {
-      setCouponApplied(true);
-    }
+    try {
+      setCouponLoading(true);
+      setError('');
+      const response = await apiService.applyCoupon(couponCode);
+      if (response.data.valid) {
+        setCouponApplied(true);
+      } else {
+        setError('Invalid coupon code');
+      }
+    } catch (error) {
+      setError(error.message || 'Failed to apply coupon');
+    } finally {
+      setCouponLoading(false);
+    }
   };

   const handlePayment = async () => {
-    setPaymentLoading(true);
-    // Razorpay integration would go here
-    setTimeout(() => {
-      setPaymentLoading(false);
-      alert('Payment successful!');
-    }, 2000);
+    try {
+      setPaymentLoading(true);
+      setError('');
+      
+      // Create payment order
+      const orderResponse = await apiService.createPaymentOrder(couponApplied ? couponCode : null);
+      
+      // Initialize Razorpay
+      const options = {
+        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
+        amount: orderResponse.data.amount,
+        currency: orderResponse.data.currency,
+        name: 'Wyffle Internship',
+        description: 'Internship Program Fee',
+        order_id: orderResponse.data.orderId,
+        handler: async (response) => {
+          try {
+            await apiService.verifyPayment(response);
+            alert('Payment successful!');
+            onRefresh(); // Refresh student data
+            fetchPaymentHistory(); // Refresh payment history
+          } catch (error) {
+            setError('Payment verification failed');
+          }
+        },
+        prefill: {
+          email: studentData.email,
+          name: studentData.fullName,
+        },
+        theme: {
+          color: '#2563eb'
+        }
+      };
+      
+      const rzp = new window.Razorpay(options);
+      rzp.open();
+    } catch (error) {
+      setError(error.message || 'Failed to initiate payment');
+    } finally {
+      setPaymentLoading(false);
+    }
   };

@@ .. @@
       </div>
       
+      {error && (
+        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
+          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
+          <span className="text-red-700">{error}</span>
+        </div>
+      )}
+      
       <div className="bg-white rounded-lg shadow p-6">
@@ .. @@
               <button
                 onClick={handleApplyCoupon}
+                disabled={couponLoading || couponApplied}
-                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
+                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
               >
-                Apply
+                {couponLoading ? 'Applying...' : couponApplied ? 'Applied' : 'Apply'}
               </button>
             </div>
@@ .. @@
             <button
               onClick={handlePayment}
               disabled={paymentLoading || studentData.paymentStatus === 'paid'}
               className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               {paymentLoading ? 'Processing...' : 
                studentData.paymentStatus === 'paid' ? 'Payment Completed' : 
                `Pay ₹${finalPrice}`}
             </button>
           </div>
         ) : (
           <div className="text-center py-8">
             <p className="text-gray-600">Payment option will be available once your application is shortlisted.</p>
           </div>
         )}
       </div>
+      
+      {/* Payment History */}
+      {paymentHistory.length > 0 && (
+        <div className="bg-white rounded-lg shadow p-6">
+          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
+          <div className="space-y-3">
+            {paymentHistory.map((payment, index) => (
+              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
+                <div>
+                  <p className="font-medium">₹{payment.finalAmount}</p>
+                  <p className="text-sm text-gray-600">{new Date(payment.createdAt).toLocaleDateString()}</p>
+                </div>
+                <span className={`px-2 py-1 rounded-full text-xs ${
+                  payment.status === 'paid' ? 'bg-green-100 text-green-800' : 
+                  payment.status === 'failed' ? 'bg-red-100 text-red-800' : 
+                  'bg-yellow-100 text-yellow-800'
+                }`}>
+                  {payment.status}
+                </span>
+              </div>
+            ))}
+          </div>
+        </div>
+      )}
     </div>
   );
 };