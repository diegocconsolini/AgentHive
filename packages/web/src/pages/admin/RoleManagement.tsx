import React, { useState, useCallback } from 'react';
import { 
  Edit,
  Plus,
  Shield,
  Trash2,
  Users,
  Key,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import type { Role, Permission, AccessPolicy } from '@/types/admin';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { formatDate, formatNumber } from '@/lib/utils';

export const RoleManagement: React.FC = () => {
  const {
    roles,
    permissions,
    policies,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    createPermission,
    updatePermission,
    deletePermission,
    createPolicy,
    updatePolicy,
    deletePolicy,
    duplicateRole
  } = useRoleManagement();

  const [activeTab, setActiveTab] = useState('roles');
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const handleCreateRole = useCallback(async (roleData: any) => {
    try {
      await createRole(roleData);
      setShowCreateRoleDialog(false);
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  }, [createRole]);

  const handleUpdateRole = useCallback(async (roleId: string, roleData: any) => {
    try {
      await updateRole(roleId, roleData);
      setShowEditRoleDialog(false);
      setEditingRole(null);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  }, [updateRole]);

  const handleDuplicateRole = useCallback(async (roleId: string) => {
    try {
      await duplicateRole(roleId);
    } catch (error) {
      console.error('Failed to duplicate role:', error);
    }
  }, [duplicateRole]);

  const groupPermissionsByResource = (permissions: Permission[]) => {
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
    
    return grouped;
  };

  const renderRoleCard = (role: Role) => {
    const isExpanded = expandedRole === role.id;
    const groupedPermissions = groupPermissionsByResource(role.permissions);
    
    return (
      <div key={role.id} className="card mb-4">
        <div className="card-header pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{role.name}</h3>
                {role.isSystemRole && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200">
                    <Shield className="h-3 w-3 mr-1" />
                    System
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {formatNumber(role.userCount)} users
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {role.description}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>Created: {formatDate(role.createdAt)}</span>
                <span>Updated: {formatDate(role.updatedAt)}</span>
                <span>{role.permissions.length} permissions</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="btn-outline btn-sm"
                onClick={() => handleDuplicateRole(role.id)}
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                className="btn-outline btn-sm"
                onClick={() => {
                  setEditingRole(role);
                  setShowEditRoleDialog(true);
                }}
                disabled={role.isSystemRole}
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                className="btn-outline btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => deleteRole(role.id)}
                disabled={role.isSystemRole}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                className="btn-ghost btn-sm"
                onClick={() => setExpandedRole(isExpanded ? null : role.id)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="card-content pt-0">
            <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mb-4"></div>
            
            {/* Role Inheritance */}
            {role.inherits && role.inherits.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-sm mb-2">Inherits from:</h4>
                <div className="flex flex-wrap gap-2">
                  {role.inherits.map((inheritedRole) => (
                    <span key={inheritedRole.id} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {inheritedRole.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Permissions */}
            <div>
              <h4 className="font-medium text-sm mb-3">Permissions ({role.permissions.length}):</h4>
              <div className="space-y-3">
                {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                  <div key={resource} className="border rounded p-3">
                    <div className="font-medium text-sm mb-2 capitalize">{resource}</div>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {resourcePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2 text-sm">
                          <Key className="h-3 w-3 text-gray-400" />
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {permission.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPermissionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">System Permissions</h3>
          <p className="text-sm text-gray-600">
            Manage granular permissions that can be assigned to roles
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => {/* Create permission dialog */}}>
          <Plus className="h-4 w-4 mr-2" />
          Create Permission
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(groupPermissionsByResource(permissions)).map(([resource, resourcePermissions]) => (
          <div key={resource} className="card">
            <div className="card-header">
              <h3 className="text-md font-semibold capitalize text-gray-900 dark:text-gray-100">{resource}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {resourcePermissions.length} permissions available
              </p>
            </div>
            <div className="card-content">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {resourcePermissions.map((permission) => (
                  <div key={permission.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {permission.action}
                      </span>
                      <button className="btn-ghost btn-sm">
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600">{permission.description}</p>
                    {permission.conditions && permission.conditions.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mt-2">
                        Conditional
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPoliciesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Access Policies</h3>
          <p className="text-sm text-gray-600">
            Define fine-grained access control policies
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => {/* Create policy dialog */}}>
          <Plus className="h-4 w-4 mr-2" />
          Create Policy
        </button>
      </div>

      <div className="space-y-4">
        {policies.map((policy) => (
          <div key={policy.id} className="card">
            <div className="card-header pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                    {policy.effect === 'allow' ? '✅' : '❌'} {policy.resource} → {policy.action}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {policy.subjectType}: {policy.subject}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    policy.isActive 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
                  }`}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    Priority {policy.priority}
                  </span>
                </div>
              </div>
            </div>
            {policy.conditions.length > 0 && (
              <div className="card-content pt-0">
                <div className="text-sm">
                  <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">Conditions:</div>
                  <div className="space-y-1">
                    {policy.conditions.map((condition, index) => (
                      <div key={index} className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded text-gray-900 dark:text-gray-100">
                        {condition.field} {condition.operator} {JSON.stringify(condition.value)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              Failed to load role management data: {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Role & Permission Management</h1>
          <p className="text-gray-600">Configure roles, permissions, and access policies</p>
        </div>
      </div>

      <div>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              type="button"
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('roles')}
            >
              Roles ({roles.length})
            </button>
            <button
              type="button"
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('permissions')}
            >
              Permissions ({permissions.length})
            </button>
            <button
              type="button"
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'policies'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('policies')}
            >
              Policies ({policies.length})
            </button>
          </nav>
        </div>

        {activeTab === 'roles' && (
        <div className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">System Roles</h3>
              <p className="text-sm text-gray-600">
                Manage user roles and their associated permissions
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreateRoleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </button>
          </div>

          <div className="space-y-4">
            {roles.map(renderRoleCard)}
          </div>
        </div>
        )}

        {activeTab === 'permissions' && (
        <div className="mt-6">
          {renderPermissionsTab()}
        </div>
        )}

        {activeTab === 'policies' && (
        <div className="mt-6">
          {renderPoliciesTab()}
        </div>
        )}
      </div>

      {/* Create Role Dialog */}
      {showCreateRoleDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Role</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Define a new role with specific permissions and access controls
              </p>
            </div>
            <div className="p-6">
              <RoleForm
                permissions={permissions}
                roles={roles}
                onSubmit={handleCreateRole}
                onCancel={() => setShowCreateRoleDialog(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Dialog */}
      {showEditRoleDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Role</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update role information and permissions
              </p>
            </div>
            <div className="p-6">
              {editingRole && (
                <RoleForm
                  role={editingRole}
                  permissions={permissions}
                  roles={roles}
                  onSubmit={(data) => handleUpdateRole(editingRole.id, data)}
                  onCancel={() => {
                    setShowEditRoleDialog(false);
                    setEditingRole(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface RoleFormProps {
  role?: Role;
  permissions: Permission[];
  roles: Role[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const RoleForm: React.FC<RoleFormProps> = ({ role, permissions, roles, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions.map(p => p.id) || [],
    inherits: role?.inherits?.map(r => r.id) || [],
  });

  const [permissionSearch, setPermissionSearch] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('basic');
  
  const groupedPermissions = groupPermissionsByResource(permissions);
  const filteredPermissions = Object.entries(groupedPermissions).reduce((acc, [resource, perms]) => {
    const filtered = perms.filter(p => 
      p.resource.toLowerCase().includes(permissionSearch.toLowerCase()) ||
      p.action.toLowerCase().includes(permissionSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(permissionSearch.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[resource] = filtered;
    }
    return acc;
  }, {} as Record<string, Permission[]>);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => id !== permissionId)
      }));
    }
  };

  const handleResourceToggle = (resourcePermissions: Permission[], checked: boolean) => {
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...resourcePermissionIds])]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => !resourcePermissionIds.includes(id))
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeFormTab === 'basic'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
            onClick={() => setActiveFormTab('basic')}
          >
            Basic Info
          </button>
          <button
            type="button"
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeFormTab === 'permissions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
            onClick={() => setActiveFormTab('permissions')}
          >
            Permissions
          </button>
          <button
            type="button"
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeFormTab === 'inheritance'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
            onClick={() => setActiveFormTab('inheritance')}
          >
            Inheritance
          </button>
        </nav>
      </div>

        {activeFormTab === 'basic' && (
        <div className="space-y-4 mt-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Name
            </label>
            <input
              id="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Content Manager"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this role can do..."
              rows={3}
            />
          </div>
        </div>
        )}

        {activeFormTab === 'permissions' && (
        <div className="space-y-4 mt-6">
          <div>
            <label htmlFor="permissionSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Permissions
            </label>
            <input
              id="permissionSearch"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Search by resource, action, or description..."
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
            />
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(filteredPermissions).map(([resource, resourcePermissions]) => {
              const selectedCount = resourcePermissions.filter(p => formData.permissions.includes(p.id)).length;
              const allSelected = selectedCount === resourcePermissions.length;
              const someSelected = selectedCount > 0 && selectedCount < resourcePermissions.length;

              return (
                <div key={resource} className="card">
                  <div className="card-header pb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        onChange={(e) => handleResourceToggle(resourcePermissions, e.target.checked)}
                      />
                      <h3 className="text-md font-semibold capitalize text-gray-900 dark:text-gray-100">{resource}</h3>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        {selectedCount}/{resourcePermissions.length}
                      </span>
                    </div>
                  </div>
                  <div className="card-content pt-0">
                    <div className="grid gap-2 md:grid-cols-2">
                      {resourcePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 mt-1"
                            checked={formData.permissions.includes(permission.id)}
                            onChange={(e) => handlePermissionToggle(permission.id, e.target.checked)}
                          />
                          <div className="flex-1">
                            <div className="font-mono text-sm text-gray-900 dark:text-gray-100">{permission.action}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{permission.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {activeFormTab === 'inheritance' && (
        <div className="space-y-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Inherit from Roles
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              This role will automatically inherit all permissions from selected roles
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {roles.filter(r => r.id !== role?.id).map((availableRole) => (
                <div key={availableRole.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    checked={formData.inherits.includes(availableRole.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          inherits: [...prev.inherits, availableRole.id]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          inherits: prev.inherits.filter(id => id !== availableRole.id)
                        }));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{availableRole.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{availableRole.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

      <div className="flex justify-end space-x-2">
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {role ? 'Update Role' : 'Create Role'}
        </button>
      </div>
    </form>
  );
};

function groupPermissionsByResource(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
}