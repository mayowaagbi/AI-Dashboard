// import React, { useState, useEffect } from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Sparkles,
//   Upload,
//   MessageSquare,
//   BarChart3,
//   Table,
//   FileText,
//   Loader2,
//   CheckCircle,
//   AlertCircle,
//   TrendingUp,
// } from "lucide-react";

// // Types matching your backend
// interface FileData {
//   name: string;
//   size: string;
//   columns: string[];
//   rows: number;
//   data?: Array<{ [key: string]: any }>;
// }

// interface QueryResult {
//   query: string;
//   analysis: {
//     explanation: string;
//     insights: string[];
//     code: string;
//   };
//   chart: {
//     type: "line" | "bar" | "pie" | "area";
//     data: Array<{
//       name?: string;
//       category?: string;
//       value: number;
//       [key: string]: any;
//     }>;
//   };
//   metadata: {
//     filename: string;
//     size_kb: number;
//     shape: string;
//   };
//   sample_data: Array<{ [key: string]: any }>;
//   columns: string[];
//   chartData?: Array<{ name: string; value: number; [key: string]: any }>;
//   chartType?: string;
// }

// interface DashboardContentProps {
//   currentFile: FileData | null;
//   currentQuery: QueryResult | null;
//   onFileUpload: (file: FileData) => void;
//   onQuerySubmit: (query: string, result: QueryResult) => void;
// }

// // Enhanced FileUpload Component
// function FileUpload({
//   onFileUpload,
//   isLoading,
// }: {
//   onFileUpload: (file: FileData) => void;
//   isLoading?: boolean;
// }) {
//   const [dragActive, setDragActive] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleFileUpload = async (file: File) => {
//     if (!file.name.toLowerCase().endsWith(".csv")) {
//       setError("Please upload a CSV file");
//       return;
//     }

//     setUploading(true);
//     setError(null);

//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const response = await fetch("/api/upload", {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "Upload failed");
//       }

//       const result = await response.json();

//       // Transform backend response to match frontend interface
//       const fileData: FileData = {
//         name: result.filename,
//         size: result.size,
//         columns: result.columns,
//         rows: result.rows,
//       };

//       onFileUpload(fileData);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Upload failed");
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setDragActive(false);

//     const files = Array.from(e.dataTransfer.files);
//     if (files.length > 0) {
//       handleFileUpload(files[0]);
//     }
//   };

//   const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (files && files.length > 0) {
//       handleFileUpload(files[0]);
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <div
//         className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
//           dragActive
//             ? "border-primary bg-primary/5"
//             : "border-muted-foreground/25 hover:border-primary/50"
//         } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
//         onDragOver={(e) => {
//           e.preventDefault();
//           setDragActive(true);
//         }}
//         onDragLeave={() => setDragActive(false)}
//         onDrop={handleDrop}
//       >
//         {uploading ? (
//           <div className="space-y-4">
//             <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
//             <p className="text-sm text-muted-foreground">
//               Uploading and analyzing your file...
//             </p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
//             <div>
//               <p className="text-lg font-medium">Drop your CSV file here</p>
//               <p className="text-sm text-muted-foreground">
//                 or click to browse files
//               </p>
//             </div>
//             <input
//               type="file"
//               accept=".csv"
//               onChange={handleFileInput}
//               className="hidden"
//               id="file-upload"
//             />
//             <Button asChild variant="outline">
//               <label htmlFor="file-upload" className="cursor-pointer">
//                 Choose File
//               </label>
//             </Button>
//           </div>
//         )}
//       </div>

//       {error && (
//         <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
//           <AlertCircle className="h-4 w-4 text-red-500" />
//           <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
//         </div>
//       )}
//     </div>
//   );
// }

// // Enhanced QueryInterface Component
// function QueryInterface({
//   currentFile,
//   onQuerySubmit,
//   currentQuery,
// }: {
//   currentFile: FileData;
//   onQuerySubmit: (query: string, result: QueryResult) => void;
//   currentQuery: QueryResult | null;
// }) {
//   const [query, setQuery] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!query.trim()) return;

//     setIsLoading(true);
//     setError(null);

//     try {
//       const response = await fetch("/api/ask", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           filename: currentFile.name,
//           question: query,
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "Query failed");
//       }

