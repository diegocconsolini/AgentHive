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
// import { AdminLayout } from './components/admin/AdminLayout';
// import { AdminDashboard } from './pages/admin/AdminDashboard';
// import { UserManagement } from './pages/admin/UserManagement';
// import { RoleManagement } from './pages/admin/RoleManagement';
// import { ConfigManagement } from './pages/admin/ConfigManagement';
// import { AuditLogs } from './pages/admin/AuditLogs';
// import { BackupManagement } from './pages/admin/BackupManagement';
// import { MonitoringDashboard } from './pages/admin/MonitoringDashboard';
// import { AnalyticsInsights } from './pages/admin/AnalyticsInsights';
// import { EnterpriseIntegrations } from './pages/admin/EnterpriseIntegrations';
import AIProviderManagement from './pages/admin/AIProviderManagement';

// Documentation components
import ApplicationManual from './pages/manual/ApplicationManual';
import IntegrationGuide from './pages/integration/IntegrationGuide';
import ApiDocs from './pages/api-docs/ApiDocs';

// SDK Documentation components
import PythonSDK from './pages/docs/PythonSDK';
import NodeJSSDK from './pages/docs/NodeJSSDK';
import GoSDK from './pages/docs/GoSDK';
import JavaSDK from './pages/docs/JavaSDK';
import PHPSDK from './pages/docs/PHPSDK';
import RubySDK from './pages/docs/RubySDK';

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
          <Route path="manual" element={<ApplicationManual />} />
          <Route path="integration" element={<IntegrationGuide />} />
          <Route path="api-docs" element={<ApiDocs />} />
          
          {/* SDK Documentation Routes */}
          <Route path="docs/python" element={<PythonSDK />} />
          <Route path="docs/nodejs" element={<NodeJSSDK />} />
          <Route path="docs/go" element={<GoSDK />} />
          <Route path="docs/java" element={<JavaSDK />} />
          <Route path="docs/php" element={<PHPSDK />} />
          <Route path="docs/ruby" element={<RubySDK />} />
          
          <Route path="settings" element={<SettingsPage />} />
          
          {/* Legacy route redirect */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="home" element={<HomePage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex">
              <div className="w-64 bg-white dark:bg-gray-800 shadow-sm min-h-screen">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
                  <nav className="mt-8">
                    <a href="/admin/providers" className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">AI Providers</a>
                  </nav>
                </div>
              </div>
              <div className="flex-1 p-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Providers</h3>
                    <p className="text-gray-600 dark:text-gray-400">Configure and manage your AI provider settings</p>
                    <a href="/admin/providers" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Manage</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        } />
        <Route path="/admin/providers" element={<AIProviderManagement />} />
        
        {/* Catch-all route - redirect to dashboard */}
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;