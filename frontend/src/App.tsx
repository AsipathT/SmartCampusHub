import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Facilities
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

// Admin
import { UserManagement } from './pages/admin/UserManagement';

// Lecturer & Maintenance
import { LecturerDashboard } from './pages/lecturer/LecturerDashboard';
import { MaintenanceDashboard } from './pages/maintenance/MaintenanceDashboard';

// Booking pages
import { AddBooking } from './pages/bookings/AddBooking';
import { MyBookings } from './pages/bookings/MyBookings';
import { ManageBookings } from './pages/bookings/ManageBookings';
import { BookingDashboard } from './pages/bookings/BookingDashboard';
import { AdminBookingDashboard } from './pages/bookings/AdminBookingDashboard';
import { BookingNotifications } from './pages/bookings/BookingNotifications';

// Role-aware default redirect — must be inside AuthProvider
const RoleRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN')             return <Navigate to="/app/admin/dashboard"      replace />;
  if (user?.role === 'LECTURER')          return <Navigate to="/app/lecturer/dashboard"   replace />;
  if (user?.role === 'MAINTENANCE_STAFF') return <Navigate to="/app/maintenance/dashboard" replace />;
  return <Navigate to="/app/user/dashboard" replace />;
};

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
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<MainLayout />}>
              <Route index element={<RoleRedirect />} />

              {/* ADMIN */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="admin/dashboard"                    element={<AdminDashboard />} />
                <Route path="admin/users"                        element={<UserManagement />} />
                <Route path="facilities/resources"               element={<ResourceList />} />
                <Route path="facilities/resources/add"           element={<AddResource />} />
                <Route path="facilities/resources/manage"        element={<ManageResources />} />
                <Route path="facilities/resources/manage/edit/:id" element={<EditResource />} />
                <Route path="bookings/admin-dashboard"           element={<AdminBookingDashboard />} />
                <Route path="bookings/manage"                    element={<ManageBookings />} />
              </Route>

              {/* LECTURER */}
              <Route element={<ProtectedRoute allowedRoles={['LECTURER']} />}>
                <Route path="lecturer/dashboard" element={<LecturerDashboard />} />
              </Route>

              {/* MAINTENANCE STAFF */}
              <Route element={<ProtectedRoute allowedRoles={['MAINTENANCE_STAFF']} />}>
                <Route path="maintenance/dashboard" element={<MaintenanceDashboard />} />
              </Route>

              {/* SHARED — all authenticated roles */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'USER', 'LECTURER', 'MAINTENANCE_STAFF']} />}>
                <Route path="facilities/resources/:id" element={<ResourceDetails />} />
                <Route path="profile"                  element={<UserProfile />} />
                <Route path="user/browse"              element={<BrowseResources />} />
              </Route>

              {/* USER + LECTURER (booking features) */}
              <Route element={<ProtectedRoute allowedRoles={['USER', 'LECTURER']} />}>
                <Route path="bookings/add"           element={<AddBooking />} />
                <Route path="bookings/dashboard"     element={<BookingDashboard />} />
                <Route path="bookings/my"            element={<MyBookings />} />
                <Route path="bookings/notifications" element={<BookingNotifications />} />
              </Route>

              {/* USER only */}
              <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
                <Route path="user/dashboard" element={<UserDashboard />} />
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
