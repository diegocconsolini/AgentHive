import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScatterController,
  TimeScale,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Scatter } from 'react-chartjs-2';
import { TimeSeries, MetricPoint } from '../../../types/analytics';
import { formatTimestamp, formatBytes, formatLatency, formatPercentage, formatNumber } from './MetricFormatters';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScatterController,
  TimeScale
);

// Common chart theme and styling
const chartTheme = {
  colors: {
    primary: ['#3B82F6', '#06B6D4', '#8B5CF6', '#10B981', '#F59E0B'],
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  grid: {
    light: '#F3F4F6',
    dark: '#374151',
  },
  text: {
    light: '#374151',
    dark: '#F9FAFB',
  },
};

// Base chart options with dark mode support
const getBaseOptions = (isDark: boolean) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    x: {
      grid: {
        color: isDark ? chartTheme.grid.dark : chartTheme.grid.light,
      },
      ticks: {
        color: isDark ? chartTheme.text.dark : chartTheme.text.light,
      },
    },
    y: {
      grid: {
        color: isDark ? chartTheme.grid.dark : chartTheme.grid.light,
      },
      ticks: {
        color: isDark ? chartTheme.text.dark : chartTheme.text.light,
      },
    },
  },
  plugins: {
    legend: {
      labels: {
        color: isDark ? chartTheme.text.dark : chartTheme.text.light,
      },
    },
    tooltip: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      titleColor: isDark ? chartTheme.text.dark : chartTheme.text.light,
      bodyColor: isDark ? chartTheme.text.dark : chartTheme.text.light,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      borderWidth: 1,
    },
  },
});

// Time series line chart component
interface TimeSeriesChartProps {
  data: TimeSeries[];
  height?: number;
  showLegend?: boolean;
  fillArea?: boolean;
  formatValue?: (value: number) => string;
  title?: string;
  className?: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  height = 300,
  showLegend = true,
  fillArea = false,
  formatValue = (value) => formatNumber(value),
  title,
  className = '',
}) => {
  const isDark = document.documentElement.classList.contains('dark');

  const chartData = useMemo(() => ({
    datasets: data.map((series, index) => ({
      label: series.name,
      data: series.data.map(point => ({
        x: point.timestamp.getTime(),
        y: point.value,
      })),
      borderColor: series.color || chartTheme.colors.primary[index % chartTheme.colors.primary.length],
      backgroundColor: fillArea 
        ? `${series.color || chartTheme.colors.primary[index % chartTheme.colors.primary.length]}20`
        : undefined,
      fill: fillArea,
      tension: 0.4,
    })),
  }), [data, fillArea]);

  const options = useMemo(() => ({
    ...getBaseOptions(isDark),
    plugins: {
      ...getBaseOptions(isDark).plugins,
      title: title ? {
        display: true,
        text: title,
        color: isDark ? chartTheme.text.dark : chartTheme.text.light,
      } : undefined,
      legend: {
        ...getBaseOptions(isDark).plugins.legend,
        display: showLegend,
      },
      tooltip: {
        ...getBaseOptions(isDark).plugins.tooltip,
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${formatValue(context.parsed.y)}`;
          },
          title: (context: any) => {
            return formatTimestamp(new Date(context[0].parsed.x), 'MMM dd, HH:mm');
          },
        },
      },
    },
    scales: {
      ...getBaseOptions(isDark).scales,
      x: {
        ...getBaseOptions(isDark).scales.x,
        type: 'time',
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'MMM dd HH:mm',
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy',
          },
        },
      },
      y: {
        ...getBaseOptions(isDark).scales.y,
        ticks: {
          ...getBaseOptions(isDark).scales.y.ticks,
          callback: (value: any) => formatValue(value),
        },
      },
    },
  }), [isDark, showLegend, title, formatValue]);

  return (
    <div className={`${className}`} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

// Bar chart component
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  horizontal?: boolean;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  title?: string;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 300,
  horizontal = false,
  showLegend = false,
  formatValue = (value) => formatNumber(value),
  title,
  className = '',
}) => {
  const isDark = document.documentElement.classList.contains('dark');

  const chartData = useMemo(() => ({
    labels: data.map(item => item.label),
    datasets: [{
      data: data.map(item => item.value),
      backgroundColor: data.map((item, index) => 
        item.color || chartTheme.colors.primary[index % chartTheme.colors.primary.length]
      ),
      borderWidth: 0,
    }],
  }), [data]);

  const options = useMemo(() => ({
    ...getBaseOptions(isDark),
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    plugins: {
      ...getBaseOptions(isDark).plugins,
      title: title ? {
        display: true,
        text: title,
        color: isDark ? chartTheme.text.dark : chartTheme.text.light,
      } : undefined,
      legend: {
        ...getBaseOptions(isDark).plugins.legend,
        display: showLegend,
      },
      tooltip: {
        ...getBaseOptions(isDark).plugins.tooltip,
        callbacks: {
          label: (context: any) => {
            return formatValue(context.parsed[horizontal ? 'x' : 'y']);
          },
        },
      },
    },
    scales: {
      ...getBaseOptions(isDark).scales,
      [horizontal ? 'x' : 'y']: {
        ...getBaseOptions(isDark).scales.y,
        ticks: {
          ...getBaseOptions(isDark).scales.y.ticks,
          callback: (value: any) => formatValue(value),
        },
      },
    },
  }), [isDark, horizontal, showLegend, title, formatValue]);

  return (
    <div className={`${className}`} style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Pie chart component
interface PieChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  type?: 'pie' | 'doughnut';
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  title?: string;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  height = 300,
  type = 'doughnut',
  showLegend = true,
  formatValue = (value) => formatNumber(value),
  title,
  className = '',
}) => {
  const isDark = document.documentElement.classList.contains('dark');

  const chartData = useMemo(() => ({
    labels: data.map(item => item.label),
    datasets: [{
      data: data.map(item => item.value),
      backgroundColor: data.map((item, index) => 
        item.color || chartTheme.colors.primary[index % chartTheme.colors.primary.length]
      ),
      borderWidth: 2,
      borderColor: isDark ? '#1F2937' : '#FFFFFF',
    }],
  }), [data, isDark]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: title ? {
        display: true,
        text: title,
        color: isDark ? chartTheme.text.dark : chartTheme.text.light,
      } : undefined,
      legend: {
        display: showLegend,
        position: 'right' as const,
        labels: {
          color: isDark ? chartTheme.text.dark : chartTheme.text.light,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        titleColor: isDark ? chartTheme.text.dark : chartTheme.text.light,
        bodyColor: isDark ? chartTheme.text.dark : chartTheme.text.light,
        borderColor: isDark ? '#374151' : '#E5E7EB',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${formatValue(context.parsed)} (${percentage}%)`;
          },
        },
      },
    },
  }), [isDark, showLegend, title, formatValue]);

  const Component = type === 'pie' ? Pie : Doughnut;

  return (
    <div className={`${className}`} style={{ height }}>
      <Component data={chartData} options={options} />
    </div>
  );
};

