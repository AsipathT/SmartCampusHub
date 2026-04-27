import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/**
 * MainLayout
 * ─────────────────────────────────────────────────────────────────────────────
 * Shell layout for all authenticated pages.
 * - Desktop: sidebar + content side-by-side
 * - Mobile:  sidebar hidden by default, toggled via header hamburger
 */
export const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar — passes mobile state for overlay rendering */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMobileMenuToggle={() => setMobileMenuOpen((o) => !o)}
          mobileMenuOpen={mobileMenuOpen}
        />
        <main className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
