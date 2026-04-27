import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { Dashboard as AdminDashboard } from './pages/facilities/Dashboard';
import { ResourceList } from './pages/facilities/ResourceList';
import { AddResource } from './pages/facilities/AddResource';
import { EditResource } from './pages/facilities/EditResource';
import { ManageResources } from './pages/facilities/ManageResources';
import { ResourceDetails } from './pages/facilities/ResourceDetails';
import { IncidentDashboard } from './pages/admin/IncidentDashboard';
import { ManageTickets } from './pages/admin/ManageTickets';
import { AdminTicketDetails } from './pages/admin/AdminTicketDetails';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { IncidentMap } from './pages/admin/IncidentMap';

import { UserDashboard } from './pages/user/UserDashboard';
import { BrowseResources } from './pages/user/BrowseResources';
import { UserProfile } from './pages/user/UserProfile';
import { IncidentTickets } from './pages/user/IncidentTickets';
import { ReportIncident } from './pages/user/ReportIncident';
import { IncidentTicketDetails } from './pages/user/IncidentTicketDetails';
import { StudentNotifications } from './pages/user/StudentNotifications';

import { AddBooking } from './pages/bookings/AddBooking';
import { BookingDashboard } from './pages/bookings/BookingDashboard';
import { MyBookings } from './pages/bookings/MyBookings';
import { ManageBookings } from './pages/bookings/ManageBookings';
import { AdminBookingDashboard } from './pages/bookings/AdminBookingDashboard';
import { BookingNotifications } from './pages/bookings/BookingNotifications';

import { UserManagement } from './pages/admin/UserManagement';
import { LecturerDashboard } from './pages/lecturer/LecturerDashboard';
import { MaintenanceDashboard } from './pages/maintenance/MaintenanceDashboard';

const RoleRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <Navigate to="/app/admin/dashboard" replace />;
  if (user?.role === 'LECTURER') return <Navigate to="/app/lecturer/dashboard" replace />;
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<MainLayout />}>
              <Route index element={<RoleRedirect />} />

              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/users" element={<UserManagement />} />
                <Route path="facilities/resources" element={<ResourceList />} />
                <Route path="facilities/resources/add" element={<AddResource />} />
                <Route path="facilities/resources/manage" element={<ManageResources />} />
                <Route path="facilities/resources/manage/edit/:id" element={<EditResource />} />

                <Route path="admin/incidents/dashboard" element={<IncidentDashboard />} />
                <Route path="admin/incidents/manage" element={<ManageTickets />} />
                <Route path="admin/incidents/map" element={<IncidentMap />} />
                <Route path="admin/incidents/notifications" element={<AdminNotifications />} />
                <Route path="admin/incidents/:id" element={<AdminTicketDetails />} />

                <Route path="bookings/admin-dashboard" element={<AdminBookingDashboard />} />
                <Route path="bookings/manage" element={<ManageBookings />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['LECTURER']} />}>
                <Route path="lecturer/dashboard" element={<LecturerDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['MAINTENANCE_STAFF']} />}>
                <Route path="maintenance/dashboard" element={<MaintenanceDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'USER', 'LECTURER', 'MAINTENANCE_STAFF']} />}>
                <Route path="facilities/resources/:id" element={<ResourceDetails />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="user/browse" element={<BrowseResources />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['USER', 'LECTURER']} />}>
                <Route path="bookings/add" element={<AddBooking />} />
                <Route path="bookings/dashboard" element={<BookingDashboard />} />
                <Route path="bookings/my" element={<MyBookings />} />
                <Route path="bookings/notifications" element={<BookingNotifications />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
                <Route path="user/dashboard" element={<UserDashboard />} />
                <Route path="user/incidents" element={<IncidentTickets />} />
                <Route path="user/incidents/report" element={<ReportIncident />} />
                <Route path="user/incidents/:id" element={<IncidentTicketDetails />} />
                <Route path="user/notifications" element={<StudentNotifications />} />
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
