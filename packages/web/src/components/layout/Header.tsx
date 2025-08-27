import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../common/ThemeToggle';
import type { SidebarState, SystemStatus } from '../../types';

interface HeaderProps {
  sidebarState: SidebarState;
  onToggleSidebar: () => void;
  systemStatus?: SystemStatus;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarState,
  onToggleSidebar,
  systemStatus,
}) => {
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
  };

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="btn-ghost p-2 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleSidebar}
          className="btn-ghost p-2 hidden lg:flex"
          aria-label={sidebarState.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* System Status */}
        {systemStatus && (
          <div className="hidden sm:flex items-center space-x-2">
            <div
              className={clsx(
                'w-2 h-2 rounded-full',
                getStatusColor(systemStatus.status)
              )}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {systemStatus.status}
            </span>
          </div>
        )}
      </div>

      {/* Center section - Search */}
      <div className="hidden md:flex flex-1 max-w-lg mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search memories..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        
        {/* Notifications */}
        <button
          className="btn-ghost p-2 relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role || 'Member'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.name || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </div>
              </div>

              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Profile
              </button>
              
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>

              <hr className="my-1 border-gray-200 dark:border-gray-700" />

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};