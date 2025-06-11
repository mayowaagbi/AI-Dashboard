import type React from "react";
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
import { Send, Sparkles, BarChart3, Loader2 } from "lucide-react";
import type { UploadedFile, QueryResult } from "@/types";

interface QueryInterfaceProps {
  currentFile: UploadedFile;
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

    // Simulate AI processing with realistic delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate response based on data
    const columns = Object.keys(currentFile.data[0]).filter(
      (key) => key !== "id"
    );
    const numericColumns = columns.filter(
      (col) => typeof currentFile.data[0][col] === "number"
    );

    let answer = "";
    let chartData = null;
    let chartType: "line" | "bar" | "pie" | "area" = "bar";

    if (
      queryText.toLowerCase().includes("chart") ||
      queryText.toLowerCase().includes("graph")
    ) {
      if (numericColumns.length > 0) {
        const col = numericColumns[0];

        if (queryText.toLowerCase().includes("pie")) {
          chartType = "pie";
          // Group data for pie chart
          const grouped = currentFile.data.reduce((acc: any, row) => {
            const key = row[columns[0]]?.toString() || "Unknown";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});

          chartData = Object.entries(grouped)
            .slice(0, 6)
            .map(([name, value]) => ({
              name,
              value: value as number,
            }));
        } else if (queryText.toLowerCase().includes("line")) {
          chartType = "line";
          chartData = currentFile.data.slice(0, 10).map((row, index) => ({
            name: `Point ${index + 1}`,
            value: row[col] as number,
          }));
        } else {
          chartType = "bar";
          chartData = currentFile.data.slice(0, 10).map((row, index) => ({
            name: row[columns[0]]?.toString() || `Item ${index + 1}`,
            value: row[col] as number,
          }));
        }

        answer = `I've created a ${chartType} chart showing ${col} data from your dataset. The visualization helps identify patterns and trends in your data.`;
      } else {
        answer =
          "I couldn't create a chart as there are no numeric columns suitable for visualization. Try uploading data with numeric values.";
      }
    } else if (
      queryText.toLowerCase().includes("average") ||
      queryText.toLowerCase().includes("mean")
    ) {
      if (numericColumns.length > 0) {
        const averages = numericColumns
          .map((col) => {
            const sum = currentFile.data.reduce(
              (acc, row) => acc + (row[col] as number),
              0
            );
            const avg = sum / currentFile.data.length;
            return `**${col}**: ${avg.toFixed(2)}`;
          })
          .join(", ");
        answer = `Here are the averages for your numeric columns: ${averages}. These values give you a central tendency measure for each numeric field.`;
      } else {
        answer =
          "No numeric columns found to calculate averages. Your dataset appears to contain only text data.";
      }
    } else if (
      queryText.toLowerCase().includes("top") ||
      queryText.toLowerCase().includes("highest")
    ) {
      if (numericColumns.length > 0) {
        const col = numericColumns[0];
        const sorted = [...currentFile.data].sort(
          (a, b) => (b[col] as number) - (a[col] as number)
        );
        const top5 = sorted.slice(0, 5);
        answer = `**Top 5 highest values in ${col}**: ${top5
          .map((row, i) => `${i + 1}. ${row[col]}`)
          .join(", ")}. These represent the peak values in your dataset.`;

        // Generate chart for top values
        chartData = top5.map((row, index) => ({
          name: `#${index + 1}`,
          value: row[col] as number,
        }));
        chartType = "bar";
      } else {
        answer =
          "No numeric columns found to identify top values. Consider adding numeric data for statistical analysis.";
      }
    } else if (
      queryText.toLowerCase().includes("summary") ||
      queryText.toLowerCase().includes("insights")
    ) {
      const insights = [
        `📊 **Dataset Overview**: ${currentFile.data.length} rows, ${columns.length} columns`,
        `🔢 **Numeric Columns**: ${numericColumns.length} (${
          numericColumns.join(", ") || "none"
        })`,
        `📝 **Text Columns**: ${columns.length - numericColumns.length}`,
      ];

      if (numericColumns.length > 0) {
        const firstNumCol = numericColumns[0];
        const values = currentFile.data.map(
          (row) => row[firstNumCol] as number
        );
        const min = Math.min(...values);
        const max = Math.max(...values);
        insights.push(`📈 **${firstNumCol} Range**: ${min} to ${max}`);
      }

      answer = insights.join("\n\n");
    } else {
      answer = `I analyzed your dataset "${currentFile.name}" with ${
        currentFile.data.length
      } rows and ${columns.length} columns. 

**Available columns**: ${columns.join(", ")}
**Numeric columns**: ${numericColumns.join(", ") || "none"}

I can help you:
• Create charts and visualizations
• Calculate statistics (averages, sums, etc.)
• Find top/bottom values
• Identify trends and patterns
• Generate insights and summaries

Try asking specific questions like "show me a bar chart" or "what are the top 5 values"!`;
    }

    const result: QueryResult = {
      // id: Date.now().toString(),
      query: queryText,
      result: answer,
      chartData,
      chartType,
    };

    onQuerySubmit(result);
    setQuery("");
    setSuggestions([]);
    setIsLoading(false);
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
                    placeholder="e.g., 'Show me a bar chart of sales by month' or 'What are the top 10 values?'"
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
              <div className="whitespace-pre-line">{currentQuery.result}</div>
            </div>
            {currentQuery.chartData && (
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Chart Generated!</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  View the interactive {currentQuery.chartType} chart in the
                  Charts tab above.
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
