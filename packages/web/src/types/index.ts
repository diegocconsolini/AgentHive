export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: number | string;
  children?: NavItem[];
}

export interface SystemStatus {
  status: 'online' | 'offline' | 'maintenance';
  lastUpdated: string;
  version: string;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
}

export interface SidebarState {
  isCollapsed: boolean;
  isMobile: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Agent management types
export * from './agent';

// Context management types
export * from './context';