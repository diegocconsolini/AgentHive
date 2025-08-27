import React, { useState, useMemo } from 'react';
import { ReportTemplate, ReportSection, GeneratedReport, TimeRange } from '../../../types/analytics';
import { MetricCard, DateRangePicker } from '../shared';
import { formatNumber, formatBytes, formatTimestamp } from '../shared/MetricFormatters';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Mail, 
  Settings,
  Play,
  Pause,
  BarChart3,
  Table,
  FileSpreadsheet,
  Eye,
  Trash2,
  Plus
} from 'lucide-react';
import { subDays, addDays } from 'date-fns';

interface ReportGeneratorProps {
  className?: string;
}

// Mock data generators
const generateReportTemplates = (): ReportTemplate[] => [
  {
    id: 'system-performance',
    name: 'System Performance Report',
    description: 'Comprehensive system metrics and performance analysis',
    type: 'system',
    sections: [
      {
        id: 'overview',
        name: 'System Overview',
        type: 'metrics',
        config: { metrics: ['cpu_usage', 'memory_usage', 'disk_usage'] },
        position: 0,
      },
      {
        id: 'trends',
        name: 'Performance Trends',
        type: 'chart',
        config: { chartType: 'line', metrics: ['response_time', 'throughput'], timeRange: { start: subDays(new Date(), 7), end: new Date() } },
        position: 1,
      },
      {
        id: 'alerts',
        name: 'Recent Alerts',
        type: 'alert',
        config: { limit: 20 },
        position: 2,
      },
    ],
    schedule: {
      frequency: 'weekly',
      time: '08:00',
      timezone: 'UTC',
      enabled: true,
      nextRun: addDays(new Date(), 1),
    },
    recipients: ['admin@company.com', 'devops@company.com'],
    format: 'pdf',
    createdAt: subDays(new Date(), 30),
    updatedAt: subDays(new Date(), 7),
  },
  {
    id: 'memory-analytics',
    name: 'Memory Usage Analytics',
    description: 'Detailed analysis of memory usage patterns and optimization opportunities',
    type: 'usage',
    sections: [
      {
        id: 'memory-overview',
        name: 'Memory Overview',
        type: 'metrics',
        config: { metrics: ['total_memories', 'storage_size', 'growth_rate'] },
        position: 0,
      },
      {
        id: 'distribution',
        name: 'Memory Distribution',
        type: 'chart',
        config: { chartType: 'pie', metrics: ['memory_by_tag'] },
        position: 1,
      },
      {
        id: 'optimization',
        name: 'Optimization Suggestions',
        type: 'table',
        config: { limit: 10 },
        position: 2,
      },
    ],
    recipients: ['analytics@company.com'],
    format: 'html',
    createdAt: subDays(new Date(), 15),
    updatedAt: subDays(new Date(), 3),
  },
  {
    id: 'agent-performance',
    name: 'Agent Performance Dashboard',
    description: 'Agent performance metrics and comparison analysis',
    type: 'performance',
    sections: [
      {
        id: 'agent-metrics',
        name: 'Agent Metrics',
        type: 'metrics',
        config: { metrics: ['response_time', 'success_rate', 'throughput'] },
        position: 0,
      },
      {
        id: 'comparison',
        name: 'Agent Comparison',
        type: 'table',
        config: { limit: 10 },
        position: 1,
      },
    ],
    schedule: {
      frequency: 'daily',
      time: '09:00',
      timezone: 'UTC',
      enabled: true,
      nextRun: addDays(new Date(), 1),
      lastRun: subDays(new Date(), 1),
    },
    recipients: ['team@company.com'],
    format: 'csv',
    createdAt: subDays(new Date(), 5),
    updatedAt: new Date(),
  },
];

