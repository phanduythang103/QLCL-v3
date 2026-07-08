import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './components/LoginPage';
import { PublicSurveyPage } from './components/PublicSurveyPage';
import App from './App';

import TrainingMaterialManager from './pages/training/admin/TrainingMaterialManager';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/khao-sat/:slug" element={<PublicSurveyPage />} />

          <Route
            path="/admin/training/materials/:courseId"
            element={
              <ProtectedRoute>
                <TrainingMaterialManager />
              </ProtectedRoute>
            }
          />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}