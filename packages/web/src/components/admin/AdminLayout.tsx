import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3,
  Database,
  Gauge,
  HardDrive,
  Key,
  Menu,
  Settings,
  Shield,
  Users,
  Activity,
  Server,
  Bell,
  Search,
  HelpCircle,
  LogOut,
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminData } from '@/hooks/useAdminData';
import type { NavItem } from '@/types';

const adminNavItems: NavItem[] = [
  {
    id: 'overview',
    label: 'System Overview',
    path: '/admin',
    icon: 'Gauge'
  },
  {
    id: 'users',
    label: 'User Management',
    path: '/admin/users',
    icon: 'Users'
  },
  {
    id: 'roles',
    label: 'Roles & Permissions',
    path: '/admin/roles',
    icon: 'Shield'
  },
  {
    id: 'config',
    label: 'Configuration',
    path: '/admin/config',
    icon: 'Settings'
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    path: '/admin/monitoring',
    icon: 'Activity'
  },
  {
    id: 'backup',
    label: 'Backup & Recovery',
    path: '/admin/backup',
    icon: 'HardDrive'
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    path: '/admin/audit',
    icon: 'Database'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/admin/analytics',
    icon: 'BarChart3'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    path: '/admin/integrations',
    icon: 'Zap'
  },
  {
    id: 'security',
    label: 'Security',
    path: '/admin/security',
    icon: 'Key'
  }
];

const iconMap = {
  BarChart3,
  Database,
  Gauge,
  HardDrive,
  Key,
  Settings,
  Shield,
  Users,
  Activity,
  Server,
  Zap
};

export const AdminLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { systemHealth, alerts } = useAdminData();

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName as keyof typeof iconMap];
    return Icon ? <Icon className="h-4 w-4" /> : <Server className="h-4 w-4" />;
  };

  const getHealthIcon = () => {
    if (!systemHealth) return <Clock className="h-4 w-4 text-gray-400" />;
    
    switch (systemHealth.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const activeAlerts = alerts?.filter(alert => alert.isActive) || [];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Memory Manager</p>
                </div>
              )}
              <button
                className="btn-ghost p-2 rounded-md"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* System Health Status */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-2">
                  {getHealthIcon()}
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">System Health</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {systemHealth ? `${systemHealth.score}%` : 'Loading...'}
                    </div>
                  </div>
                </div>
              )}
              {activeAlerts.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                  {activeAlerts.length}
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-auto px-2">
            <nav className="space-y-1 py-4">
              {adminNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    className={`
                      w-full h-10 rounded-md transition-colors flex items-center
                      ${sidebarCollapsed ? 'px-2 justify-center' : 'justify-start px-3'}
                      ${isActive 
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                    onClick={() => navigate(item.path)}
                  >
                    {getIcon(item.icon)}
                    {!sidebarCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Info & Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.role}</p>
                  </div>
                </div>
              )}
              <div className="flex space-x-1">
                {!sidebarCollapsed && (
                  <>
                    <button className="btn-ghost p-2 rounded-md" aria-label="Search">
                      <Search className="h-4 w-4" />
                    </button>
                    <button className="btn-ghost p-2 rounded-md" aria-label="Notifications">
                      <Bell className="h-4 w-4" />
                    </button>
                    <button className="btn-ghost p-2 rounded-md" aria-label="Help">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button className="btn-ghost p-2 rounded-md" onClick={logout} aria-label="Sign Out">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                className="btn-ghost p-2 rounded-md flex items-center"
                onClick={() => navigate('/')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to App
              </button>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-4"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {adminNavItems.find(item => item.path === location.pathname)?.label || 'Administration'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your memory manager system
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {activeAlerts.length > 0 && (
                <button className="btn-outline btn-sm flex items-center" onClick={() => navigate('/admin#alerts')}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {activeAlerts.length} Alert{activeAlerts.length !== 1 ? 's' : ''}
                </button>
              )}
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                {systemHealth ? (
                  <>
                    {getHealthIcon()}
                    <span className="ml-1">System {systemHealth.status}</span>
                  </>
                ) : (
                  'Loading...'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </div>
      </div>
    </div>
  );
};