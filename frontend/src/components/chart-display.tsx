import React, { useState, useMemo, useRef } from "react";
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
  Grid3X3,
  Eye,
  EyeOff,
  Palette,
  RotateCcw,
  Settings,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

const COLOR_SCHEMES = {
  default: [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FFC658",
    "#FF7C7C",
  ],
  blues: [
    "#003f5c",
    "#2f4b7c",
    "#665191",
    "#a05195",
    "#d45087",
    "#f95d6a",
    "#ff7c43",
    "#ffa600",
  ],
  greens: [
    "#003d00",
    "#006400",
    "#228b22",
    "#32cd32",
    "#90ee90",
    "#98fb98",
    "#f0fff0",
    "#ffffff",
  ],
  warm: [
    "#8B0000",
    "#DC143C",
    "#FF6347",
    "#FF7F50",
    "#FFA500",
    "#FFD700",
    "#FFFF00",
    "#F0E68C",
  ],
  cool: [
    "#000080",
    "#0000CD",
    "#4169E1",
    "#6495ED",
    "#87CEEB",
    "#B0C4DE",
    "#E6E6FA",
    "#F8F8FF",
  ],
  monochrome: [
    "#000000",
    "#333333",
    "#666666",
    "#999999",
    "#CCCCCC",
    "#DDDDDD",
    "#EEEEEE",
    "#F5F5F5",
  ],
};

