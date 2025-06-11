import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  AreaChart,
  PieChart,
  ScatterChart,
  Pie,
  Bar,
  Line,
  Area,
  Scatter,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Maximize2,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from "lucide-react";

interface ChartDisplayProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  type: "line" | "bar" | "pie" | "area" | "scatter";
  title: string;
  insights?: string[];
  explanation?: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
];

const CHART_TYPES = [
  { value: "bar", label: "Bar Chart", icon: "📊" },
  { value: "line", label: "Line Chart", icon: "📈" },
  { value: "area", label: "Area Chart", icon: "🏔️" },
  { value: "pie", label: "Pie Chart", icon: "🥧" },
  { value: "scatter", label: "Scatter Plot", icon: "⚪" },
];

export function EnhancedChartDisplay({
  data,
  type: initialType,
  title,
  insights = [],
  explanation,
}: ChartDisplayProps) {
  const [chartType, setChartType] = useState(initialType);
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate basic statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data
      .map((d) => d.value)
      .filter((v) => typeof v === "number");
    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxItem = data.find((d) => d.value === max);
    const minItem = data.find((d) => d.value === min);

    // Calculate trend (simple linear regression slope)
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = total;
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    return {
      total: total.toLocaleString(),
      average: avg.toFixed(2),
      max: { value: max.toLocaleString(), name: maxItem?.name },
      min: { value: min.toLocaleString(), name: minItem?.name },
      count: data.length,
      trend: slope > 0.1 ? "up" : slope < -0.1 ? "down" : "stable",
    };
  }, [data]);

  const chartConfig = {
    value: {
      label: "Value",
      color: "hsl(var(--chart-1))",
    },
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const downloadChart = () => {
    // In a real implementation, you'd convert the chart to an image
    const chartData = JSON.stringify(data, null, 2);
    const blob = new Blob([chartData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chart-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    const chartHeight = isFullscreen ? 600 : 400;

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              )}
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={data.length > 10 ? -45 : 0}
                textAnchor={data.length > 10 ? "end" : "middle"}
                height={data.length > 10 ? 80 : 60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
              />
              {showLegend && <Legend />}
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              )}
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={3}
                dot={{ fill: "var(--color-value)", strokeWidth: 2, r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: "var(--color-value)",
                  strokeWidth: 2,
                }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              )}
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                fill="var(--color-value)"
                fillOpacity={0.6}
                strokeWidth={2}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(1)}%`
                }
                outerRadius={chartHeight * 0.25}
                fill="#8884d8"
                dataKey="value"
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              )}
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis dataKey="value" tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Scatter dataKey="value" fill="var(--color-value)" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Unsupported chart type
          </div>
        );
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <Info className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No data available to display
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className={`space-y-4 ${
        isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""
      }`}
    >
      <Card>
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              {explanation && (
                <CardDescription className="text-sm">
                  {explanation}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={chartType}
                onValueChange={(value: any) => setChartType(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={downloadChart}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Statistics Overview */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">{stats.total}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-sm font-semibold">{stats.average}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Highest</p>
                <p className="text-sm font-semibold">{stats.max.value}</p>
                <Badge variant="secondary" className="text-xs">
                  {stats.max.name}
                </Badge>
              </div>
              <div className="space-y-1 flex items-center gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Trend</p>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(stats.trend)}
                    <span className="text-sm font-semibold capitalize">
                      {stats.trend}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" />
                AI Insights
              </h4>
              <div className="space-y-2">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500"
                  >
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      💡
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <ChartContainer config={chartConfig}>{renderChart()}</ChartContainer>
        </CardContent>
      </Card>

      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Chart Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded"
              />
              Show Grid
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
                className="rounded"
              />
              Show Legend
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Data Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Data Summary ({data.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-right p-2">Value</th>
                  <th className="text-right p-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((item, index) => {
                  const total = data.reduce((sum, d) => sum + d.value, 0);
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  return (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2 text-right font-mono">
                        {item.value.toLocaleString()}
                      </td>
                      <td className="p-2 text-right text-muted-foreground">
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
                {data.length > 10 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-2 text-center text-muted-foreground text-xs"
                    >
                      ... and {data.length - 10} more items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
