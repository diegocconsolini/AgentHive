import React, { useState, useCallback } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Activity,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  Download,
  Upload
} from 'lucide-react';
import type { UserWithStats, Role } from '@/types/admin';
import { useUserManagement } from '@/hooks/useUserManagement';
import { formatDate, formatNumber } from '@/lib/utils';

export const UserManagement: React.FC = () => {
  const {
    users,
    roles,
    loading,
    error,
    pagination,
    filters,
    selectedUsers,
    updateFilters,
    updatePagination,
    createUser,
    updateUser,
    deleteUsers,
    toggleUserStatus,
    bulkUpdateUsers,
    exportUsers,
    setSelectedUsers
  } = useUserManagement();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null);
  const [bulkAction, setBulkAction] = useState<string>('');

  const handleCreateUser = useCallback(async (userData: any) => {
    try {
      await createUser(userData);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  }, [createUser]);

  const handleUpdateUser = useCallback(async (userId: string, userData: any) => {
    try {
      await updateUser(userId, userData);
      setShowEditDialog(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }, [updateUser]);

  const handleBulkAction = useCallback(async () => {
    if (selectedUsers.length === 0 || !bulkAction) return;

    try {
      switch (bulkAction) {
        case 'delete':
          await deleteUsers(selectedUsers);
          break;
        case 'activate':
          await bulkUpdateUsers(selectedUsers, { status: 'active' });
          break;
        case 'deactivate':
          await bulkUpdateUsers(selectedUsers, { status: 'inactive' });
          break;
      }
      setSelectedUsers([]);
      setBulkAction('');
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  }, [selectedUsers, bulkAction, deleteUsers, bulkUpdateUsers, setSelectedUsers]);

  const getUserStatusColor = (user: UserWithStats) => {
    if (!user.stats.isOnline) return 'text-gray-500';
    return user.role === 'ADMIN' ? 'text-blue-600' : 'text-green-600';
  };

  const getUserStatusBadge = (user: UserWithStats) => {
    const isOnline = user.stats.isOnline;
    const variant = isOnline ? 'default' : 'secondary';
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
        isOnline 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
      }`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    );
  };

  const renderUserRow = (user: UserWithStats) => (
    <tr key={user.id} className="border-b hover:bg-gray-50">
      <td className="p-4">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          checked={selectedUsers.includes(user.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUsers([...selectedUsers, user.id]);
            } else {
              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
            }
          }}
        />
      </td>
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <Users className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
          user.role === 'ADMIN' 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
        }`}>
          {user.role}
        </span>
      </td>
      <td className="p-4">
        {getUserStatusBadge(user)}
      </td>
      <td className="p-4">
        <div className="text-sm">
          <div>Logins: {formatNumber(user.stats.loginCount)}</div>
          <div className="text-gray-500">
            Last: {formatDate(user.stats.lastLogin)}
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm">
          <div>Agents: {user.stats.agentsUsed}</div>
          <div>Contexts: {user.stats.contextsCreated}</div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex space-x-2">
          <button
            className="btn-outline btn-sm"
            onClick={() => {
              setEditingUser(user);
              setShowEditDialog(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            className="btn-outline btn-sm"
            onClick={() => toggleUserStatus(user.id)}
          >
            {user.stats.isOnline ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </button>
        </div>
      </td>
    </tr>
  );

  const renderCreateUserDialog = () => (
    showCreateDialog && (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New User</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add a new user to the system with role and permissions
            </p>
          </div>
          <div className="p-6">
            <UserForm
              onSubmit={handleCreateUser}
              onCancel={() => setShowCreateDialog(false)}
              roles={roles}
            />
          </div>
        </div>
      </div>
    )
  );

  const renderEditUserDialog = () => (
    showEditDialog && (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit User</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Update user information and permissions
            </p>
          </div>
          <div className="p-6">
            {editingUser && (
              <UserForm
                user={editingUser}
                onSubmit={(data) => handleUpdateUser(editingUser.id, data)}
                onCancel={() => {
                  setShowEditDialog(false);
                  setEditingUser(null);
                }}
                roles={roles}
              />
            )}
          </div>
        </div>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <div className="text-sm text-red-800 dark:text-red-200">
            Failed to load user data: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="btn-outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </h3>
        </div>
        <div className="card-content">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filters.search || ''}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.role || 'all'}
                onChange={(e) => updateFilters({ role: e.target.value === 'all' ? undefined : e.target.value })}
              >
                <option value="all">All roles</option>
                <option value="ADMIN">Admin</option>
                <option value="MODERATOR">Moderator</option>
                <option value="USER">User</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.status || 'all'}
                onChange={(e) => updateFilters({ status: e.target.value === 'all' ? undefined : e.target.value as any })}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="card">
          <div className="card-content pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedUsers.length} user(s) selected
                </span>
                <select
                  className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                >
                  <option value="">Select action...</option>
                  <option value="activate">Activate Users</option>
                  <option value="deactivate">Deactivate Users</option>
                  <option value="delete">Delete Users</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button className="btn-outline" onClick={() => setSelectedUsers([])}>
                  Clear Selection
                </button>
                <button className="btn btn-primary" onClick={handleBulkAction} disabled={!bulkAction}>
                  Apply Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center justify-between text-gray-900 dark:text-gray-100">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Users ({pagination.total})
            </div>
          </h3>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      checked={selectedUsers.length === users.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(users.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-4 text-left">User</th>
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Activity</th>
                  <th className="p-4 text-left">Usage</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(renderUserRow)}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="btn-outline btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => updatePagination({ page: pagination.page - 1 })}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <button
                className="btn-outline btn-sm"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                onClick={() => updatePagination({ page: pagination.page + 1 })}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {renderCreateUserDialog()}
      {renderEditUserDialog()}
    </div>
  );
};

interface UserFormProps {
  user?: UserWithStats;
  roles: Role[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, roles, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'USER',
    password: '',
    confirmPassword: '',
    sendWelcomeEmail: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const submitData = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      ...((!user || formData.password) && { password: formData.password }),
      sendWelcomeEmail: formData.sendWelcomeEmail,
    };

    onSubmit(submitData);
  };

  const [activeTab, setActiveTab] = useState('basic');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
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
            Permissions
          </button>
          <button
            type="button"
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
      </div>

      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              id="role"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {user ? 'New Password (leave empty to keep current)' : 'Password'}
              </label>
              <input
                id="password"
                type="password"
                required={!user}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required={!user || formData.password !== ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Role-based permissions will be applied based on the selected role above.
          </p>
          {/* Role-specific permissions would be rendered here */}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              id="sendWelcomeEmail"
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              checked={formData.sendWelcomeEmail}
              onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
            />
            <label htmlFor="sendWelcomeEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Send welcome email
            </label>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {user ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
};