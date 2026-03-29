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
import { IncidentDashboard } from './pages/admin/IncidentDashboard';
import { ManageTickets } from './pages/admin/ManageTickets';
import { AdminTicketDetails } from './pages/admin/AdminTicketDetails';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { IncidentMap } from './pages/admin/IncidentMap';

// ── User pages ─────────────────────────────────────────────────────────────────
import { UserDashboard } from './pages/user/UserDashboard';
import { BrowseResources } from './pages/user/BrowseResources';
import { UserProfile } from './pages/user/UserProfile';
import { IncidentTickets } from './pages/user/IncidentTickets';
import { ReportIncident } from './pages/user/ReportIncident';
import { IncidentTicketDetails } from './pages/user/IncidentTicketDetails';
import { StudentNotifications } from './pages/user/StudentNotifications';
import { AddBooking } from './pages/bookings/AddBooking';
import { BookingDashboard } from './pages/bookings/BookingDashboard';
import { ManageBookings as BookingManage } from './pages/bookings/ManageBookings';

const App: React.FC = () => {
  return (
    <BrowserRouter>
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
                <Route path="admin/incidents/dashboard" element={<IncidentDashboard />} />
                <Route path="admin/incidents/manage" element={<ManageTickets />} />
                <Route path="admin/incidents/map" element={<IncidentMap />} />
                <Route path="admin/incidents/notifications" element={<AdminNotifications />} />
                <Route path="admin/incidents/:id" element={<AdminTicketDetails />} />
                <Route path="bookings/manage" element={<BookingManage />} />
              </Route>

              {/* ── Shared Routes (ADMIN + USER) ──────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'USER']} />}>
                <Route path="facilities/resources/:id" element={<ResourceDetails />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="bookings/dashboard" element={<BookingDashboard />} />
                <Route path="bookings/add" element={<AddBooking />} />
              </Route>

              {/* ── USER Routes (USER only, ADMIN can also access via bypass) */}
              <Route element={<ProtectedRoute allowedRoles={['USER', 'ADMIN']} />}>
                <Route path="user/dashboard" element={<UserDashboard />} />
                <Route path="user/browse" element={<BrowseResources />} />
                <Route path="user/incidents" element={<IncidentTickets />} />
                <Route path="user/incidents/report" element={<ReportIncident />} />
                <Route path="user/incidents/:id" element={<IncidentTicketDetails />} />
                <Route path="user/notifications" element={<StudentNotifications />} />
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