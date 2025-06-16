import React, { useState, useMemo, useRef } from "react";
import type { ReactElement } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Download,
  Maximize2,
  Minimize2,
  Settings,
  RotateCcw,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

// Theme-aware color schemes
const LIGHT_COLORS = {
  default: [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ],
  blues: [
    "#1e40af",
    "#2563eb",
    "#3b82f6",
    "#60a5fa",
    "#93c5fd",
    "#dbeafe",
    "#eff6ff",
    "#f8fafc",
  ],
  greens: [
    "#166534",
    "#15803d",
    "#16a34a",
    "#22c55e",
    "#4ade80",
    "#86efac",
    "#bbf7d0",
    "#f0fdf4",
  ],
  warm: [
    "#dc2626",
    "#ea580c",
    "#d97706",
    "#ca8a04",
    "#eab308",
    "#facc15",
    "#fde047",
    "#fef3c7",
  ],
  cool: [
    "#1e40af",
    "#3730a3",
    "#4338ca",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#c084fc",
    "#e879f9",
  ],
  monochrome: [
    "#374151",
    "#4b5563",
    "#6b7280",
    "#9ca3af",
    "#d1d5db",
    "#e5e7eb",
    "#f3f4f6",
    "#f9fafb",
  ],
};

const DARK_COLORS = {
  default: [
    "#60a5fa",
    "#000000",
    "#fbbf24",
    "#f87711  ",
    "#a78bfa",
    "#22d3ee",
    "#a3e635",
    "#fb923c",
  ],
  blues: [
    "#93c5fd",
    "#60a5fa",
    "#3b82f6",
    "#2563eb",
    "#1d4ed8",
    "#1e40af",
    "#1e3a8a",
    "#172554",
  ],
  greens: [
    "#86efac",
    "#4ade80",
    "#22c55e",
    "#16a34a",
    "#15803d",
    "#166534",
    "#14532d",
    "#052e16",
  ],
  warm: [
    "#fca5a5",
    "#fb7185",
    "#f472b6",
    "#e879f9",
    "#c084fc",
    "#a855f7",
    "#9333ea",
    "#7c3aed",
  ],
  cool: [
    "#93c5fd",
    "#818cf8",
    "#8b5cf6",
    "#a855f7",
    "#c084fc",
    "#d8b4fe",
    "#e9d5ff",
    "#f3e8ff",
  ],
  monochrome: [
    "#e5e7eb",
    "#d1d5db",
    "#9ca3af",
    "#6b7280",
    "#4b5563",
    "#374151",
    "#1f2937",
    "#111827",
  ],
};

const CHART_TYPES = [
  { value: "bar", label: "Bar Chart", icon: "📊" },
  { value: "line", label: "Line Chart", icon: "📈" },
  { value: "area", label: "Area Chart", icon: "📉" },
  { value: "pie", label: "Pie Chart", icon: "🥧" },
  { value: "scatter", label: "Scatter Plot", icon: "🔵" },
];

const CHART_TYPE_MAPPING: Record<string, string> = {
  BarChart: "bar",
  LineChart: "line",
  AreaChart: "area",
  PieChart: "pie",
  ScatterChart: "scatter",
  ScatterPlot: "scatter",
  bar: "bar",
  line: "line",
  area: "area",
  pie: "pie",
  scatter: "scatter",
};

interface ChartItem {
  name?: string;
  category?: string;
  label?: string;
  value?: number;
  count?: number;
  amount?: number;
  [key: string]: any;
}

interface InputChartData {
  chart?: {
    data: ChartItem[];
    type: string;
  };
  chartData?: ChartItem[];
  chartType?: string;
  data?: ChartItem[];
  type?: string;
  metadata?: Metadata;
  query?: string;
}

interface DataItem {
  name: string;
  value: number;
  [key: string]: any;
}

interface Metadata {
  filename?: string;
  size_kb?: number;
  shape?: string;
  [key: string]: any;
}