const CHART_TYPES = [
  { value: "bar", label: "Bar Chart", icon: "📊" },
  { value: "line", label: "Line Chart", icon: "📈" },
  { value: "area", label: "Area Chart", icon: "📉" },
  { value: "pie", label: "Pie Chart", icon: "🥧" },
  { value: "scatter", label: "Scatter Plot", icon: "🔵" },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ChartDisplayProps {
  data: Array<{
    name?: string;
    category?: string;
    value: number;
    [key: string]: any;
  }>;
  type?: string;
  title?: string;
  insights?: string[];
  explanation?: string;
}

const EnhancedChartDisplay = ({
  data,
  type: initialType,
  title,
  insights = [],
  explanation,
}: ChartDisplayProps) => {
  const [chartType, setChartType] = useState(initialType || "bar");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [colorScheme, setColorScheme] = useState("default");
  const [showControls, setShowControls] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Get current color palette
  const currentColors =
    COLOR_SCHEMES[colorScheme as keyof typeof COLOR_SCHEMES] ||
    COLOR_SCHEMES.default;

  // Download functionality
  interface DownloadFormat {
    format: "json" | "csv" | "png";
  }

  interface DataRow {
    [key: string]: any;
  }

  interface ChartDataForDownload {
    name: string;
    value: number;
    [key: string]: any;
  }

  const downloadChart = (format: DownloadFormat["format"]): void => {
    const chartElement = chartRef.current;
    if (!chartElement) return;

    if (format === "json") {
      const dataStr: string = JSON.stringify(normalizedData, null, 2);
      const dataBlob: Blob = new Blob([dataStr], { type: "application/json" });
      const url: string = URL.createObjectURL(dataBlob);
      const link: HTMLAnchorElement = document.createElement("a");
      link.href = url;
      link.download = `${title || "chart-data"}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      const headers: string[] = Object.keys(normalizedData[0] || {});
      const csvContent: string = [
        headers.join(","),
        ...normalizedData.map((row: ChartDataForDownload) =>
          headers
            .map((header: string) => `"${(row as DataRow)[header] || ""}"`)
            .join(",")
        ),
      ].join("\n");
      const dataBlob: Blob = new Blob([csvContent], { type: "text/csv" });
      const url: string = URL.createObjectURL(dataBlob);
      const link: HTMLAnchorElement = document.createElement("a");
      link.href = url;
      link.download = `${title || "chart-data"}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === "png") {
      // For PNG export, we'll use html2canvas if available, otherwise show message
      const svgElement: SVGSVGElement | null =
        chartElement.querySelector("svg");
      if (svgElement) {
        const svgData: string = new XMLSerializer().serializeToString(
          svgElement
        );
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
        const img: HTMLImageElement = new Image();

        img.onload = (): void => {
          canvas.width = img.width;
          canvas.height = img.height;
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob: Blob | null): void => {
              if (blob) {
                const url: string = URL.createObjectURL(blob);
                const link: HTMLAnchorElement = document.createElement("a");
                link.href = url;
                link.download = `${title || "chart"}.png`;
                link.click();
                URL.revokeObjectURL(url);
              }
            });
          }
        };

        img.src =
          "data:image/svg+xml;base64," +
          btoa(unescape(encodeURIComponent(svgData)));
      }
    }
  };

  // Reset all settings
  const resetSettings = () => {
    setChartType(initialType || "bar");
    setShowGrid(true);
    setShowLegend(true);
    setShowTooltip(true);
    setColorScheme("default");
    setIsFullscreen(false);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data
      .map((d) => d.value || d.category || 0)
      .filter((v) => typeof v === "number");
    if (values.length === 0) return null;

    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxItem = data.find((d) => (d.value || d.category) === max);
    const minItem = data.find((d) => (d.value || d.category) === min);

    // Simple trend calculation
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = total;
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);
    const slope =
      n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;

    return {
      total: total.toLocaleString(),
      average: avg.toFixed(2),
      max: {
        value: max.toLocaleString(),
        name: maxItem?.name || maxItem?.category,
      },
      min: {
        value: min.toLocaleString(),
        name: minItem?.name || minItem?.category,
      },
      count: data.length,
      trend: slope > 0.1 ? "up" : slope < -0.1 ? "down" : "stable",
    } as {
      total: string;
      average: string;
      max: { value: string; name: string | undefined };
      min: { value: string; name: string | undefined };
      count: number;
      trend: "up" | "down" | "stable";
    };
  }, [data]);

  const getTrendIcon = (
    trend: "up" | "down" | "stable"
  ): React.ReactElement => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Normalize data structure for different chart types
  const normalizedData = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      name: item.name || item.category || "Unknown",
      ...item,
      value: item.value || 0,
    }));
  }, [data]);

  const renderChart = () => {
    const chartHeight = isFullscreen ? 600 : 400;

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={normalizedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              )}
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={normalizedData.length > 5 ? -45 : 0}
                textAnchor={normalizedData.length > 5 ? "end" : "middle"}
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && <Legend />}
              <Bar
                dataKey="value"
                fill={currentColors[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart
              data={normalizedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              )}
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={currentColors[0]}
                strokeWidth={3}
                dot={{ fill: currentColors[0], strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart
              data={normalizedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              )}
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey="value"
                stroke={currentColors[0]}
                fill={currentColors[0]}
                fillOpacity={0.6}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={normalizedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(1)}%`
                }
                outerRadius={isFullscreen ? 180 : 120}
                fill="#8884d8"
                dataKey="value"
              >
                {normalizedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={currentColors[index % currentColors.length]}
                  />
                ))}
              </Pie>
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart
              data={normalizedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              )}
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis dataKey="value" tick={{ fontSize: 12 }} />
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && <Legend />}
              <Scatter dataKey="value" fill={currentColors[0]} />
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
      className={`space-y-6 ${
        isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""
      }`}
    >
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle>{title}</CardTitle>
              {explanation && <CardDescription>{explanation}</CardDescription>}
            </div>

            {/* Main Controls */}
            <div className="flex items-center gap-2">
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-[160px]">
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

              {/* Download Menu */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadChart("png")}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>

              {/* Settings Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowControls(!showControls)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {showControls ? "Hide" : "Show"} Controls
              </Button>

              {/* Fullscreen Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {isFullscreen && (
                <Button
                  variant="outline"
                  onClick={() => setIsFullscreen(false)}
                >
                  Close
                </Button>
              )}
            </div>
          </div>

          {/* Extended Controls Panel */}
          {showControls && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Display Options */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Display Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-grid" className="text-xs">
                        Grid Lines
                      </Label>
                      <Switch
                        id="show-grid"
                        checked={showGrid}
                        onCheckedChange={setShowGrid}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-legend" className="text-xs">
                        Legend
                      </Label>
                      <Switch
                        id="show-legend"
                        checked={showLegend}
                        onCheckedChange={setShowLegend}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-tooltip" className="text-xs">
                        Tooltips
                      </Label>
                      <Switch
                        id="show-tooltip"
                        checked={showTooltip}
                        onCheckedChange={setShowTooltip}
                      />
                    </div>
                  </div>
                </div>

                {/* Color Scheme */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Color Scheme</Label>
                  <Select value={colorScheme} onValueChange={setColorScheme}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="blues">Blues</SelectItem>
                      <SelectItem value="greens">Greens</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="cool">Cool</SelectItem>
                      <SelectItem value="monochrome">Monochrome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Download Options */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Export Data</Label>
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadChart("json")}
                      className="w-full text-xs"
                    >
                      JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadChart("csv")}
                      className="w-full text-xs"
                    >
                      CSV
                    </Button>
                  </div>
                </div>

                {/* Reset */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reset</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetSettings}
                    className="w-full flex items-center gap-2 text-xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset All
                  </Button>
                </div>
              </div>
            </div>
          )}

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
                {stats.max.name && (
                  <Badge variant="secondary" className="text-xs">
                    {stats.max.name}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Trend</p>
                <div className="flex items-center gap-1">
                  {getTrendIcon(stats.trend)}
                  <span className="text-sm font-semibold capitalize">
                    {stats.trend}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {insights && insights.length > 0 && (
            <div className="space-y-3">
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

        <CardContent className="pt-6" ref={chartRef}>
          {renderChart()}
        </CardContent>
      </Card>

      {/* Data Summary Table - Hidden in fullscreen mode */}
      {!isFullscreen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Data Summary ({normalizedData.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-right p-2 font-medium">Value</th>
                    <th className="text-right p-2 font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedData.map((item, index) => {
                    const total = normalizedData.reduce(
                      (sum, d) => sum + d.value,
                      0
                    );
                    const percentage =
                      total > 0
                        ? ((item.value / total) * 100).toFixed(1)
                        : "0.0";
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
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedChartDisplay;

// Demo component with sample data
const ChartDemo = () => {
  const sampleData = [
    { name: "January", value: 4000 },
    { name: "February", value: 3000 },
    { name: "March", value: 5000 },
    { name: "April", value: 4500 },
    { name: "May", value: 6000 },
    { name: "June", value: 5500 },
  ];

  const insights = [
    "Sales show a strong upward trend with June being the peak month",
    "March and June show the highest performance indicating seasonal patterns",
    "Average monthly sales are 4,667 units with good consistency",
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <EnhancedChartDisplay
        data={sampleData}
        type="bar"
        title="Monthly Sales Performance"
        explanation="This chart shows the sales performance across the first half of the year"
        insights={insights}
      />
    </div>
  );
};
