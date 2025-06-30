import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Brush
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartProps {
  data: any[];
  title: string;
  description?: string;
}

// Latency Distribution Chart
export function LatencyDistributionChart({ data, title, description }: ChartProps) {
  const buckets = useMemo(() => {
    // Create histogram buckets
    const bucketSize = 50; // 50ms buckets
    const maxLatency = Math.max(...data.map(d => d.latency));
    const bucketCount = Math.ceil(maxLatency / bucketSize);
    
    const histogram = new Array(bucketCount).fill(0).map((_, i) => ({
      range: `${i * bucketSize}-${(i + 1) * bucketSize}ms`,
      min: i * bucketSize,
      max: (i + 1) * bucketSize,
      count: 0,
      percentage: 0
    }));
    
    // Fill buckets
    data.forEach(d => {
      const bucketIndex = Math.floor(d.latency / bucketSize);
      if (bucketIndex < bucketCount) {
        histogram[bucketIndex].count++;
      }
    });
    
    // Calculate percentages
    const total = data.length;
    histogram.forEach(bucket => {
      bucket.percentage = (bucket.count / total) * 100;
    });
    
    return histogram;
  }, [data]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={buckets}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip 
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-background p-2 border rounded shadow">
                    <p className="font-semibold">{data.range}</p>
                    <p>Count: {data.count}</p>
                    <p>Percentage: {data.percentage.toFixed(2)}%</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="percentage" fill="#8884d8" name="% of Requests">
              {buckets.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.min > 1000 ? '#ff8787' : entry.min > 500 ? '#ffd43b' : '#51cf66'} 
                />
              ))}
            </Bar>
            <ReferenceLine y={0} stroke="#000" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Time Series Performance Chart
export function TimeSeriesPerformanceChart({ data, title, description }: ChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              labelFormatter={(ts) => new Date(ts).toLocaleString()}
              formatter={(value: number, name: string) => {
                if (name.includes('Rate')) return `${value.toFixed(2)}%`;
                if (name.includes('ms')) return `${value.toFixed(0)}ms`;
                return value.toFixed(2);
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="p50"
              stroke="#8884d8"
              name="P50 Latency (ms)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="p95"
              stroke="#82ca9d"
              name="P95 Latency (ms)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="p99"
              stroke="#ffc658"
              name="P99 Latency (ms)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="errorRate"
              stroke="#ff8787"
              name="Error Rate (%)"
              strokeWidth={2}
              dot={false}
            />
            <Brush dataKey="timestamp" height={30} stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Server Health Radar Chart
export function ServerHealthRadarChart({ data, title, description }: ChartProps) {
  const metrics = [
    { metric: 'Uptime', key: 'uptime', max: 100 },
    { metric: 'Performance', key: 'performance', max: 100 },
    { metric: 'Capacity', key: 'capacity', max: 100 },
    { metric: 'Reliability', key: 'reliability', max: 100 },
    { metric: 'Efficiency', key: 'efficiency', max: 100 }
  ];
  
  const radarData = metrics.map(({ metric, key }) => ({
    metric,
    ...data.reduce((acc, server) => ({
      ...acc,
      [server.name]: server[key] || 0
    }), {})
  }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            {data.map((server, index) => (
              <Radar
                key={server.name}
                name={server.name}
                dataKey={server.name}
                stroke={['#8884d8', '#82ca9d', '#ffc658', '#ff8787'][index % 4]}
                fill={['#8884d8', '#82ca9d', '#ffc658', '#ff8787'][index % 4]}
                fillOpacity={0.3}
              />
            ))}
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Geographic Distribution Heatmap
export function GeographicHeatmap({ data, title, description }: ChartProps) {
  // Transform data for treemap visualization
  const treeData = useMemo(() => {
    const regions = data.reduce((acc, item) => {
      const region = item.region || 'Unknown';
      if (!acc[region]) {
        acc[region] = {
          name: region,
          children: [],
          value: 0
        };
      }
      acc[region].children.push({
        name: item.server,
        value: item.requests,
        latency: item.avgLatency
      });
      acc[region].value += item.requests;
      return acc;
    }, {} as Record<string, any>);
    
    return {
      name: 'Global',
      children: Object.values(regions)
    };
  }, [data]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={treeData.children}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="#fff"
            content={({ x, y, width, height, name, value, payload }: any) => {
              const fontSize = Math.min(width / name.length * 1.5, height / 4, 14);
              return (
                <g>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={COLORS[payload.index % COLORS.length]}
                    fillOpacity={0.8}
                  />
                  {width > 50 && height > 30 && (
                    <>
                      <text
                        x={x + width / 2}
                        y={y + height / 2 - fontSize / 2}
                        fill="#fff"
                        fontSize={fontSize}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {name}
                      </text>
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + fontSize / 2}
                        fill="#fff"
                        fontSize={fontSize * 0.8}
                        textAnchor="middle"
                      >
                        {value.toLocaleString()} reqs
                      </text>
                    </>
                  )}
                </g>
              );
            }}
          />
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Throughput vs Latency Scatter Plot
export function ThroughputLatencyScatter({ data, title, description }: ChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="throughput" 
              name="Throughput (ops/s)"
              unit=" ops/s"
            />
            <YAxis 
              type="number" 
              dataKey="latency" 
              name="Latency (ms)"
              unit=" ms"
            />
            <ZAxis 
              type="number" 
              dataKey="errorRate" 
              range={[50, 400]} 
              name="Error Rate"
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-background p-2 border rounded shadow">
                    <p className="font-semibold">{data.server}</p>
                    <p>Throughput: {data.throughput.toFixed(2)} ops/s</p>
                    <p>Latency: {data.latency.toFixed(2)} ms</p>
                    <p>Error Rate: {data.errorRate.toFixed(2)}%</p>
                  </div>
                );
              }}
            />
            <Scatter 
              name="Servers" 
              data={data} 
              fill="#8884d8"
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const color = payload.errorRate > 1 ? '#ff8787' : 
                             payload.errorRate > 0.5 ? '#ffd43b' : '#51cf66';
                return <circle cx={cx} cy={cy} r={6} fill={color} />;
              }}
            />
            <Legend />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Network Flow Sankey Diagram (simplified as stacked area)
export function NetworkFlowChart({ data, title, description }: ChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(ts) => new Date(ts).toLocaleString()}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="encrypt"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              name="Encryption"
            />
            <Area
              type="monotone"
              dataKey="decrypt"
              stackId="1"
              stroke="#82ca9d"
              fill="#82ca9d"
              name="Decryption"
            />
            <Area
              type="monotone"
              dataKey="session"
              stackId="1"
              stroke="#ffc658"
              fill="#ffc658"
              name="Sessions"
            />
            <Area
              type="monotone"
              dataKey="verify"
              stackId="1"
              stroke="#ff8787"
              fill="#ff8787"
              name="Verifications"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Export all chart components
export const ChartComponents = {
  LatencyDistributionChart,
  TimeSeriesPerformanceChart,
  ServerHealthRadarChart,
  GeographicHeatmap,
  ThroughputLatencyScatter,
  NetworkFlowChart
};