interface AdaptedChartData {
  data: DataItem[];
  type: string;
  title: string;
  insights: string[];
  metadata: Metadata;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  isDark,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  isDark: boolean;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={`p-3 border rounded-lg shadow-lg ${
          isDark
            ? "bg-gray-800 border-gray-600 text-white"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        <p className="font-medium">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${
              typeof entry.value === "number"
                ? entry.value.toLocaleString()
                : entry.value
            }`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const adaptChartData = (
  inputData: InputChartData | ChartItem[] | null | undefined
): AdaptedChartData => {
  if (!inputData)
    return { data: [], type: "bar", title: "", insights: [], metadata: {} };

  let data: ChartItem[], type: string, metadata: Metadata, query: string;

  if (!Array.isArray(inputData) && inputData.type && inputData.data) {
    data = inputData.data;
    type = inputData.type;
    metadata = inputData.metadata || {};
    query = inputData.query || "";
  } else if (
    !Array.isArray(inputData) &&
    inputData.chart &&
    inputData.chartData
  ) {
    data = inputData.chartData;
    type = inputData.chartType || inputData.chart.type;
    metadata = inputData.metadata || {};
    query = inputData.query || "";
  } else if (Array.isArray(inputData)) {
    data = inputData;
    type = "bar";
    metadata = {};
    query = "";
  } else {
    return { data: [], type: "bar", title: "", insights: [], metadata: {} };
  }

  const normalized: DataItem[] = data.map((item: ChartItem) => ({
    name: item.name || item.category || item.label || "Unknown",
    value: Number(item.value ?? item.count ?? item.amount) || 0,
    ...item,
  }));

  const normalizedType: string = CHART_TYPE_MAPPING[type] || "bar";

  let title: string = "Chart Data";
  if (query) title = query;
  else if (metadata.filename) title = `Data from ${metadata.filename}`;

  const insights: string[] = generateInsights(normalized, metadata);

  return { data: normalized, type: normalizedType, title, insights, metadata };
};

const generateInsights = (data: DataItem[], metadata: Metadata): string[] => {
  if (!data.length) return [];
  const vals = data.map((d) => d.value).filter((v) => !isNaN(v));
  if (!vals.length) return [];

  const total = vals.reduce((sum, v) => sum + v, 0);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const avg = total / vals.length;
  const maxItem = data.find((d) => d.value === max);
  const insights: string[] = [];

  if (maxItem)
    insights.push(
      `${maxItem.name} has the highest value at ${max.toLocaleString()}`
    );
  insights.push(
    `${vals.filter((v) => v > avg).length} out of ${
      data.length
    } items are above the average of ${avg.toFixed(2)}`
  );
  if (max !== min) {
    const range = (((max - min) / max) * 100).toFixed(1);
    insights.push(
      `There's a ${range}% difference between the highest and lowest values`
    );
  }
  if (metadata.filename)
    insights.push(`Data sourced from ${metadata.filename}`);
  return insights;
};

interface EnhancedChartDisplayProps {
  chartData: InputChartData | ChartItem[] | null | undefined;
  className?: string;
}

const EnhancedChartDisplay: React.FC<EnhancedChartDisplayProps> = ({
  chartData,
  className = "",
}) => {
  const { theme, setTheme } = useTheme();
  const adapted = useMemo(() => adaptChartData(chartData), [chartData]);
  const [chartType, setChartType] = useState(adapted.type);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [colorScheme, setColorScheme] = useState("default");
  const [showControls, setShowControls] = useState(false);
  const chartRef = useRef(null);

  // Determine if dark mode should be used
  const isDark = theme === "dark";

  const colors = useMemo(() => {
    const colorSet = isDark ? DARK_COLORS : LIGHT_COLORS;
    return colorSet[colorScheme as keyof typeof colorSet] || colorSet.default;
  }, [isDark, colorScheme]);

  const downloadChart = (format: "json" | "csv"): void => {
    if (format === "json") {
      const blob = new Blob([JSON.stringify(adapted.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${adapted.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      if (!adapted.data.length) return;
      const headers = Object.keys(adapted.data[0]);
      const csv = [
        headers.join(","),
        ...adapted.data.map((row: DataItem) =>
          headers.map((h: string) => `"${row[h] || ""}"`).join(",")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${adapted.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const resetSettings = () => {
    setChartType(adapted.type);
    setShowGrid(true);
    setShowLegend(true);
    setShowTooltip(true);
    setColorScheme("default");
    setIsFullscreen(false);
  };

  const stats = useMemo(() => {
    if (!adapted.data.length) return null;
    const vals = adapted.data.map((d) => d.value).filter((v) => !isNaN(v));
    if (vals.length <= 1) return null;
    const total = vals.reduce((s, v) => s + v, 0);
    const avg = total / vals.length;
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const maxItem = adapted.data.find((d) => d.value === max);
    const minItem = adapted.data.find((d) => d.value === min);
    const n = vals.length;
    const sumX = vals.reduce((s, _, i) => s + i, 0);
    const sumXY = vals.reduce((s, v, i) => s + i * v, 0);
    const sumXX = vals.reduce((s, _, i) => s + i * i, 0);
    const slope = (n * sumXY - sumX * total) / (n * sumXX - sumX * sumX) || 0;
    const trend: "up" | "down" | "stable" =
      slope > 0.1 ? "up" : slope < -0.1 ? "down" : "stable";
    return {
      total: total.toLocaleString(),
      average: avg.toFixed(2),
      max: { value: max.toLocaleString(), name: maxItem?.name },
      min: { value: min.toLocaleString(), name: minItem?.name },
      count: adapted.data.length,
      trend,
    };
  }, [adapted.data]);

  const getTrendIcon = (trend: "up" | "down" | "stable"): ReactElement => {
    if (trend === "up")
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "down")
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    return (
      <Minus
        className={`h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      />
    );
  };

  const renderChart = () => {
    const height = isFullscreen ? 600 : 400;
    const axisColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "#374151" : "#e5e7eb";

    const commonProps = {
      margin: { top: 20, right: 30, left: 20, bottom: 60 },
    };

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={adapted.data} {...commonProps}>
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  opacity={0.5}
                />
              )}
              <XAxis
                dataKey="name"
                angle={adapted.data.length > 5 ? -45 : 0}
                textAnchor={adapted.data.length > 5 ? "end" : "middle"}
                height={60}
                tick={{ fontSize: 12, fill: axisColor }}
                axisLine={{ stroke: axisColor }}
                tickLine={{ stroke: axisColor }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: axisColor }}
                axisLine={{ stroke: axisColor }}
                tickLine={{ stroke: axisColor }}
              />
              {showTooltip && (
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
              )}
              {showLegend && <Legend wrapperStyle={{ color: axisColor }} />}
              <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={adapted.data} {...commonProps}>
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  opacity={0.5}
                />
              )}
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12, fill: axisColor }}
                axisLine={{ stroke: axisColor }}
                tickLine={{ stroke: axisColor }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: axisColor }}
                axisLine={{ stroke: axisColor }}
                tickLine={{ stroke: axisColor }}
              />
              {showTooltip && (
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
              )}
              {showLegend && <Legend wrapperStyle={{ color: axisColor }} />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={3}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={adapted.data} {...commonProps}>
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  opacity={0.5}
                />
              )}
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12, fill: axisColor }}
                axisLine={{ stroke: axisColor }}
                tickLine={{ stroke: axisColor }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: axisColor }}
                axisLine={{ stroke: axisColor }}
                tickLine={{ stroke: axisColor }}
              />
              {showTooltip && (
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
              )}
              {showLegend && <Legend wrapperStyle={{ color: axisColor }} />}
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.6}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={adapted.data}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={isFullscreen ? 180 : 120}
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(1)}%`
                }
              >
                {adapted.data.map((entry, idx) => (
                  <Cell key={idx} fill={colors[idx % colors.length]} />
                ))}
              </Pie>
              {showTooltip && (
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
              )}
              {showLegend && <Legend wrapperStyle={{ color: axisColor }} />}
            </PieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart {...commonProps}>
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  opacity={0.5}
                />
              )}
              <XAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: axisColor }}
                axisLine={{ stroke: axisColor }}
                tickLine={{ stroke: axisColor }}
              />
              <YAxis
                type="number"
                dataKey="value"
                tick={{ fontSize: 12, fill: axisColor }}
                axisLine={{ stroke: axisColor }}
                tickLine={{ stroke: axisColor }}
              />
              {showTooltip && (
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
              )}
              {showLegend && <Legend wrapperStyle={{ color: axisColor }} />}
              <Scatter data={adapted.data} dataKey="value" fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div
            className={`flex items-center justify-center h-64 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Unsupported chart type
          </div>
        );
    }
  };

  if (!adapted.data.length) {
    return (
      <div
        className={`rounded-lg shadow-lg p-6 ${className} ${
          isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <Info
              className={`h-8 w-8 mx-auto ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            />
            <p className={isDark ? "text-gray-400" : "text-gray-500"}>
              No data available to display
            </p>
          </div>
        </div>
      </div>
    );
  }

  const containerClasses = `${
    isFullscreen ? "fixed inset-0 z-50 p-6 overflow-auto" : ""
  } ${className} ${isDark ? "bg-gray-900" : "bg-gray-50"}`;

  const cardClasses = `rounded-lg shadow-lg p-6 ${
    isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
  }`;

  const buttonClasses = `p-2 rounded-lg transition-colors ${
    isDark
      ? "hover:bg-gray-700 text-gray-300 hover:text-white"
      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
  }`;

  const controlsClasses = `mb-6 p-4 rounded-lg space-y-4 ${
    isDark ? "bg-gray-700" : "bg-gray-50"
  }`;

  const inputClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark
      ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
      : "bg-white border-gray-300 text-gray-900"
  }`;

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{adapted.title}</h2>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {adapted.data.length} data points
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={buttonClasses}
              title="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setShowControls(!showControls)}
              className={buttonClasses}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={buttonClasses}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Controls */}
        {showControls && (
          <div className={controlsClasses}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Chart Type
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className={inputClasses}
                >
                  {CHART_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Color Scheme
                </label>
                <select
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value)}
                  className={inputClasses}
                >
                  {Object.keys(LIGHT_COLORS).map((scheme) => (
                    <option key={scheme} value={scheme}>
                      {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-baseline-last space-x-4">
                {/* <button
                  onClick={resetSettings}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    isDark
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </button> */}
                <button
                  onClick={() => downloadChart("json")}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>JSON</span>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="mr-2"
                />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                  Show Grid
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                  className="mr-2"
                />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                  Show Legend
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showTooltip}
                  onChange={(e) => setShowTooltip(e.target.checked)}
                  className="mr-2"
                />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                  Show Tooltip
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Chart */}
        <div ref={chartRef} className="mb-6">
          {renderChart()}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Total
              </p>
              <p className="text-lg font-semibold">{stats.total}</p>
            </div>
            <div className="text-center">
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Average
              </p>
              <p className="text-lg font-semibold">{stats.average}</p>
            </div>
            <div className="text-center">
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Highest
              </p>
              <p className="text-lg font-semibold">{stats.max.value}</p>
              <p
                className={`text-xs ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {stats.max.name}
              </p>
            </div>
            <div className="text-center flex items-center justify-center">
              <div className="flex items-center space-x-2">
                {getTrendIcon(stats.trend)}
                <span className="text-sm capitalize">{stats.trend}</span>
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        {adapted.insights.length > 0 && (
          <div
            className={`rounded-lg p-4 ${
              isDark ? "bg-blue-900/30 border border-blue-800" : "bg-blue-50"
            }`}
          >
            <h3
              className={`font-medium mb-2 flex items-center ${
                isDark ? "text-blue-300" : "text-blue-900"
              }`}
            >
              <Info className="h-4 w-4 mr-2" />
              Insights
            </h3>
            <ul className="space-y-1">
              {adapted.insights.map((insight, idx) => (
                <li
                  key={idx}
                  className={`text-sm ${
                    isDark ? "text-blue-200" : "text-blue-800"
                  }`}
                >
                  • {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Demo with your exact data format
const ChartDemo = () => {
  // This matches your data format exactly
  const yourDataFormat = {
    type: "BarChart",
    data: [
      { category: "Alpha Phone", value: 11499.77 },
      { category: "SmartKettle", value: 1349.85 },
      { category: "Desk Lamp", value: 1259.58 },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="p-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Enhanced Chart Display
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Theme-aware charts that adapt to light and dark modes
          </p>
        </div>

        <EnhancedChartDisplay
          chartData={yourDataFormat}
          className="max-w-4xl mx-auto"
        />
      </div>
    </div>
  );
};

export default ChartDemo;
