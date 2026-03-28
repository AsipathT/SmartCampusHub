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
import { EditResource } from './pages/facilities/EditResource';
import { ManageResources } from './pages/facilities/ManageResources';
import { MyBookings } from './pages/facilities/MyBookings';
import { ManageBookings } from './pages/facilities/ManageBookings';
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
            <Route path="/app" element={<MainLayout />}>
              
              {/* Redirect /app to dashboard */}
              <Route index element={<Navigate to="/app/facilities/dashboard" replace />} />
              
              {/* Facilities & Assets Module Routes */}
              <Route path="facilities/dashboard" element={<Dashboard />} />
              <Route path="facilities/resources" element={<ResourceList />} />
              <Route path="facilities/resources/add" element={<AddResource />} />
              <Route path="facilities/resources/manage" element={<ProtectedRoute requiredRole="ADMIN" />} >
                 <Route index element={<ManageResources />} />
                 <Route path="edit/:id" element={<EditResource />} />
              </Route>
              <Route path="facilities/resources/:id" element={<ResourceDetails />} />
              <Route path="facilities/bookings/my" element={<MyBookings />} />
              <Route path="facilities/bookings/manage" element={<ProtectedRoute requiredRole="ADMIN" />}>
                 <Route index element={<ManageBookings />} />
              </Route>
              
              {/* Other modules placeholders */}
            </Route>
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<Navigate to="/app/facilities/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