//       const result = await response.json();

//       // Transform chart data to match frontend expectations
//       const queryResult: QueryResult = {
//         query,
//         analysis: result.analysis,
//         chart: result.chart,
//         metadata: result.metadata,
//         sample_data: result.sample_data,
//         columns: result.columns,
//         chartData: result.chart.data.map((item: any) => ({
//           name:
//             item.category || item.name || item.index?.toString() || "Unknown",
//           value: typeof item.value === "number" ? item.value : 0,
//           ...item,
//         })),
//         chartType: result.chart.type,
//       };

//       onQuerySubmit(query, queryResult);
//       setQuery("");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Query failed");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const suggestedQuestions = [
//     "Show me a summary of the data",
//     "Create a bar chart of the top 10 values",
//     "What are the trends in this data?",
//     "Show me a pie chart of the categories",
//     "What insights can you find?",
//   ];

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <MessageSquare className="h-5 w-5" />
//             Ask AI About Your Data
//           </CardTitle>
//           <CardDescription>
//             Ask questions in natural language about your CSV data. The AI will
//             analyze and create visualizations for you.
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <textarea
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Ask me anything about your data... (e.g., 'Show me a bar chart of sales by region')"
//                 className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
//                 disabled={isLoading}
//               />
//             </div>

//             <div className="flex items-center justify-between">
//               <div className="text-sm text-muted-foreground">
//                 Analyzing: {currentFile.name} (
//                 {currentFile.rows.toLocaleString()} rows)
//               </div>
//               <Button type="submit" disabled={!query.trim() || isLoading}>
//                 {isLoading ? (
//                   <>
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                     Analyzing...
//                   </>
//                 ) : (
//                   <>
//                     <Sparkles className="h-4 w-4 mr-2" />
//                     Ask AI
//                   </>
//                 )}
//               </Button>
//             </div>
//           </form>

//           {error && (
//             <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
//               <AlertCircle className="h-4 w-4 text-red-500" />
//               <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
//             </div>
//           )}

//           {/* Suggested Questions */}
//           <div className="space-y-2">
//             <p className="text-sm font-medium">Try asking:</p>
//             <div className="flex flex-wrap gap-2">
//               {suggestedQuestions.map((suggestion, index) => (
//                 <Badge
//                   key={index}
//                   variant="secondary"
//                   className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
//                   onClick={() => setQuery(suggestion)}
//                 >
//                   {suggestion}
//                 </Badge>
//               ))}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Previous Query Results */}
//       {currentQuery && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <CheckCircle className="h-5 w-5 text-green-500" />
//               Latest Analysis
//             </CardTitle>
//             <CardDescription>"{currentQuery.query}"</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="p-4 bg-muted/50 rounded-lg">
//               <p className="text-sm">{currentQuery.analysis.explanation}</p>
//             </div>

//             {currentQuery.analysis.insights.length > 0 && (
//               <div className="space-y-2">
//                 <p className="text-sm font-medium">Key Insights:</p>
//                 <ul className="space-y-1">
//                   {currentQuery.analysis.insights.map((insight, index) => (
//                     <li
//                       key={index}
//                       className="text-sm text-muted-foreground flex items-start gap-2"
//                     >
//                       <TrendingUp className="h-3 w-3 mt-0.5 text-blue-500" />
//                       {insight}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

