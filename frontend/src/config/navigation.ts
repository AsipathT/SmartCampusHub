import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Settings,
  Box,
  Search,
  ClipboardList,
  CalendarDays,
  Users,
  Wrench,
  Bell,
  Ticket,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '../contexts/AuthContext';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  exact?: boolean;
  description?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  defaultOpen?: boolean;
}

export interface RoleNavConfig {
  role: UserRole;
  defaultRoute: string;
  groups: NavGroup[];
}

const ADMIN_NAV: RoleNavConfig = {
  role: 'ADMIN',
  defaultRoute: '/app/admin/dashboard',
  groups: [
    {
      id: 'facilities-admin',
      label: 'Facilities & Assets',
      icon: Building2,
      defaultOpen: true,
      items: [
        {
          id: 'admin-dashboard',
          label: 'Dashboard',
          path: '/app/admin/dashboard',
          icon: LayoutDashboard,
          exact: true,
          description: 'Overview of all campus resources',
        },
        {
          id: 'resource-list',
          label: 'Browse Resources',
          path: '/app/facilities/resources',
          icon: Box,
          exact: true,
          description: 'View all campus resources',
        },
        {
          id: 'add-resource',
          label: 'Add Resource',
          path: '/app/facilities/resources/add',
          icon: PlusCircle,
          description: 'Create a new campus resource',
        },
        {
          id: 'manage-resources',
          label: 'Manage Resources',
          path: '/app/facilities/resources/manage',
          icon: Settings,
          description: 'Edit or remove existing resources',
        },
      ],
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: Users,
      defaultOpen: true,
      items: [
        {
          id: 'user-management-list',
          label: 'User Management',
          path: '/app/admin/users',
          icon: Users,
          exact: true,
          description: 'View and manage all system users',
        },
      ],
    },
    {
      id: 'bookings-admin',
      label: 'Booking Management',
      icon: ClipboardList,
      defaultOpen: true,
      items: [
        {
          id: 'booking-dashboard-admin',
          label: 'Dashboard',
          path: '/app/bookings/admin-dashboard',
          icon: LayoutDashboard,
          exact: true,
          description: 'Booking overview and stats',
        },
        {
          id: 'manage-bookings-admin',
          label: 'Manage Bookings',
          path: '/app/bookings/manage',
          icon: Settings,
          description: 'Approve or reject booking requests',
        },
      ],
    },
    {
      // Module C: Maintenance & Incident Ticketing (PAF assignment).
      id: 'incident-admin',
      label: 'Maintenance & Incidents',
      icon: Wrench,
      defaultOpen: true,
      items: [
        {
          id: 'incident-admin-dashboard',
          label: 'Dashboard',
          path: '/app/admin/incidents/dashboard',
          icon: LayoutDashboard,
          exact: true,
          description: 'Maintenance & incident ticketing overview',
        },
        {
          id: 'incident-manage-tickets',
          label: 'Manage Incident Tickets',
          path: '/app/admin/incidents/manage',
          icon: Ticket,
          description: 'Assign technicians and progress the ticket workflow',
        },
        {
          id: 'incident-map',
          label: 'Campus Incident Map',
          path: '/app/admin/incidents/map',
          icon: MapPin,
          description: 'Live campus map of reported incident tickets',
        },
        {
          // Module D: Notifications (PAF assignment).
          id: 'incident-admin-notifications',
          label: 'Notifications',
          path: '/app/admin/incidents/notifications',
          icon: Bell,
          description: 'Incident ticketing & booking notifications',
        },
      ],
    },
  ],
};

