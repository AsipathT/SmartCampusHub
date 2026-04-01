/**
 * ─────────────────────────────────────────────────────────────────────────────
 * navigation.ts  —  Centralized Role-Based Navigation Configuration
 *
 * This is the SINGLE SOURCE OF TRUTH for all sidebar menus.
 * To add a new role or menu item, only this file needs to change.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Settings,
  Box,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '../contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  /** If true, NavLink matches only the exact path (prevents parent active-state bleed) */
  exact?: boolean;
  /** Tooltip for collapsed sidebar (future enhancement) */
  description?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Controls whether the group starts expanded */
  defaultOpen?: boolean;
}

export interface RoleNavConfig {
  role: UserRole;
  /** Deep link the user lands on after login */
  defaultRoute: string;
  groups: NavGroup[];
}

// ── Config Object ─────────────────────────────────────────────────────────────

/**
 * ADMIN navigation — full facility management capability
 */
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
          label: 'Resource List',
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
  ],
};

/**
 * USER navigation — read-only browsing capability
 */
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
  ],
};

// ── Registry ──────────────────────────────────────────────────────────────────

/**
 * Map each role to its navigation config.
 *
 * Extending for new roles (e.g. MANAGER, STAFF) only requires adding an
 * entry here and the corresponding RoleNavConfig above.
 */
export const ROLE_NAV_CONFIG: Record<UserRole, RoleNavConfig> = {
  ADMIN: ADMIN_NAV,
  USER: USER_NAV,
};

/**
 * Returns the nav config for the given role.
 * Falls back to USER config as the safest default.
 */
export const getNavConfig = (role?: UserRole): RoleNavConfig =>
  (role && ROLE_NAV_CONFIG[role]) || USER_NAV;