const generateReportHistory = (): GeneratedReport[] => [
  {
    id: 'report-001',
    templateId: 'system-performance',
    templateName: 'System Performance Report',
    generatedAt: subDays(new Date(), 1),
    timeRange: { start: subDays(new Date(), 8), end: subDays(new Date(), 1) },
    format: 'pdf',
    size: 2457600, // 2.4MB
    downloadUrl: '/api/reports/report-001.pdf',
    recipients: ['admin@company.com', 'devops@company.com'],
    status: 'completed',
  },
  {
    id: 'report-002',
    templateId: 'memory-analytics',
    templateName: 'Memory Usage Analytics',
    generatedAt: subDays(new Date(), 2),
    timeRange: { start: subDays(new Date(), 30), end: subDays(new Date(), 2) },
    format: 'html',
    size: 1234567, // 1.2MB
    downloadUrl: '/api/reports/report-002.html',
    recipients: ['analytics@company.com'],
    status: 'completed',
  },
  {
    id: 'report-003',
    templateId: 'agent-performance',
    templateName: 'Agent Performance Dashboard',
    generatedAt: new Date(),
    timeRange: { start: subDays(new Date(), 1), end: new Date() },
    format: 'csv',
    size: 87654, // 87KB
    recipients: ['team@company.com'],
    status: 'generating',
  },
];

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'templates' | 'history' | 'create'>('templates');
  const [templates] = useState<ReportTemplate[]>(generateReportTemplates());
  const [reportHistory] = useState<GeneratedReport[]>(generateReportHistory());
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  const reportStats = useMemo(() => {
    const totalReports = reportHistory.length;
    const completedReports = reportHistory.filter(r => r.status === 'completed').length;
    const totalSize = reportHistory.filter(r => r.size).reduce((acc, r) => acc + (r.size || 0), 0);
    const avgSize = totalSize / reportHistory.filter(r => r.size).length;

    return [
      {
        title: 'Total Reports',
        value: totalReports,
        format: 'number' as const,
        trend: 15.3,
        icon: <FileText className="w-6 h-6" />,
        status: 'healthy' as const,
      },
      {
        title: 'Completed',
        value: completedReports,
        format: 'number' as const,
        trend: 8.7,
        icon: <BarChart3 className="w-6 h-6" />,
        status: 'healthy' as const,
        description: `${Math.round((completedReports / totalReports) * 100)}% success rate`,
      },
      {
        title: 'Templates Active',
        value: templates.filter(t => t.schedule?.enabled).length,
        format: 'number' as const,
        trend: 0,
        icon: <Calendar className="w-6 h-6" />,
        status: 'healthy' as const,
        description: `${templates.length} total templates`,
      },
      {
        title: 'Avg Report Size',
        value: avgSize,
        format: 'bytes' as const,
        trend: -12.5,
        icon: <Download className="w-6 h-6" />,
        status: 'healthy' as const,
      },
    ];
  }, [templates, reportHistory]);

  const getStatusIcon = (status: GeneratedReport['status']) => {
    switch (status) {
      case 'completed':
        return <Eye className="w-4 h-4 text-green-500" />;
      case 'generating':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
      case 'html':
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderTemplates = () => (
    <div className="space-y-6">
      {/* Templates list */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Report Templates
            </h4>
            <button
              onClick={() => setViewMode('create')}
              className="btn btn-primary btn-sm inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {templates.map((template) => (
            <div key={template.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">
                      {template.name}
                    </h5>
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${template.type === 'system' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                        template.type === 'usage' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                      }
                    `}>
                      {template.type}
                    </span>
                    {template.schedule?.enabled && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Scheduled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      {getFormatIcon(template.format)}
                      <span>{template.format.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{template.recipients.length} recipients</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>{template.sections.length} sections</span>
                    </div>
                    {template.schedule && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{template.schedule.frequency}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {/* Generate now */}}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Generate Now"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Edit Template"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {template.schedule?.enabled ? (
                    <button
                      onClick={() => {/* Pause schedule */}}
                      className="p-2 text-yellow-500 hover:text-yellow-600"
                      title="Pause Schedule"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {/* Enable schedule */}}
                      className="p-2 text-green-500 hover:text-green-600"
                      title="Enable Schedule"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      {/* Report history */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Report History
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Report</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Generated</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Time Range</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Format</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Size</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Status</th>
                <th className="text-center py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportHistory.map((report) => (
                <tr key={report.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {report.templateName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {report.id}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                    {formatTimestamp(report.generatedAt)}
                  </td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                    <div className="text-xs">
                      {formatTimestamp(report.timeRange.start, 'MMM dd')} - {formatTimestamp(report.timeRange.end, 'MMM dd')}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {getFormatIcon(report.format)}
                      <span className="uppercase text-gray-600 dark:text-gray-300">
                        {report.format}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                    {report.size ? formatBytes(report.size) : '-'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(report.status)}
                      <span className={`
                        text-xs font-medium capitalize
                        ${report.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                          report.status === 'generating' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }
                      `}>
                        {report.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {report.status === 'completed' && report.downloadUrl && (
                      <button
                        onClick={() => {/* Download report */}}
                        className="p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Download Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCreateTemplate = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
          Create Report Template
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template configuration form would go here */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                placeholder="Enter template name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                placeholder="Enter template description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="system">System Performance</option>
                <option value="usage">Usage Analytics</option>
                <option value="performance">Performance Analysis</option>
                <option value="cost">Cost Analysis</option>
                <option value="custom">Custom Report</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output Format
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="pdf">PDF</option>
                <option value="html">HTML</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipients
              </label>
              <input
                type="email"
                placeholder="Enter email addresses (comma-separated)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable-schedule"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="enable-schedule" className="text-sm text-gray-700 dark:text-gray-300">
                Enable scheduled generation
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setViewMode('templates')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => {/* Save template */}}
            className="btn btn-primary"
          >
            Create Template
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      {/* Header with stats */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Report Generator
            </h3>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('templates')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'templates'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'history'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setViewMode('create')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'create'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Create
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportStats.map((stat) => (
            <MetricCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              format={stat.format}
              trend={stat.trend}
              icon={stat.icon}
              status={stat.status}
              description={stat.description}
            />
          ))}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'templates' && renderTemplates()}
      {viewMode === 'history' && renderHistory()}
      {viewMode === 'create' && renderCreateTemplate()}
    </div>
  );
};