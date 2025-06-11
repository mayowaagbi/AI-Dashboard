import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Sparkles,
  BarChart3,
  Loader2,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

// Interface definitions
interface DataRow {
  [key: string]: any;
}

interface FileData {
  name: string;
  size: string;
  rows: number;
  columns: string[];
  data: DataRow[] | undefined;
}

interface ChartData {
  name: string;
  value: number;
}

interface QueryResult {
  query: string;
  analysis: {
    explanation: string;
    insights: string[];
    code: string;
  };
  chart: {
    type: string;
    data: ChartData[];
  };
  metadata: {
    filename: string;
    size_kb: number;
    shape: string;
  };
  sample_data: any[];
  columns: string[];
  chartData: ChartData[];
  chartType: string;
}

interface QueryInterfaceProps {
  currentFile: FileData;
  currentQuery: QueryResult | null;
  onQuerySubmit: (result: QueryResult) => void;
}

export function QueryInterface({
  currentFile,
  currentQuery,
  onQuerySubmit,
}: QueryInterfaceProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Add data check at the start
  if (!currentFile?.data || currentFile.data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const sampleQueries = [
    "What are the top 5 values in the dataset?",
    "Show me the average of all numeric columns",
    "Create a bar chart of the most frequent categories",
    "What trends can you identify in this data?",
    "Summarize the key insights from this dataset",
    "Show me a pie chart of category distribution",
    "What's the correlation between columns?",
    "Find outliers in the data",
  ];

  // Generate suggestions based on input
  useEffect(() => {
    if (query.length > 2) {
      const filtered = sampleQueries.filter((suggestion) =>
        suggestion.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 3));
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSubmit = async (queryText: string = query) => {
    if (!queryText.trim()) return;

    setIsLoading(true);
    setQuery(queryText);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Safely get columns
      const firstRow = (currentFile.data ?? [])[0];
      const columns = firstRow ? Object.keys(firstRow) : [];

      const numericColumns = columns.filter((col) => {
        const value = firstRow[col];
        return typeof value === "number" && !isNaN(value);
      });

      // Create chart data safely
      const chartData: ChartData[] = (currentFile.data ?? [])
        .slice(0, 5)
        .map((row, idx) => ({
          name: `Item ${idx + 1}`,
          value:
            numericColumns.length > 0 && row[numericColumns[0]] != null
              ? Number(row[numericColumns[0]])
              : idx + 1,
        }));

      // Transform response to match QueryResult type
      const result: QueryResult = {
        query: queryText,
        analysis: {
          explanation: "Here's the analysis of your data...",
          insights: [
            "Key insight 1 about your data",
            "Key insight 2 about your data",
          ],
          code: "// Sample analysis code would appear here",
        },
        chart: {
          type: "bar",
          data: chartData,
        },
        metadata: {
          filename: currentFile.name,
          size_kb: parseFloat(currentFile.size) || 0,
          shape: `${currentFile.rows}x${currentFile.columns.length}`,
        },
        sample_data: currentFile.data?.slice(0, 3) ?? [],
        columns: currentFile.columns,
        chartData: chartData,
        chartType: "bar",
      };

      onQuerySubmit(result);
      setQuery("");
      setSuggestions([]);
    } catch (error) {
      console.error("Error processing query:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Prominent Input Bar */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">
                  Ask Anything About Your Data
                </h2>
              </div>
              <p className="text-muted-foreground">
                Type your question and get instant AI-powered insights with
                visualizations
              </p>
            </div>

            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="e.g., 'Show me a bar chart of sales by month'"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-12 text-base pr-12"
                    disabled={isLoading}
                  />
                  {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Button
                  onClick={() => handleSubmit()}
                  disabled={!query.trim() || isLoading}
                  size="lg"
                  className="h-12 px-6"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Live Suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-10">
                  <div className="p-2 space-y-1">
                    <div className="text-xs text-muted-foreground px-2 py-1">
                      Suggestions:
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSubmit(suggestion)}
                        className="w-full text-left px-2 py-2 text-sm hover:bg-muted rounded transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Click any suggestion to get started instantly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sample, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 transition-colors px-3 py-1"
                onClick={() => handleSubmit(sample)}
              >
                {sample}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Response */}
      {currentQuery && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              AI Analysis Results
            </CardTitle>
            <CardDescription className="font-medium">
              "{currentQuery.query}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p>{currentQuery.analysis.explanation}</p>

              {currentQuery.analysis.insights.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="font-medium">Key Insights:</p>
                  <ul className="space-y-1">
                    {currentQuery.analysis.insights.map((insight, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <TrendingUp className="h-4 w-4 mt-0.5 text-primary" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {currentQuery.chartData && currentQuery.chartData.length > 0 && (
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">
                    {currentQuery.chartType} chart generated
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  View the visualization in the Charts tab
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="border-primary/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="space-y-1">
                <p className="font-medium">Analyzing your data...</p>
                <p className="text-sm text-muted-foreground">
                  Generating insights and visualizations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
