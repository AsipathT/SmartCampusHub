import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';

// Actual facilities pages imports
import { Dashboard } from './pages/facilities/Dashboard';
import { ResourceList } from './pages/facilities/ResourceList';
import { AddResource } from './pages/facilities/AddResource';
import { ManageResources } from './pages/facilities/ManageResources';
import { ResourceDetails } from './pages/facilities/ResourceDetails';

// Blank

const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* AuthProvider wraps everything to provide authentication context */}
      <AuthProvider>
        {/* Global Toasts Notifications */}
        <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium', duration: 3000 }} />

        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Facilities & Assets Module Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/resources" element={<ResourceList />} />
              <Route path="/resources/new" element={<AddResource />} />
              <Route path="/resources/manage" element={<ProtectedRoute requiredRole="ADMIN" />} >
                 <Route index element={<ManageResources />} />
              </Route>
              <Route path="/resources/:id" element={<ResourceDetails />} />
              
            </Route>
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
