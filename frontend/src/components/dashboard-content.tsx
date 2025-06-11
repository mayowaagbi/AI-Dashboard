import { useState, useEffect } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/file-upload";
import { DataTable } from "@/components/data-table";
import { QueryInterface } from "@/components/query-interface";
import { ChartDisplay } from "@/components/chart-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Upload,
  Table,
  MessageSquare,
  BarChart3,
  Sparkles,
} from "lucide-react";

export interface UploadedFile {
  name: string;
  data: any[];
}

export interface QueryResult {
  query: string;
  result: any;
  chartData?: any;
  chartType?: string;
}
interface DashboardContentProps {
  currentFile: UploadedFile | null;
  currentQuery: QueryResult | null;
  onFileUpload: (file: UploadedFile) => void;
  onQuerySubmit: (result: QueryResult) => void;
}

export function DashboardContent({
  currentFile,
  currentQuery,
  onFileUpload,
  onQuerySubmit,
}: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState("upload");

  // Auto-switch to query tab when file is uploaded
  useEffect(() => {
    if (currentFile && activeTab === "upload") {
      setActiveTab("query");
    }
  }, [currentFile, activeTab]);

  // Auto-switch to charts tab when chart is generated
  useEffect(() => {
    if (currentQuery?.chartData && activeTab !== "charts") {
      // Small delay to let user see the response first
      setTimeout(() => setActiveTab("charts"), 2000);
    }
  }, [currentQuery?.chartData, activeTab]);

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
        </div>
      </header>

      <div className=" p-6">
        {!currentFile ? (
          <div className="flex flex-col items-center justify-center  space-y-8">
            <div className="text-center space-y-4 max-w-2xl">
              <div className="relaive">
                <Upload className="h-16 w-16 mx-auto text-primary mb-4" />
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-3xl font-bold">
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
                {currentQuery?.chartData && (
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="query" className="space-y-6">
              <QueryInterface
                currentFile={currentFile}
                onQuerySubmit={onQuerySubmit}
                currentQuery={currentQuery}
              />
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Explorer</CardTitle>
                  <CardDescription>
                    Browse, search, and analyze your uploaded data with
                    interactive controls.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable data={currentFile.data} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="space-y-6">
              {currentQuery?.chartData ? (
                <ChartDisplay
                  data={currentQuery.chartData}
                  type={
                    ["line", "bar", "pie", "area"].includes(
                      currentQuery.chartType as string
                    )
                      ? (currentQuery.chartType as
                          | "line"
                          | "bar"
                          | "pie"
                          | "area")
                      : "bar"
                  }
                  title={currentQuery.query}
                />
              ) : (
                <Card className="border-dashed border-2">
                  <CardHeader className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <CardTitle>No Charts Generated Yet</CardTitle>
                    <CardDescription className="max-w-md mx-auto">
                      Go to the "Ask AI" tab and request a chart or
                      visualization. Try asking: "Create a bar chart" or "Show
                      me a pie chart of the data"
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
