import { useState, useEffect, useCallback } from 'react';
import type { Role, Permission, AccessPolicy } from '@/types/admin';

// Mock data
const mockPermissions: Permission[] = [
  { id: '1', resource: 'user', action: 'create', description: 'Create new users' },
  { id: '2', resource: 'user', action: 'read', description: 'View user information' },
  { id: '3', resource: 'user', action: 'update', description: 'Update user information' },
  { id: '4', resource: 'user', action: 'delete', description: 'Delete users' },
  { id: '5', resource: 'agent', action: 'create', description: 'Create agents' },
  { id: '6', resource: 'agent', action: 'read', description: 'View agents' },
  { id: '7', resource: 'agent', action: 'update', description: 'Update agents' },
  { id: '8', resource: 'agent', action: 'delete', description: 'Delete agents' },
  { id: '9', resource: 'context', action: 'create', description: 'Create contexts' },
  { id: '10', resource: 'context', action: 'read', description: 'View contexts' },
  { id: '11', resource: 'context', action: 'update', description: 'Update contexts' },
  { id: '12', resource: 'context', action: 'delete', description: 'Delete contexts' },
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'USER',
    description: 'Basic user permissions',
    permissions: mockPermissions.filter(p => p.action === 'read'),
    isSystemRole: true,
    userCount: 45,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 90).toISOString()
  },
  {
    id: '2',
    name: 'ADMIN',
    description: 'Full administrative access',
    permissions: mockPermissions,
    isSystemRole: true,
    userCount: 3,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 90).toISOString()
  }
];

const mockPolicies: AccessPolicy[] = [
  {
    id: '1',
    subject: '1',
    subjectType: 'user',
    resource: 'user',
    action: 'read',
    effect: 'allow',
    conditions: [],
    priority: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const useRoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [policies, setPolicies] = useState<AccessPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRoles(mockRoles);
      setPermissions(mockPermissions);
      setPolicies(mockPolicies);
    } catch (err) {
      setError('Failed to load role management data');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (roleData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Implementation
  }, []);

  const updateRole = useCallback(async (roleId: string, roleData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Implementation
  }, []);

  const deleteRole = useCallback(async (roleId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Implementation
  }, []);

  const duplicateRole = useCallback(async (roleId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Implementation
  }, []);

  const createPermission = useCallback(async (permissionData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Implementation
  }, []);

  const updatePermission = useCallback(async (permissionId: string, permissionData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Implementation
  }, []);

  const deletePermission = useCallback(async (permissionId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Implementation
  }, []);

  const createPolicy = useCallback(async (policyData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Implementation
  }, []);

  const updatePolicy = useCallback(async (policyId: string, policyData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Implementation
  }, []);

  const deletePolicy = useCallback(async (policyId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Implementation
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    roles,
    permissions,
    policies,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    duplicateRole,
    createPermission,
    updatePermission,
    deletePermission,
    createPolicy,
    updatePolicy,
    deletePolicy
  };
};