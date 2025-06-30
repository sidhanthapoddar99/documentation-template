import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar,
  PieChart, 
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { useMetrics } from '@/hooks/useMetrics';
import { formatNumber, formatDuration, formatPercentage } from '@/utils/formatters';

interface MetricCard {
  title: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  format: 'number' | 'percentage' | 'duration';
}

export function AnalyticsDashboard() {
  const { 
    metrics, 
    loading, 
    error, 
    refresh,
    timeRange,
    setTimeRange 
  } = useMetrics();
  
  const [selectedView, setSelectedView] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, refresh]);
  
  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!metrics) return null;
    
    return {
      totalOperations: {
        title: 'Total Operations',
        value: metrics.totalOperations,
        change: metrics.operationsChange,
        trend: metrics.operationsChange > 0 ? 'up' : 'down',
        format: 'number'
      },
      averageLatency: {
        title: 'Average Latency',
        value: metrics.avgLatency,
        change: metrics.latencyChange,
        trend: metrics.latencyChange < 0 ? 'up' : 'down', // Lower is better
        format: 'duration'
      },
      successRate: {
        title: 'Success Rate',
        value: metrics.successRate,
        change: metrics.successRateChange,
        trend: metrics.successRateChange > 0 ? 'up' : 'down',
        format: 'percentage'
      },
      activeServers: {
        title: 'Active Servers',
        value: metrics.activeServers,
        change: metrics.serverChange,
        trend: metrics.serverChange > 0 ? 'up' : 'down',
        format: 'number'
      }
    } as Record<string, MetricCard>;
  }, [metrics]);
  
  // Network health score calculation
  const healthScore = useMemo(() => {
    if (!metrics) return 0;
    
    const weights = {
      availability: 0.3,
      performance: 0.25,
      errorRate: 0.2,
      capacity: 0.15,
      compliance: 0.1
    };
    
    const scores = {
      availability: metrics.availability / 100,
      performance: Math.max(0, 1 - (metrics.avgLatency / 1000)),
      errorRate: 1 - (metrics.errorRate / 100),
      capacity: 1 - (metrics.capacityUsage / 100),
      compliance: metrics.complianceScore / 100
    };
    
    return Object.entries(weights).reduce(
      (total, [key, weight]) => total + (scores[key] * weight * 100),
      0
    );
  }, [metrics]);
  
  const renderMetricCard = (metric: MetricCard) => {
    const formatValue = (value: number | string, format: string) => {
      if (typeof value === 'string') return value;
      
      switch (format) {
        case 'percentage':
          return formatPercentage(value);
        case 'duration':
          return formatDuration(value);
        default:
          return formatNumber(value);
      }
    };
    
    const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
    const trendColor = 
      (metric.format === 'duration' && metric.trend === 'down') ||
      (metric.format !== 'duration' && metric.trend === 'up')
        ? 'text-green-600'
        : 'text-red-600';
    
    return (
      <Card key={metric.title}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {metric.title}
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatValue(metric.value, metric.format)}
          </div>
          <p className={`text-xs flex items-center ${trendColor}`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {Math.abs(metric.change)}%
            <span className="text-muted-foreground ml-1">
              vs last period
            </span>
          </p>
        </CardContent>
      </Card>
    );
  };
  
  const renderHealthScore = () => {
    const getHealthColor = (score: number) => {
      if (score >= 90) return 'text-green-600';
      if (score >= 70) return 'text-yellow-600';
      return 'text-red-600';
    };
    
    const getHealthLabel = (score: number) => {
      if (score >= 90) return 'Excellent';
      if (score >= 70) return 'Good';
      if (score >= 50) return 'Fair';
      return 'Poor';
    };
    
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Network Health Score</CardTitle>
          <CardDescription>
            Overall system health based on multiple factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-5xl font-bold ${getHealthColor(healthScore)}`}>
                {Math.round(healthScore)}
              </div>
              <p className="text-muted-foreground">
                {getHealthLabel(healthScore)}
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div>Availability: {metrics?.availability}%</div>
              <div>Performance: {formatDuration(metrics?.avgLatency || 0)}</div>
              <div>Error Rate: {metrics?.errorRate}%</div>
              <div>Capacity: {metrics?.capacityUsage}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderPerformanceChart = () => {
    if (!metrics?.performanceHistory) return null;
    
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>
            Response times and throughput over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.performanceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="latency"
                stroke="#8884d8"
                name="Latency (ms)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="throughput"
                stroke="#82ca9d"
                name="Throughput (ops/s)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };
  
  const renderOperationBreakdown = () => {
    if (!metrics?.operationTypes) return null;
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Operation Types</CardTitle>
          <CardDescription>
            Distribution of operations by type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.operationTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metrics.operationTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };
  
  const renderServerComparison = () => {
    if (!metrics?.serverMetrics) return null;
    
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Server Performance Comparison</CardTitle>
          <CardDescription>
            Comparing key metrics across active servers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.serverMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="uptime" fill="#8884d8" name="Uptime %" />
              <Bar dataKey="responseTime" fill="#82ca9d" name="Avg Response (ms)" />
              <Bar dataKey="errorRate" fill="#ffc658" name="Error Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };
  
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-lg font-semibold">Failed to load analytics</p>
          <p className="text-muted-foreground">{error.message}</p>
          <Button onClick={refresh} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
        <div className="flex items-center gap-4">
          <DatePickerWithRange
            value={timeRange}
            onChange={setTimeRange}
          />
          <Select
            value={refreshInterval.toString()}
            onValueChange={(v) => setRefreshInterval(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10000">10s</SelectItem>
              <SelectItem value="30000">30s</SelectItem>
              <SelectItem value="60000">1m</SelectItem>
              <SelectItem value="300000">5m</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryMetrics && Object.values(summaryMetrics).map(renderMetricCard)}
      </div>
      
      {/* Main Content */}
      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="servers">Servers</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {renderHealthScore()}
          </div>
          {renderPerformanceChart()}
          <div className="grid gap-4 md:grid-cols-2">
            {renderOperationBreakdown()}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Alert list component */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          {renderPerformanceChart()}
          {/* Additional performance charts */}
        </TabsContent>
        
        <TabsContent value="servers" className="space-y-4">
          {renderServerComparison()}
          {/* Server details table */}
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-4">
          {renderOperationBreakdown()}
          {/* Usage patterns and trends */}
        </TabsContent>
      </Tabs>
    </div>
  );
}