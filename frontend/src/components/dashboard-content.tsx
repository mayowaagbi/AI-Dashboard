import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Upload,
  MessageSquare,
  BarChart3,
  Table,
} from "lucide-react";
import { FileUpload } from "./file-upload";
import { QueryInterface } from "./query-interface";
import { DataTable } from "./data-table";
import EnhancedChartDisplay from "./chart-display";
import type { QueryResult } from "./types";

interface FileData {
  name: string;
  size: string;
  rows: number;
  columns: string[];
  data: Record<string, any>[] | undefined;
}

interface DashboardContentProps {
  currentFile: FileData | null;
  currentQuery: QueryResult | null;
  onFileUpload: (file: FileData) => void;
  onQuerySubmit: (query: string, result: QueryResult) => void;
}

export function DashboardContent({
  currentFile,
  currentQuery,
  onFileUpload,
  onQuerySubmit,
}: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [sharedData, setSharedData] = useState<any>(null);
  // Add state to persist query interface data
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [currentQueryInput, setCurrentQueryInput] = useState("");

  // Auto-switch to query tab when file is uploaded
  useEffect(() => {
    if (currentFile && activeTab === "upload") {
      setActiveTab("query");
    }
  }, [currentFile, activeTab]);

  // Modified: Remove automatic tab switching to charts
  // Only update shared data, don't auto-switch tabs
  useEffect(() => {
    if (sharedData) {
      // Optional: You can still show a notification or highlight the charts tab
      // but don't automatically switch
    }
  }, [sharedData]);

  // Handle query submission - lift state up to parent and update local chart data
  const handleQuerySubmit = (result: QueryResult) => {
    try {
      // Add to query history
      setQueryHistory((prev) => [...prev, result]);

      // Update shared chart data for EnhancedChartDisplay
      if (result.chart) {
        setSharedData(result.chart);
      }
      // Pass to parent component
      onQuerySubmit(result.query, result);
    } catch (error) {
      console.error("Error handling query submission:", error);
    }
  };

  // Handle data changes from QueryInterface (lifting state up)
  const handleDataChange = (chartData: any) => {
    setSharedData(chartData);
  };

  // Handle query input changes to persist the input
  const handleQueryInputChange = (input: string) => {
    setCurrentQueryInput(input);
  };

  return (
    <SidebarInset className="border border-amber-400 m-0 w-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {currentFile
              ? `Analyzing: ${currentFile.name}`
              : "AI Data Analysis Dashboard"}
          </h2>
          {currentFile && (
            <Badge variant="secondary" className="ml-2">
              {(currentFile.data?.length || 0).toLocaleString()} rows ×{" "}
              {currentFile.columns?.length || 0} cols
            </Badge>
          )}
        </div>
      </header>
      <div className="p-6">
        {!currentFile ? (
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="text-center space-y-4 max-w-2xl">
              <div className="relative">
                <Upload className="h-16 w-16 mx-auto text-primary mb-4" />
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-3xl font-bold font-excon ">
                Welcome to AI Data Dashboard
              </h3>
              <p className="text-lg text-muted-foreground">
                Upload your CSV file and start asking questions in natural
                language. Get instant insights, visualizations, and AI-powered
                analysis of your data.
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mt-6">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload CSV</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Ask Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Get Charts</span>
                </div>
              </div>
            </div>
            <FileUpload onFileUpload={onFileUpload} />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger
                value="query"
                className="flex items-center gap-2 relative"
              >
                <MessageSquare className="h-4 w-4" />
                Ask AI
                {currentFile && !currentQuery && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Table className="h-4 w-4" />
                Data
              </TabsTrigger>
              <TabsTrigger
                value="charts"
                className="flex items-center gap-2 relative"
              >
                <BarChart3 className="h-4 w-4" />
                Charts
                {sharedData && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Additional Files</CardTitle>
                  <CardDescription>
                    Upload more CSV files to analyze alongside your current
                    data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload onFileUpload={onFileUpload} />

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">
                      Current File: {currentFile.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Size:</span>{" "}
                        {currentFile.size}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rows:</span>{" "}
                        {(currentFile.data?.length || 0).toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Columns:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(currentFile.columns || []).map((col, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {col}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="query" className="space-y-6">
              <QueryInterface
                currentFile={currentFile}
                currentQuery={currentQuery}
                onQuerySubmit={handleQuerySubmit}
                onDataChange={handleDataChange}
              />
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Explorer</CardTitle>
                  <CardDescription>
                    Browse and analyze your uploaded data with interactive
                    controls.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={
                      (currentFile?.data?.map((row) => ({
                        ...row,
                      })) as Record<string, any>[]) ?? []
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="space-y-6">
              {sharedData ? (
                <EnhancedChartDisplay chartData={sharedData} />
              ) : (
                <Card className="border-dashed border-2">
                  <CardHeader className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <CardTitle>No Charts Generated Yet</CardTitle>
                    <CardDescription className="max-w-md mx-auto">
                      Go to the "Ask AI" tab and request a chart or
                      visualization.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </SidebarInset>
  );
}