// // Enhanced DataTable Component
// function DataTable({ data }: { data?: Array<{ [key: string]: any }> }) {
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   if (!data || data.length === 0) {
//     return (
//       <div className="text-center py-8">
//         <Table className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
//         <p className="text-muted-foreground">No data available</p>
//       </div>
//     );
//   }

//   const columns = Object.keys(data[0]);
//   const totalPages = Math.ceil(data.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const currentData = data.slice(startIndex, startIndex + itemsPerPage);

//   return (
//     <div className="space-y-4">
//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse border border-gray-200">
//           <thead>
//             <tr className="bg-muted">
//               {columns.map((column) => (
//                 <th
//                   key={column}
//                   className="border border-gray-200 px-4 py-2 text-left font-medium"
//                 >
//                   {column}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {currentData.map((row, index) => (
//               <tr key={index} className="hover:bg-muted/50">
//                 {columns.map((column) => (
//                   <td
//                     key={column}
//                     className="border border-gray-200 px-4 py-2 text-sm"
//                   >
//                     {String(row[column] ?? "")}
//                   </td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {totalPages > 1 && (
//         <div className="flex items-center justify-between">
//           <p className="text-sm text-muted-foreground">
//             Showing {startIndex + 1} to{" "}
//             {Math.min(startIndex + itemsPerPage, data.length)} of {data.length}{" "}
//             entries
//           </p>
//           <div className="flex gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
//               disabled={currentPage === 1}
//             >
//               Previous
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() =>
//                 setCurrentPage(Math.min(totalPages, currentPage + 1))
//               }
//               disabled={currentPage === totalPages}
//             >
//               Next
//             </Button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Import the enhanced ChartDisplay
// import { EnhancedChartDisplay } from "./chart-display";

// export function DashboardContent({
//   currentFile,
//   currentQuery,
//   onFileUpload,
//   onQuerySubmit,
// }: DashboardContentProps) {
//   const [activeTab, setActiveTab] = useState("upload");

//   // Auto-switch to query tab when file is uploaded
//   useEffect(() => {
//     if (currentFile && activeTab === "upload") {
//       setActiveTab("query");
//     }
//   }, [currentFile, activeTab]);

//   // Auto-switch to charts tab when chart is generated
//   useEffect(() => {
//     if (currentQuery?.chartData && activeTab !== "charts") {
//       // Small delay to let user see the response first
//       setTimeout(() => setActiveTab("charts"), 2000);
//     }
//   }, [currentQuery?.chartData, activeTab]);

//   return (
//     <SidebarInset className="border border-amber-400 m-0 w-full">
//       <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
//         <SidebarTrigger className="-ml-1" />
//         <Separator orientation="vertical" className="mr-2 h-4" />
//         <div className="flex items-center gap-2">
//           <Sparkles className="h-5 w-5 text-primary" />
//           <h2 className="text-lg font-semibold">
//             {currentFile
//               ? `Analyzing: ${currentFile.name}`
//               : "AI Data Analysis Dashboard"}
//           </h2>
//           {currentFile && (
//             <Badge variant="secondary" className="ml-2">
//               {currentFile.rows.toLocaleString()} rows ×{" "}
//               {currentFile.columns.length} cols
//             </Badge>
//           )}
//         </div>
//       </header>

//       <div className="p-6">
//         {!currentFile ? (
//           <div className="flex flex-col items-center justify-center space-y-8">
//             <div className="text-center space-y-4 max-w-2xl">
//               <div className="relative">
//                 <Upload className="h-16 w-16 mx-auto text-primary mb-4" />
//                 <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center">
//                   <Sparkles className="h-3 w-3 text-primary-foreground" />
//                 </div>
//               </div>
//               <h3 className="text-3xl font-bold">
//                 Welcome to AI Data Dashboard
//               </h3>
//               <p className="text-lg text-muted-foreground">
//                 Upload your CSV file and start asking questions in natural
//                 language. Get instant insights, visualizations, and AI-powered
//                 analysis of your data.
//               </p>
//               <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mt-6">
//                 <div className="flex items-center gap-2">
//                   <Upload className="h-4 w-4" />
//                   <span>Upload CSV</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <MessageSquare className="h-4 w-4" />
//                   <span>Ask Questions</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <BarChart3 className="h-4 w-4" />
//                   <span>Get Charts</span>
//                 </div>
//               </div>
//             </div>
//             <FileUpload onFileUpload={onFileUpload} />
//           </div>
//         ) : (
//           <Tabs
//             value={activeTab}
//             onValueChange={setActiveTab}
//             className="space-y-6"
//           >
//             <TabsList className="grid w-full grid-cols-4">
//               <TabsTrigger value="upload" className="flex items-center gap-2">
//                 <Upload className="h-4 w-4" />
//                 Upload
//               </TabsTrigger>
//               <TabsTrigger
//                 value="query"
//                 className="flex items-center gap-2 relative"
//               >
//                 <MessageSquare className="h-4 w-4" />
//                 Ask AI
//                 {currentFile && !currentQuery && (
//                   <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
//                 )}
//               </TabsTrigger>
//               <TabsTrigger value="data" className="flex items-center gap-2">
//                 <Table className="h-4 w-4" />
//                 Data
//               </TabsTrigger>
//               <TabsTrigger
//                 value="charts"
//                 className="flex items-center gap-2 relative"
//               >
//                 <BarChart3 className="h-4 w-4" />
//                 Charts
//                 {currentQuery?.chartData && (
//                   <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
//                 )}
//               </TabsTrigger>
//             </TabsList>

//             <TabsContent value="upload" className="space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Upload Additional Files</CardTitle>
//                   <CardDescription>
//                     Upload more CSV files to analyze alongside your current
//                     data.
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <FileUpload onFileUpload={onFileUpload} />

//                   {/* File Info Card */}
//                   <div className="mt-6 p-4 bg-muted/50 rounded-lg">
//                     <h4 className="font-medium mb-2">
//                       Current File: {currentFile.name}
//                     </h4>
//                     <div className="grid grid-cols-2 gap-4 text-sm">
//                       <div>
//                         <span className="text-muted-foreground">Size:</span>{" "}
//                         {currentFile.size}
//                       </div>
//                       <div>
//                         <span className="text-muted-foreground">Rows:</span>{" "}
//                         {currentFile.rows.toLocaleString()}
//                       </div>
//                       <div className="col-span-2">
//                         <span className="text-muted-foreground">Columns:</span>
//                         <div className="flex flex-wrap gap-1 mt-1">
//                           {currentFile.columns.map((col, index) => (
//                             <Badge
//                               key={index}
//                               variant="outline"
//                               className="text-xs"
//                             >
//                               {col}
//                             </Badge>
//                           ))}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="query" className="space-y-6">
//               <QueryInterface
//                 currentFile={currentFile}
//                 onQuerySubmit={onQuerySubmit}
//                 currentQuery={currentQuery}
//               />
//             </TabsContent>

//             <TabsContent value="data" className="space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Data Explorer</CardTitle>
//                   <CardDescription>
//                     Browse and analyze your uploaded data with interactive
//                     controls.
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <DataTable data={currentFile.data} />
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="charts" className="space-y-6">
//               {currentQuery?.chartData ? (
//                 <EnhancedChartDisplay
//                   data={currentQuery.chartData}
//                   type={
//                     ["line", "bar", "pie", "area"].includes(
//                       currentQuery.chartType as string
//                     )
//                       ? (currentQuery.chartType as
//                           | "line"
//                           | "bar"
//                           | "pie"
//                           | "area")
//                       : "bar"
//                   }
//                   title={currentQuery.query}
//                   insights={currentQuery.analysis.insights}
//                   explanation={currentQuery.analysis.explanation}
//                 />
//               ) : (
//                 <Card className="border-dashed border-2">
//                   <CardHeader className="text-center">
//                     <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//                     <CardTitle>No Charts Generated Yet</CardTitle>
//                     <CardDescription className="max-w-md mx-auto">
//                       Go to the "Ask AI" tab and request a chart or
//                       visualization. Try asking: "Create a bar chart" or "Show
//                       me a pie chart of the data"
//                     </CardDescription>
//                   </CardHeader>
//                 </Card>
//               )}
//             </TabsContent>
//           </Tabs>
//         )}
//       </div>
//     </SidebarInset>
//   );
// }

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
import { EnhancedChartDisplay } from "./chart-display";
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

  useEffect(() => {
    if (currentFile && activeTab === "upload") {
      setActiveTab("query");
    }
  }, [currentFile, activeTab]);

  useEffect(() => {
    if (currentQuery?.chartData && activeTab !== "charts") {
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
          {currentFile && (
            <Badge variant="secondary" className="ml-2">
              {currentFile.rows.toLocaleString()} rows ×{" "}
              {currentFile.columns.length} cols
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
                        {currentFile.rows.toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Columns:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentFile.columns.map((col, index) => (
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
                onQuerySubmit={(result) => onQuerySubmit(result.query, result)}
                currentQuery={currentQuery}
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
              {currentQuery?.chartData ? (
                <EnhancedChartDisplay
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
                  insights={currentQuery.analysis.insights}
                  explanation={currentQuery.analysis.explanation}
                />
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
