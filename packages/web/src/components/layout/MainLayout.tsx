import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import type { SidebarState, SystemStatus } from '../../types';

// Mock system status - in a real app, this would come from an API
const mockSystemStatus: SystemStatus = {
  status: 'online',
  lastUpdated: new Date().toISOString(),
  version: '1.0.0',
};

export const MainLayout: React.FC = () => {
  const { loading } = useAuth();
  const [sidebarState, setSidebarState] = useState<SidebarState>({
    isCollapsed: false,
    isMobile: false,
  });

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      setSidebarState(prev => ({
        ...prev,
        isMobile,
        isCollapsed: isMobile ? true : prev.isCollapsed,
      }));
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    setSidebarState(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed,
    }));
  };

  const handleToggleCollapse = () => {
    setSidebarState(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        sidebarState={sidebarState}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          sidebarState={sidebarState}
          onToggleSidebar={handleToggleSidebar}
          systemStatus={mockSystemStatus}
        />

        {/* Page Content */}
        <main
          className={clsx(
            'flex-1 overflow-hidden transition-all duration-300',
            sidebarState.isCollapsed || sidebarState.isMobile
              ? 'lg:ml-0'
              : 'lg:ml-0'
          )}
        >
          <div className="h-full overflow-auto">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};