import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardContent } from "@/components/dashboard-content";
import type { UploadedFile, QueryResult } from "@/types";

export default function Dashboard() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [currentQuery, setCurrentQuery] = useState<QueryResult | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedFiles = localStorage.getItem("dashboard-files");
    const savedHistory = localStorage.getItem("dashboard-history");

    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles) as Array<
          Omit<UploadedFile, "uploadDate"> & { uploadDate: string }
        >;

        const files: UploadedFile[] = parsedFiles.map((f) => ({
          name: f.name,
          data: f.data || [],
          uploadDate: new Date(f.uploadDate),
        }));

        setUploadedFiles(files);
      } catch (error) {
        console.error("Failed to parse saved files:", error);
      }
    }

    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory) as Array<
          Omit<QueryResult, "timestamp"> & { timestamp: string }
        >;

        const history: QueryResult[] = parsedHistory.map((q) => ({
          query: q.query,
          result: q.result,
          timestamp: new Date(q.timestamp),
        }));

        setQueryHistory(history);
      } catch (error) {
        console.error("Failed to parse query history:", error);
      }
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem("dashboard-files", JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  useEffect(() => {
    localStorage.setItem("dashboard-history", JSON.stringify(queryHistory));
  }, [queryHistory]);

  const handleFileUpload = (file: Partial<UploadedFile>) => {
    const completeFile: UploadedFile = {
      name: file.name || "Untitled",
      data: file.data || [],
    };

    setUploadedFiles((prev) => [...prev, completeFile]);
    setCurrentFile(completeFile);
  };

  const handleQuerySubmit = (result: QueryResult) => {
    const completeResult: QueryResult = {
      query: result.query,
      result: result.result,
    };

    setQueryHistory((prev) => [completeResult, ...prev]);
    setCurrentQuery(completeResult);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen flex-1 bg-background">
        <AppSidebar
          uploadedFiles={uploadedFiles}
          currentFile={currentFile}
          queryHistory={queryHistory}
          onFileSelect={setCurrentFile}
          onQuerySelect={setCurrentQuery}
        />
        <DashboardContent
          currentFile={currentFile}
          currentQuery={currentQuery}
          onFileUpload={handleFileUpload}
          onQuerySubmit={handleQuerySubmit}
        />
      </div>
    </SidebarProvider>
  );
}
