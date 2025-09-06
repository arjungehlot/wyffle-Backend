@@ .. @@
 import React, { useState } from 'react';
+import { useNavigate } from 'react-router-dom';
+import { useAuth } from '../contexts/AuthContext';
+import apiService from '../services/api';
 import { 
   User, 
   Mail, 
@@ .. @@
   MapPin,
   GraduationCap,
   Calendar,
-  Upload
+  Upload,
+  AlertCircle,
+  CheckCircle
 } from 'lucide-react';

 const Apply = () => {
+  const navigate = useNavigate();
+  const { currentUser } = useAuth();
   const [formData, setFormData] = useState({
     fullName: '',
     email: '',
@@ .. @@
     source: ''
   });
   
+  const [loading, setLoading] = useState(false);
+  const [error, setError] = useState('');
+  const [success, setSuccess] = useState(false);
+
   const skillOptions = [
     'JavaScript', 'Python', 'React', 'Node.js', 'HTML/CSS', 'Java', 'C++', 
     'SQL', 'MongoDB', 'Git', 'AWS', 'Docker', 'TypeScript', 'Vue.js', 'Angular'
@@ .. @@
   const handleSubmit = async (e) => {
     e.preventDefault();
-    console.log('Application submitted:', formData);
-    // Here you would typically send the data to your backend
+    
+    if (!currentUser) {
+      setError('Please log in to submit your application');
+      return;
+    }
+
+    try {
+      setError('');
+      setLoading(true);
+      
+      const applicationData = {
+        ...formData,
+        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
+        yearOfGraduation: parseInt(formData.yearOfGraduation)
+      };
+      
+      await apiService.submitApplication(applicationData);
+      setSuccess(true);
+      
+      setTimeout(() => {
+        navigate('/dashboard');
+      }, 2000);
+    } catch (error) {
+      setError(error.message || 'Failed to submit application');
+    }
+    
+    setLoading(false);
   };

@@ .. @@
         </div>
         
         <div className="bg-white rounded-xl shadow-lg p-8">
+          {error && (
+            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
+              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
+              <span className="text-red-700">{error}</span>
+            </div>
+          )}
+          
+          {success && (
+            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
+              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
+              <span className="text-green-700">Application submitted successfully! Redirecting to dashboard...</span>
+            </div>
+          )}
+          
           <form onSubmit={handleSubmit} className="space-y-6">
             {/* Personal Information */}
@@ .. @@
             <button
               type="submit"
+              disabled={loading || success}
-              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-lg"
+              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
             >
-              Submit Application
+              {loading ? 'Submitting...' : success ? 'Application Submitted!' : 'Submit Application'}
             </button>
           </form>
         </div>