// Metric distribution histogram
interface MetricHistogramProps {
  data: { range: string; count: number }[];
  height?: number;
  title?: string;
  className?: string;
}

export const MetricHistogram: React.FC<MetricHistogramProps> = ({
  data,
  height = 300,
  title,
  className = '',
}) => {
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <BarChart
      data={data.map(item => ({ label: item.range, value: item.count }))}
      height={height}
      title={title}
      className={className}
      formatValue={(value) => formatNumber(value)}
      showLegend={false}
    />
  );
};

// Gauge chart for single metrics
interface GaugeChartProps {
  value: number;
  min: number;
  max: number;
  title: string;
  unit?: string;
  thresholds?: { warning: number; critical: number };
  size?: number;
  className?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min,
  max,
  title,
  unit = '',
  thresholds,
  size = 200,
  className = '',
}) => {
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  
  const getColor = () => {
    if (!thresholds) return chartTheme.colors.primary[0];
    if (value >= thresholds.critical) return chartTheme.colors.error;
    if (value >= thresholds.warning) return chartTheme.colors.warning;
    return chartTheme.colors.success;
  };

  const color = getColor();
  const circumference = 2 * Math.PI * 45; // radius of 45
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(value)}
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{unit}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {percentage.toFixed(0)}%
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
        {title}
      </div>
    </div>
  );
};

// Sparkline component for inline metrics
interface SparklineProps {
  data: MetricPoint[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = chartTheme.colors.primary[0],
  className = '',
}) => {
  if (data.length === 0) return null;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((point.value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className={className}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
};

// Heatmap component
interface HeatmapProps {
  data: { x: string; y: string; value: number }[];
  width?: number;
  height?: number;
  title?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  width = 600,
  height = 400,
  title,
  formatValue = (value) => formatNumber(value),
  className = '',
}) => {
  // This would typically use a specialized heatmap library
  // For now, we'll show a placeholder implementation
  return (
    <div className={`${className} border border-gray-200 dark:border-gray-700 rounded-lg p-4`}>
      <div className="text-center text-gray-500 dark:text-gray-400">
        <div className="text-lg font-medium mb-2">{title || 'Heatmap'}</div>
        <div className="text-sm">Heatmap visualization coming soon...</div>
        <div className="mt-4 grid grid-cols-8 gap-1">
          {Array.from({ length: 56 }, (_, i) => (
            <div
              key={i}
              className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-sm"
              style={{ opacity: Math.random() * 0.7 + 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};