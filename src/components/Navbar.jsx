@@ .. @@
 import React, { useState } from 'react';
-import { Link } from 'react-router-dom';
+import { Link, useNavigate } from 'react-router-dom';
+import { useAuth } from '../contexts/AuthContext';
 import { Menu, X, User, Settings, LogOut } from 'lucide-react';

 const Navbar = () => {
+  const { currentUser, isAdmin, logout } = useAuth();
+  const navigate = useNavigate();
   const [isOpen, setIsOpen] = useState(false);
+  const [showUserMenu, setShowUserMenu] = useState(false);
+
+  const handleLogout = async () => {
+    try {
+      await logout();
+      navigate('/');
+    } catch (error) {
+      console.error('Failed to log out:', error);
+    }
+  };

   return (
@@ .. @@
           </div>
           
           {/* Desktop Navigation */}
           <div className="hidden md:flex items-center space-x-8">
-            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
-              Home
-            </Link>
-            <Link to="/apply" className="text-gray-700 hover:text-blue-600 transition-colors">
-              Apply
-            </Link>
-            <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
-              Dashboard
-            </Link>
-            <Link to="/admin" className="text-gray-700 hover:text-blue-600 transition-colors">
-              Admin
-            </Link>
+            {!currentUser ? (
+              <>
+                <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
+                  Home
+                </Link>
+                <Link to="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
+                  Login
+                </Link>
+                <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
+                  Sign Up
+                </Link>
+              </>
+            ) : (
+              <>
+                <Link to="/apply" className="text-gray-700 hover:text-blue-600 transition-colors">
+                  Apply
+                </Link>
+                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
+                  Dashboard
+                </Link>
+                {isAdmin && (
+                  <Link to="/admin" className="text-gray-700 hover:text-blue-600 transition-colors">
+                    Admin
+                  </Link>
+                )}
+                
+                {/* User Menu */}
+                <div className="relative">
+                  <button
+                    onClick={() => setShowUserMenu(!showUserMenu)}
+                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
+                  >
+                    <User className="h-5 w-5" />
+                    <span className="text-sm">{currentUser.email}</span>
+                  </button>
+                  
+                  {showUserMenu && (
+                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
+                      <button
+                        onClick={handleLogout}
+                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
+                      >
+                        <LogOut className="h-4 w-4 mr-2" />
+                        Logout
+                      </button>
+                    </div>
+                  )}
+                </div>
+              </>
+            )}
           </div>
           
@@ .. @@
         {/* Mobile menu */}
         {isOpen && (
           <div className="md:hidden">
             <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
-              <Link
-                to="/"
-                className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
-                onClick={() => setIsOpen(false)}
-              >
-                Home
-              </Link>
-              <Link
-                to="/apply"
-                className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
-                onClick={() => setIsOpen(false)}
-              >
-                Apply
-              </Link>
-              <Link
-                to="/dashboard"
-                className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
-                onClick={() => setIsOpen(false)}
-              >
-                Dashboard
-              </Link>
-              <Link
-                to="/admin"
-                className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
-                onClick={() => setIsOpen(false)}
-              >
-                Admin
-              </Link>
+              {!currentUser ? (
+                <>
+                  <Link
+                    to="/"
+                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
+                    onClick={() => setIsOpen(false)}
+                  >
+                    Home
+                  </Link>
+                  <Link
+                    to="/login"
+                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
+                    onClick={() => setIsOpen(false)}
+                  >
+                    Login
+                  </Link>
+                  <Link
+                    to="/signup"
+                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
+                    onClick={() => setIsOpen(false)}
+                  >
+                    Sign Up
+                  </Link>
+                </>
+              ) : (
+                <>
+                  <Link
+                    to="/apply"
+                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
+                    onClick={() => setIsOpen(false)}
+                  >
+                    Apply
+                  </Link>
+                  <Link
+                    to="/dashboard"
+                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
+                    onClick={() => setIsOpen(false)}
+                  >
+                    Dashboard
+                  </Link>
+                  {isAdmin && (
+                    <Link
+                      to="/admin"
+                      className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
+                      onClick={() => setIsOpen(false)}
+                    >
+                      Admin
+                    </Link>
+                  )}
+                  <button
+                    onClick={() => {
+                      handleLogout();
+                      setIsOpen(false);
+                    }}
+                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
+                  >
+                    Logout
+                  </button>
+                </>
+              )}
             </div>
           </div>
         )}