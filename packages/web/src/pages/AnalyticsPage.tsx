import React, { useState } from 'react';
import { 
  Activity, 
  Server, 
  Brain, 
  Users, 
  FileText, 
  Bell, 
  BarChart3,
  Settings,
  TrendingUp 
} from 'lucide-react';
import { subDays } from 'date-fns';

// Import analytics components
import { AnalyticsDashboard } from '../components/analytics/dashboard/AnalyticsDashboard';
import { MemoryAnalytics } from '../components/analytics/system/MemoryAnalytics';
import { MLModelMetrics } from '../components/analytics/ml/MLModelMetrics';
import { AgentPerformance } from '../components/analytics/agents/AgentPerformance';
import { UserBehavior } from '../components/analytics/user/UserBehavior';
import { ReportGenerator } from '../components/analytics/reports/ReportGenerator';
import { AlertManager } from '../components/analytics/alerts/AlertManager';
import { SSPAnalytics } from '../components/analytics/ssp/SSPAnalytics';
import { TimeRange } from '../types/analytics';

type AnalyticsView = 'dashboard' | 'memory' | 'ml' | 'agents' | 'users' | 'reports' | 'alerts' | 'ssp';

interface AnalyticsTab {
  id: AnalyticsView;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const analyticsTabs: AnalyticsTab[] = [
  {
    id: 'dashboard',
    name: 'System Dashboard',
    icon: <Activity className="w-5 h-5" />,
    description: 'Real-time system metrics and health monitoring',
  },
  {
    id: 'memory',
    name: 'Memory Analytics',
    icon: <Server className="w-5 h-5" />,
    description: 'Memory usage patterns and optimization insights',
  },
  {
    id: 'ml',
    name: 'ML Models',
    icon: <Brain className="w-5 h-5" />,
    description: 'ML model performance and accuracy tracking',
  },
  {
    id: 'agents',
    name: 'Agent Performance',
    icon: <Settings className="w-5 h-5" />,
    description: 'Agent efficiency and resource utilization',
  },
  {
    id: 'users',
    name: 'User Behavior',
    icon: <Users className="w-5 h-5" />,
    description: 'User engagement and behavior analysis',
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: <FileText className="w-5 h-5" />,
    description: 'Automated reporting and data export',
  },
  {
    id: 'alerts',
    name: 'Alerts',
    icon: <Bell className="w-5 h-5" />,
    description: 'Alert management and anomaly detection',
  },
  {
    id: 'ssp',
    name: 'Success Patterns',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'AI learning patterns and agent performance optimization',
  },
];

export const AnalyticsPage: React.FC = () => {
  const [activeView, setActiveView] = useState<AnalyticsView>('dashboard');
  const [timeRange] = useState<TimeRange>({
    start: subDays(new Date(), 7),
    end: new Date(),
    preset: '7d',
  });

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <AnalyticsDashboard className="mt-6" />;
      case 'memory':
        return <MemoryAnalytics timeRange={timeRange} className="mt-6" />;
      case 'ml':
        return <MLModelMetrics timeRange={timeRange} className="mt-6" />;
      case 'agents':
        return <AgentPerformance timeRange={timeRange} className="mt-6" />;
      case 'users':
        return <UserBehavior timeRange={timeRange} className="mt-6" />;
      case 'reports':
        return <ReportGenerator className="mt-6" />;
      case 'alerts':
        return <AlertManager timeRange={timeRange} className="mt-6" />;
      case 'ssp':
        return <SSPAnalytics className="mt-6" />;
      default:
        return <AnalyticsDashboard className="mt-6" />;
    }
  };

  const currentTab = analyticsTabs.find(tab => tab.id === activeView);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Performance & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentTab?.description || 'Comprehensive system performance and analytics dashboard'}
          </p>
        </div>
      </div>

      {/* Analytics Navigation */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Analytics tabs">
            {analyticsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeView === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
                aria-current={activeView === tab.id ? 'page' : undefined}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Analytics Content */}
        <div className="p-6">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
};