import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthGuard } from './components/auth/AuthGuard';
import { LoginForm } from './components/auth/LoginForm';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { MemoriesPage } from './pages/MemoriesPage';
import { ContextsPage } from './pages/ContextsPage';
import { SearchPage } from './pages/SearchPage';
import { TagsPage } from './pages/TagsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import AgentsPage from './pages/AgentsPage';
import { EmbeddedGraphiQLPage } from './pages/EmbeddedGraphiQLPage';

// Admin components
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { RoleManagement } from './pages/admin/RoleManagement';
import { ConfigManagement } from './pages/admin/ConfigManagement';
import { AuditLogs } from './pages/admin/AuditLogs';
import { BackupManagement } from './pages/admin/BackupManagement';
import { MonitoringDashboard } from './pages/admin/MonitoringDashboard';
import { AnalyticsInsights } from './pages/admin/AnalyticsInsights';
import { EnterpriseIntegrations } from './pages/admin/EnterpriseIntegrations';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Login Route */}
        <Route 
          path="/login" 
          element={
            <AuthGuard requireAuth={false}>
              <LoginForm />
            </AuthGuard>
          } 
        />
        
        
        {/* Protected Routes with Main Layout */}
        <Route 
          path="/" 
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="memories" element={<MemoriesPage />} />
          <Route path="contexts" element={<ContextsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="tags" element={<TagsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="graphiql" element={<EmbeddedGraphiQLPage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* Legacy route redirect */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="home" element={<HomePage />} />
        </Route>

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <AuthGuard requireAdmin={true}>
              <AdminLayout />
            </AuthGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="config" element={<ConfigManagement />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="backup" element={<BackupManagement />} />
          <Route path="monitoring" element={<MonitoringDashboard />} />
          <Route path="analytics" element={<AnalyticsInsights />} />
          <Route path="integrations" element={<EnterpriseIntegrations />} />
          <Route path="security" element={<AdminDashboard />} />
        </Route>
        
        {/* Catch-all route - redirect to dashboard */}
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;