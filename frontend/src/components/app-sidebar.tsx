import { FileText, History, BarChart3, Database } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UploadedFile } from "@/types";
// import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

interface AppSidebarProps {
  uploadedFiles: UploadedFile[];
  queryHistory: QueryResult[];
  currentFile: UploadedFile | null;
  onFileSelect: (file: UploadedFile) => void;
  onQuerySelect: (query: QueryResult) => void;
}
export type QueryResult = {
  query: string;
  analysis: {
    explanation: string;
    insights: string[];
    code: string;
  };
  chart: {
    type: string;
    data: any[];
  };
  metadata: {
    filename: string;
    size_kb: number;
    shape: string;
  };
  sample_data: any[];
  columns: string[];
  chartData: any[];
  chartType: string;
};
export function AppSidebar({
  uploadedFiles,
  queryHistory,
  currentFile,
  onFileSelect,
  onQuerySelect,
}: AppSidebarProps) {
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-lg font-semibold">Data Dashboard</h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Uploaded Files ({uploadedFiles.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {uploadedFiles.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground">
                  No files uploaded yet
                </div>
              ) : (
                uploadedFiles.map((file, index) => (
                  <SidebarMenuItem key={file.name || `file-${index}`}>
                    <SidebarMenuButton
                      onClick={() => onFileSelect(file)}
                      isActive={currentFile?.name === file.name}
                      className="w-full justify-start"
                    >
                      <FileText className="h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {file.data.length} rows •{" "}
                          {/* {formatDistanceToNow(file.uploadDate, {
                            addSuffix: true,
                          })} */}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Query History ({queryHistory.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {queryHistory.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground">
                  No queries yet
                </div>
              ) : (
                queryHistory.slice(0, 10).map((query, index) => (
                  <SidebarMenuItem key={`query-${index}`}>
                    <SidebarMenuButton
                      onClick={() => onQuerySelect(query)}
                      className="w-full justify-start"
                    >
                      <div className="flex flex-col items-start">
                        <span className="truncate text-sm">{query.query}</span>
                        <span className="text-xs text-muted-foreground">
                          {/* {formatDistanceToNow(query.timestamp, {
                            addSuffix: true,
                          })} */}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
