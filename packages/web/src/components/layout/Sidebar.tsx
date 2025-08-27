import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Brain,
  Search,
  Tags,
  Settings,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
  Bot,
  Database,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery, gql } from '@apollo/client';
import type { NavItem, SidebarState } from '../../types';

const GET_SIDEBAR_COUNTS = gql`
  query GetSidebarCounts {
    analyticsOverview {
      totalMemories
      totalContexts
      totalAgents
    }
  }
`;

interface SidebarProps {
  sidebarState: SidebarState;
  onToggleCollapse: () => void;
}

// Hook to get real sidebar counts
const useSidebarCounts = () => {
  const { data, loading, error } = useQuery(GET_SIDEBAR_COUNTS, {
    errorPolicy: 'all',
    pollInterval: 30000, // Update every 30 seconds
  });

  return {
    memoriesCount: data?.analyticsOverview?.totalMemories || 0,
    contextsCount: data?.analyticsOverview?.totalContexts || 0,
    agentsCount: data?.analyticsOverview?.totalAgents || 0,
    loading,
    error,
  };
};

// Create navigation items with real data
const useNavigationItems = () => {
  const { memoriesCount, contextsCount, agentsCount } = useSidebarCounts();

  return [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/',
      icon: 'Home',
    },
    {
      id: 'memories',
      label: 'Memories',
      path: '/memories',
      icon: 'Brain',
      badge: memoriesCount > 0 ? memoriesCount.toString() : undefined,
    },
    {
      id: 'contexts',
      label: 'Context Manager',
      path: '/contexts',
      icon: 'Database',
      badge: contextsCount > 0 ? contextsCount.toString() : undefined,
    },
    {
      id: 'search',
      label: 'Search',
      path: '/search',
      icon: 'Search',
    },
    {
      id: 'tags',
      label: 'Tags',
      path: '/tags',
      icon: 'Tags',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/analytics',
      icon: 'BarChart3',
    },
    {
      id: 'agents',
      label: 'Agent Management',
      path: '/agents',
      icon: 'Bot',
      badge: agentsCount > 0 ? agentsCount.toString() : undefined,
    },
  ];
};

const adminItems: NavItem[] = [
  {
    id: 'users',
    label: 'Users',
    path: '/admin/users',
    icon: 'Users',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'Settings',
  },
];

const iconMap = {
  Home,
  Brain,
  Search,
  Tags,
  Settings,
  BarChart3,
  Users,
  Bot,
  Database,
};

interface NavItemComponentProps {
  item: NavItem;
  isCollapsed: boolean;
  loading?: boolean;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({ item, isCollapsed, loading = false }) => {
  const location = useLocation();
  const Icon = iconMap[item.icon as keyof typeof iconMap];
  const isActive = location.pathname === item.path;

  return (
    <NavLink
      to={item.path}
      className={({ isActive: linkIsActive }) =>
        clsx(
          'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
          linkIsActive || isActive
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
          isCollapsed ? 'justify-center px-2' : 'justify-start'
        )
      }
      title={isCollapsed ? item.label : undefined}
    >
      <Icon className={clsx('flex-shrink-0 w-5 h-5', !isCollapsed && 'mr-3')} />
      
      {!isCollapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-primary-600 text-white rounded-full min-w-[1.25rem] h-5">
              {loading ? (
                <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
              ) : (
                item.badge
              )}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarState,
  onToggleCollapse,
}) => {
  const { isCollapsed, isMobile } = sidebarState;
  const navigationItems = useNavigationItems(); // Use dynamic navigation items
  const { loading } = useSidebarCounts(); // Get loading state for badges

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={onToggleCollapse}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          isMobile && isCollapsed && '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto'
        )}
      >
        {/* Header */}
        <div className={clsx(
          'flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {!isCollapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                MemoryMgr
              </span>
            </div>
          )}

          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex btn-ghost p-1.5"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <NavItemComponent
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                loading={loading}
              />
            ))}
          </div>

          {/* Divider */}
          {!isCollapsed && (
            <div className="pt-4 mt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Administration
              </h3>
            </div>
          )}

          {/* Admin Navigation */}
          <div className={clsx('space-y-1', isCollapsed && 'pt-4 border-t border-gray-200 dark:border-gray-700')}>
            {adminItems.map((item) => (
              <NavItemComponent
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Version 1.0.0
            </div>
          </div>
        )}
      </div>
    </>
  );
};