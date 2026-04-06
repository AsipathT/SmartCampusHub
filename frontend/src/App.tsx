import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Admin
import { Dashboard as AdminDashboard } from './pages/facilities/Dashboard';
import { ResourceList } from './pages/facilities/ResourceList';
import { AddResource } from './pages/facilities/AddResource';
import { EditResource } from './pages/facilities/EditResource';
import { ManageResources } from './pages/facilities/ManageResources';
import { ResourceDetails } from './pages/facilities/ResourceDetails';

// User
import { UserDashboard } from './pages/user/UserDashboard';
import { BrowseResources } from './pages/user/BrowseResources';
import { UserProfile } from './pages/user/UserProfile';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>

        <Toaster
          position="top-right"
          toastOptions={{
            className: 'text-sm font-medium',
            duration: 3000,
          }}
        />

        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<MainLayout />}>

              <Route index element={<Navigate to="/app/admin/dashboard" replace />} />

              {/* ADMIN */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="facilities/resources" element={<ResourceList />} />
                <Route path="facilities/resources/add" element={<AddResource />} />
                <Route path="facilities/resources/manage" element={<ManageResources />} />
                <Route path="facilities/resources/manage/edit/:id" element={<EditResource />} />
              </Route>

              {/* SHARED */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'USER']} />}>
                <Route path="facilities/resources/:id" element={<ResourceDetails />} />
                <Route path="profile" element={<UserProfile />} />
              </Route>

              {/* USER */}
              <Route element={<ProtectedRoute allowedRoles={['USER', 'ADMIN']} />}>
                <Route path="user/dashboard" element={<UserDashboard />} />
                <Route path="user/browse" element={<BrowseResources />} />
              </Route>

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;