const USER_NAV: RoleNavConfig = {
  role: 'USER',
  defaultRoute: '/app/user/dashboard',
  groups: [
    {
      id: 'facilities-user',
      label: 'Facilities',
      icon: Building2,
      defaultOpen: true,
      items: [
        {
          id: 'user-dashboard',
          label: 'Dashboard',
          path: '/app/user/dashboard',
          icon: LayoutDashboard,
          exact: true,
          description: 'Your personal campus overview',
        },
        {
          id: 'browse-resources',
          label: 'Browse Resources',
          path: '/app/user/browse',
          icon: Search,
          description: 'Discover available campus facilities',
        },
      ],
    },
    {
      id: 'bookings-user',
      label: 'Booking Management',
      icon: CalendarDays,
      defaultOpen: true,
      items: [
        {
          id: 'booking-dashboard-user',
          label: 'Booking Dashboard',
          path: '/app/bookings/dashboard',
          icon: LayoutDashboard,
          exact: true,
          description: 'Overview of your booking activity',
        },
        {
          id: 'my-bookings-user',
          label: 'Booking List',
          path: '/app/bookings/my',
          icon: ClipboardList,
          description: 'Track your booking requests',
        },
        {
          id: 'add-booking-user',
          label: 'Add Booking',
          path: '/app/bookings/add',
          icon: PlusCircle,
          description: 'Create a new booking request',
        },
      ],
    },
    {
      // Module C: Maintenance & Incident Ticketing (PAF assignment).
      id: 'incident-user',
      label: 'Maintenance & Incidents',
      icon: Wrench,
      defaultOpen: true,
      items: [
        {
          id: 'incident-tickets',
          label: 'My Incident Tickets',
          path: '/app/user/incidents',
          icon: ClipboardList,
          exact: true,
          description: 'Track the maintenance incidents you reported',
        },
        {
          id: 'report-incident',
          label: 'Report New Incident',
          path: '/app/user/incidents/report',
          icon: PlusCircle,
          description: 'Submit a new maintenance / incident ticket',
        },
        {
          // Module D: Notifications (PAF assignment).
          id: 'student-notifications',
          label: 'Notifications',
          path: '/app/user/notifications',
          icon: Bell,
          description: 'View incident ticketing & booking notifications',
        },
      ],
    },
  ],
};

const LECTURER_NAV: RoleNavConfig = {
  role: 'LECTURER',
  defaultRoute: '/app/lecturer/dashboard',
  groups: [
    {
      id: 'facilities-lecturer',
      label: 'Facilities',
      icon: Building2,
      defaultOpen: true,
      items: [
        {
          id: 'lecturer-dashboard',
          label: 'Dashboard',
          path: '/app/lecturer/dashboard',
          icon: LayoutDashboard,
          exact: true,
          description: 'Your lecturer overview',
        },
        {
          id: 'lecturer-browse',
          label: 'Browse Resources',
          path: '/app/user/browse',
          icon: Search,
          description: 'Explore campus facilities',
        },
      ],
    },
    {
      id: 'bookings-lecturer',
      label: 'Booking Management',
      icon: CalendarDays,
      defaultOpen: true,
      items: [
        {
          id: 'booking-dashboard-lecturer',
          label: 'Booking Dashboard',
          path: '/app/bookings/dashboard',
          icon: LayoutDashboard,
          exact: true,
          description: 'Overview of your bookings',
        },
        {
          id: 'my-bookings-lecturer',
          label: 'Booking List',
          path: '/app/bookings/my',
          icon: ClipboardList,
          description: 'View your booking requests',
        },
        {
          id: 'add-booking-lecturer',
          label: 'Add Booking',
          path: '/app/bookings/add',
          icon: PlusCircle,
          description: 'Create a new booking request',
        },
      ],
    },
  ],
};

const MAINTENANCE_NAV: RoleNavConfig = {
  role: 'MAINTENANCE_STAFF',
  defaultRoute: '/app/maintenance/dashboard',
  groups: [
    {
      id: 'facilities-maintenance',
      label: 'Facilities',
      icon: Building2,
      defaultOpen: true,
      items: [
        {
          id: 'maintenance-dashboard',
          label: 'Dashboard',
          path: '/app/maintenance/dashboard',
          icon: LayoutDashboard,
          exact: true,
          description: 'Your maintenance overview',
        },
        {
          id: 'maintenance-resources',
          label: 'Browse Resources',
          path: '/app/user/browse',
          icon: Box,
          description: 'View all campus resources',
        },
      ],
    },
  ],
};

export const ROLE_NAV_CONFIG: Record<UserRole, RoleNavConfig> = {
  ADMIN: ADMIN_NAV,
  USER: USER_NAV,
  LECTURER: LECTURER_NAV,
  MAINTENANCE_STAFF: MAINTENANCE_NAV,
};

export const getNavConfig = (role?: UserRole): RoleNavConfig =>
  (role && ROLE_NAV_CONFIG[role]) || USER_NAV;