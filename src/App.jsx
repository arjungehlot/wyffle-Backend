@@ .. @@
 import React from 'react';
-import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
+import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
+import { AuthProvider } from './contexts/AuthContext';
+import ProtectedRoute from './components/ProtectedRoute';
 import Navbar from './components/Navbar';
+import Login from './components/Login';
+import Signup from './components/Signup';
 import Home from './pages/Home';
 import Apply from './pages/Apply';
 import Dashboard from './pages/Dashboard';
@@ .. @@
 function App() {
   return (
-    <Router>
-      <div className="min-h-screen bg-gray-50">
-        <Navbar />
-        <Routes>
-          <Route path="/" element={<Home />} />
-          <Route path="/apply" element={<Apply />} />
-          <Route path="/dashboard" element={<Dashboard />} />
-          <Route path="/admin" element={<Admin />} />
-        </Routes>
-      </div>
-    </Router>
+    <AuthProvider>
+      <Router>
+        <div className="min-h-screen bg-gray-50">
+          <Navbar />
+          <Routes>
+            <Route path="/" element={<Home />} />
+            <Route path="/login" element={<Login />} />
+            <Route path="/signup" element={<Signup />} />
+            <Route 
+              path="/apply" 
+              element={
+                <ProtectedRoute>
+                  <Apply />
+                </ProtectedRoute>
+              } 
+            />
+            <Route 
+              path="/dashboard" 
+              element={
+                <ProtectedRoute>
+                  <Dashboard />
+                </ProtectedRoute>
+              } 
+            />
+            <Route 
+              path="/admin" 
+              element={
+                <ProtectedRoute adminOnly={true}>
+                  <Admin />
+                </ProtectedRoute>
+              } 
+            />
+            <Route path="*" element={<Navigate to="/" />} />
+          </Routes>
+        </div>
+      </Router>
+    </AuthProvider>
   );
 }