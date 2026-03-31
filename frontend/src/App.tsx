import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';

// Facilities pages
import { Dashboard } from './pages/facilities/Dashboard';
import { ResourceList } from './pages/facilities/ResourceList';
import { AddResource } from './pages/facilities/AddResource';
import { EditResource } from './pages/facilities/EditResource';
import { ManageResources } from './pages/facilities/ManageResources';
import { MyBookings } from './pages/facilities/MyBookings';
import { ManageBookings } from './pages/facilities/ManageBookings';
import { ResourceDetails } from './pages/facilities/ResourceDetails';
import { AddBooking } from './pages/bookings/AddBooking';
import { BookingDashboard } from './pages/bookings/BookingDashboard';
import { ManageBookings as BookingManage } from './pages/bookings/ManageBookings';
import { MyBookings as BookingMyBookings } from './pages/bookings/MyBookings';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium', duration: 3000 }} />

        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<MainLayout />}>
              <Route index element={<Navigate to="/app/facilities/dashboard" replace />} />

              {/* Facilities */}
              <Route path="facilities/dashboard" element={<Dashboard />} />
              <Route path="facilities/resources" element={<ResourceList />} />
              <Route path="facilities/resources/add" element={<AddResource />} />
              <Route path="facilities/resources/manage" element={<ProtectedRoute requiredRole="ADMIN" />}>
                <Route index element={<ManageResources />} />
                <Route path="edit/:id" element={<EditResource />} />
              </Route>
              <Route path="facilities/resources/:id" element={<ResourceDetails />} />
              <Route path="facilities/bookings/my" element={<MyBookings />} />
              <Route path="facilities/bookings/manage" element={<ProtectedRoute requiredRole="ADMIN" />}>
                <Route index element={<ManageBookings />} />
              </Route>

              {/* Your separate Booking module */}
              <Route path="bookings/dashboard" element={<BookingDashboard />} />
              <Route path="bookings/add" element={<AddBooking />} />
              <Route path="bookings/my" element={<BookingMyBookings />} />
             <Route path="bookings/manage" element={<BookingManage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/app/facilities/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;