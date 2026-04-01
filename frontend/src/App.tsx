import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// ── Admin pages ────────────────────────────────────────────────────────────────
import { Dashboard as AdminDashboard } from './pages/facilities/Dashboard';
import { ResourceList } from './pages/facilities/ResourceList';
import { AddResource } from './pages/facilities/AddResource';
import { EditResource } from './pages/facilities/EditResource';
import { ManageResources } from './pages/facilities/ManageResources';
import { ResourceDetails } from './pages/facilities/ResourceDetails';

// ── User pages ─────────────────────────────────────────────────────────────────
import { UserDashboard } from './pages/user/UserDashboard';
import { BrowseResources } from './pages/user/BrowseResources';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* AuthProvider wraps everything to provide authentication context */}
      <AuthProvider>
        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'text-sm font-medium',
            duration: 3000,
          }}
        />

        <Routes>
          {/* ── Public Routes ──────────────────────────────────────────────── */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Protected Application Shell ─────────────────────────────────
              This outer ProtectedRoute only checks authentication.
              Inner ProtectedRoutes add role-based access control.
          ───────────────────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<MainLayout />}>

              {/* Default redirect — role-aware redirect is handled by Login,
                  but guard against direct /app access */}
              <Route index element={<Navigate to="/app/admin/dashboard" replace />} />

              {/* ── ADMIN Routes (ADMIN only) ─────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="facilities/resources" element={<ResourceList />} />
                <Route path="facilities/resources/add" element={<AddResource />} />
                <Route path="facilities/resources/manage" element={<ManageResources />} />
                <Route path="facilities/resources/manage/edit/:id" element={<EditResource />} />
              </Route>

              {/* ── Shared Routes (ADMIN + USER) ──────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'USER']} />}>
                <Route path="facilities/resources/:id" element={<ResourceDetails />} />
              </Route>

              {/* ── USER Routes (USER only, ADMIN can also access via bypass) */}
              <Route element={<ProtectedRoute allowedRoles={['USER', 'ADMIN']} />}>
                <Route path="user/dashboard" element={<UserDashboard />} />
                <Route path="user/browse" element={<BrowseResources />} />
              </Route>

            </Route>
          </Route>

          {/* ── Fallback ────────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
