import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Send,
  Loader2,
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import axios from "axios";

// Define the form schema
const querySchema = z.object({
  query: z.string().min(1, "Please enter a query").max(500, "Query too long"),
});

type QueryFormData = z.infer<typeof querySchema>;

interface QueryInterfaceProps {
  currentFile: any; // Replace with your actual file type
  currentQuery: any; // Replace with your actual query result type
  onQuerySubmit: (result: any) => void; // Replace with your actual result type
  onDataChange: (data: any) => void; // Add the missing onDataChange property
}

export function QueryInterface({
  currentFile,
  currentQuery,
  onQuerySubmit,
  onDataChange,
}: QueryInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null); // Fixed: renamed from setdata to setData

  const form = useForm<QueryFormData>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      query: "",
    },
  });

  const watchedQuery = form.watch("query");

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
    if (watchedQuery && watchedQuery.length > 2) {
      const filtered = sampleQueries.filter((suggestion) =>
        suggestion.toLowerCase().includes(watchedQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 3));
    } else {
      setSuggestions([]);
    }
  }, [watchedQuery]);

  // Function to send query to backend
  const sendQueryToBackend = async (queryText: string) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/ask",
        {
          filename: currentFile.name, // Backend expects filename
          question: queryText, // Backend expects question
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data;

      // Transform the backend response to match your frontend expectations
      const transformedResult = {
        query: queryText,
        analysis: {
          explanation:
            result.analysis?.explanation || "No explanation provided",
          insights: result.analysis?.insights || [],
          code: result.analysis?.code,
        },
        chart: {
          type: result.chart?.type,
          data: result.chart?.data || [],
        },
        metadata: result.metadata,
        sample_data: result.sample_data,
        columns: result.columns,
        chartData: result.chart?.data || [], // For compatibility with existing UI
        chartType: result.chart?.type, // For compatibility with existing UI
      };

      console.log("Transformed result:", transformedResult);
      setData(transformedResult); // Fixed: using setData instead of setdata
      onDataChange(transformedResult.chart);
      return transformedResult;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Axios error sending query to backend:",
          error.response?.data?.detail || error.message
        );
        throw new Error(error.response?.data?.detail || error.message);
      } else {
        console.error("Error sending query to backend:", error);
        throw error;
      }
    }
  };

  const handleSubmit = async (formData: QueryFormData) => {
    await handleQuerySubmit(formData.query);
  };

  const handleQuerySubmit = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      // Send query to your actual backend
      const result = await sendQueryToBackend(queryText);

      // Pass the result to the parent component
      onQuerySubmit(result);

      // Reset form
      form.reset();
      setSuggestions([]);
    } catch (error) {
      console.error("Error processing query:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process query. Please try again.";
      setError(errorMessage);

      // Also set form error for better UX
      form.setError("query", {
        type: "manual",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue("query", suggestion);
    handleQuerySubmit(suggestion);
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Prominent Input Bar with shadcn Form */}
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

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="query"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Query</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                placeholder="e.g., 'Show me a bar chart of sales by month'"
                                className="h-12 text-base pr-12"
                                disabled={isLoading}
                                {...field}
                              />
                              {isLoading && (
                                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                            </div>
                            <Button
                              type="submit"
                              disabled={!field.value?.trim() || isLoading}
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
                                    type="button"
                                    onClick={() =>
                                      handleSuggestionClick(suggestion)
                                    }
                                    className="w-full text-left px-2 py-2 text-sm hover:bg-muted rounded transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className="text-center">
                        Ask questions about your data and get AI-powered
                        insights
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
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
                onClick={() => handleSuggestionClick(sample)}
              >
                {sample}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Response - Fixed to use 'data' state instead of 'currentQuery' */}
      {data && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              AI Analysis Results
            </CardTitle>
            <CardDescription className="font-medium">
              Query: "{data.query}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Explanation Section */}
            {data.analysis?.explanation && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Analysis
                </h4>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                    {data.analysis.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Insights Section - Fixed the property access */}
            {data.analysis?.insights &&
              Array.isArray(data.analysis.insights) &&
              data.analysis.insights.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                    Key Insights
                  </h4>
                  <div className="space-y-2">
                    {data.analysis.insights.map(
                      (insight: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-l-4 border-amber-500"
                        >
                          <TrendingUp className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                          <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                            {insight}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Chart Info Section - Fixed to use correct data source */}
            {data.chartData && data.chartData.length > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    Visualization Generated
                  </h4>
                </div>
                <p className="text-sm text-green-700 dark:text-green-200 mb-2">
                  {data.chartType
                    ? `${
                        data.chartType.charAt(0).toUpperCase() +
                        data.chartType.slice(1)
                      } chart`
                    : "Chart"}{" "}
                  has been created with {data.chartData.length} data points.
                </p>
                <p className="text-xs text-green-600 dark:text-green-300">
                  View the visualization in the Charts tab
                </p>
              </div>
            )}

            {/* Code Section (if available) */}
            {data.analysis?.code && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-gray-600">{"</>"}</span>
                  Generated Code
                </h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <pre className="text-sm overflow-x-auto">
                    <code className="text-gray-800 dark:text-gray-200">
                      {data.analysis.code}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* Debug Info (remove in production) */}
            {process.env.NODE_ENV === "development" && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Debug Info</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
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
