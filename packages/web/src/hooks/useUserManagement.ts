import { useState, useEffect, useCallback } from 'react';
import type { UserWithStats, Role } from '@/types/admin';

// Mock data for development
const mockUsers: UserWithStats[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'USER',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    stats: {
      loginCount: 45,
      lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      agentsUsed: 8,
      contextsCreated: 23,
      isOnline: true
    }
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'ADMIN',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(), // 60 days ago
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    stats: {
      loginCount: 123,
      lastLogin: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
      agentsUsed: 15,
      contextsCreated: 67,
      isOnline: false
    }
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    role: 'MODERATOR',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    stats: {
      loginCount: 78,
      lastLogin: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
      agentsUsed: 12,
      contextsCreated: 45,
      isOnline: true
    }
  }
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'USER',
    description: 'Basic user with limited permissions',
    permissions: [],
    isSystemRole: true,
    userCount: 1,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 90).toISOString()
  },
  {
    id: '2',
    name: 'MODERATOR',
    description: 'Moderator with content management permissions',
    permissions: [],
    isSystemRole: true,
    userCount: 1,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 90).toISOString()
  },
  {
    id: '3',
    name: 'ADMIN',
    description: 'Administrator with full system access',
    permissions: [],
    isSystemRole: true,
    userCount: 1,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 90).toISOString()
  }
];

interface UserManagementState {
  users: UserWithStats[];
  roles: Role[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  filters: {
    role?: string;
    status?: 'active' | 'inactive' | 'suspended';
    search?: string;
  };
  selectedUsers: string[];
}

export const useUserManagement = () => {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    roles: [],
    loading: true,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    },
    filters: {},
    selectedUsers: []
  });

  const fetchUsers = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Apply filters
      let filteredUsers = mockUsers;
      
      if (state.filters.role) {
        filteredUsers = filteredUsers.filter(user => user.role === state.filters.role);
      }
      
      if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply pagination
      const startIndex = (state.pagination.page - 1) * state.pagination.limit;
      const endIndex = startIndex + state.pagination.limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      setState(prev => ({
        ...prev,
        users: paginatedUsers,
        roles: mockRoles,
        loading: false,
        pagination: {
          ...prev.pagination,
          total: filteredUsers.length
        }
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch users'
      }));
    }
  }, [state.filters, state.pagination.page, state.pagination.limit]);

  const updateFilters = useCallback((newFilters: Partial<UserManagementState['filters']>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      pagination: { ...prev.pagination, page: 1 } // Reset to first page
    }));
  }, []);

  const updatePagination = useCallback((newPagination: Partial<UserManagementState['pagination']>) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, ...newPagination }
    }));
  }, []);

  const setSelectedUsers = useCallback((userIds: string[]) => {
    setState(prev => ({ ...prev, selectedUsers: userIds }));
  }, []);

  const createUser = useCallback(async (userData: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: UserWithStats = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        role: userData.role || 'USER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          loginCount: 0,
          lastLogin: new Date().toISOString(),
          agentsUsed: 0,
          contextsCreated: 0,
          isOnline: false
        }
      };
      
      // In a real implementation, this would trigger a refetch
      setState(prev => ({
        ...prev,
        users: [newUser, ...prev.users]
      }));
      
      return newUser;
    } catch (err) {
      throw new Error('Failed to create user');
    }
  }, []);

  const updateUser = useCallback(async (userId: string, userData: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                ...userData, 
                updatedAt: new Date().toISOString() 
              }
            : user
        )
      }));
    } catch (err) {
      throw new Error('Failed to update user');
    }
  }, []);

  const deleteUsers = useCallback(async (userIds: string[]) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        users: prev.users.filter(user => !userIds.includes(user.id)),
        selectedUsers: []
      }));
    } catch (err) {
      throw new Error('Failed to delete users');
    }
  }, []);

  const toggleUserStatus = useCallback(async (userId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                stats: { 
                  ...user.stats, 
                  isOnline: !user.stats.isOnline 
                },
                updatedAt: new Date().toISOString() 
              }
            : user
        )
      }));
    } catch (err) {
      throw new Error('Failed to toggle user status');
    }
  }, []);

  const bulkUpdateUsers = useCallback(async (userIds: string[], updates: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          userIds.includes(user.id) 
            ? { 
                ...user, 
                ...updates, 
                updatedAt: new Date().toISOString() 
              }
            : user
        ),
        selectedUsers: []
      }));
    } catch (err) {
      throw new Error('Failed to bulk update users');
    }
  }, []);

  const exportUsers = useCallback(async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const csv = [
        ['Name', 'Email', 'Role', 'Created At', 'Last Login', 'Login Count'].join(','),
        ...state.users.map(user => [
          user.name,
          user.email,
          user.role,
          user.createdAt,
          user.stats.lastLogin,
          user.stats.loginCount.toString()
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      throw new Error('Failed to export users');
    }
  }, [state.users]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users: state.users,
    roles: state.roles,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    filters: state.filters,
    selectedUsers: state.selectedUsers,
    updateFilters,
    updatePagination,
    setSelectedUsers,
    createUser,
    updateUser,
    deleteUsers,
    toggleUserStatus,
    bulkUpdateUsers,
    exportUsers
  };
};