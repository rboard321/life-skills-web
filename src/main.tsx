import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import UnitSelectionPage from './components/UnitSelectionPage';
import Dashboard from './components/Dashboard';
import AdminPage from './components/AdminPage';
import UnitPage from './components/UnitPage';
import LessonPage from './components/LessonPage';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/units"
              element={
                <ProtectedRoute>
                  <UnitSelectionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/unit/:id"
              element={
                <ProtectedRoute>
                  <UnitPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/unit/:unitId/lesson/:lessonId"
              element={
                <ProtectedRoute>
                  <LessonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiresAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
  </React.StrictMode>
);
