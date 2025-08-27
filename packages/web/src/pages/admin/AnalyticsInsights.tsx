import React from 'react';
import { TrendingUp, BarChart3, Activity, Brain } from 'lucide-react';

export function AnalyticsInsights() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics & Insights</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Trends
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Comprehensive analytics on agent usage, context management patterns, and system performance trends.
            </p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Real-time monitoring of system performance, response times, and resource utilization.
            </p>
          </div>
        </div>
        
        <div className="card md:col-span-2">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Advanced Insights
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              AI-powered recommendations for system optimization, predictive analytics, and advanced reporting capabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}