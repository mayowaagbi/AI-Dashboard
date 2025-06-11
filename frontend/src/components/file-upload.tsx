// import { useState, useCallback } from "react";
// import { useDropzone } from "react-dropzone";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Upload, FileText, X } from "lucide-react";
// import Papa from "papaparse";

// interface FileUploadProps {
//   onFileUpload: (file: UploadedFile) => void;
// }
// export interface UploadedFile {
//   id: string;
//   name: string;
//   data: any[];
//   uploadDate: Date;
// }

// export function FileUpload({ onFileUpload }: FileUploadProps) {
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadedFile, setUploadedFile] = useState<File | null>(null);

//   const onDrop = useCallback(
//     (acceptedFiles: File[]) => {
//       const file = acceptedFiles[0];
//       if (file && file.type === "text/csv") {
//         setUploadedFile(file);
//         setIsUploading(true);

//         Papa.parse(file, {
//           complete: (results) => {
//             const data = results.data as string[][];
//             const headers = data[0];
//             const rows = data
//               .slice(1)
//               .filter((row) => row.some((cell) => cell.trim() !== ""));

//             const processedData = rows.map((row, index) => {
//               const obj: any = { id: index };
//               headers.forEach((header, i) => {
//                 const value = row[i] || "";
//                 // Try to convert to number if possible
//                 const numValue = Number.parseFloat(value);
//                 obj[header] = isNaN(numValue) ? value : numValue;
//               });
//               return obj;
//             });

//             const uploadedFileData: UploadedFile = {
//               id: Date.now().toString(),
//               name: file.name,
//               data: processedData,
//               uploadDate: new Date(),
//             };

//             onFileUpload(uploadedFileData);
//             setIsUploading(false);
//             setUploadedFile(null);
//           },
//           header: false,
//           skipEmptyLines: true,
//         });
//       }
//     },
//     [onFileUpload]
//   );

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       "text/csv": [".csv"],
//     },
//     multiple: false,
//   });

//   const removeFile = () => {
//     setUploadedFile(null);
//   };

//   return (
//     <Card className="w-full max-w-2xl mx-auto">
//       <CardContent className="p-6">
//         {!uploadedFile ? (
//           <div
//             {...getRootProps()}
//             className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
//               isDragActive
//                 ? "border-primary bg-primary/5"
//                 : "border-muted-foreground/25 hover:border-primary/50"
//             }`}
//           >
//             <input {...getInputProps()} />
//             <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
//             <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
//             <p className="text-muted-foreground mb-4">
//               {isDragActive
//                 ? "Drop the CSV file here..."
//                 : "Drag and drop a CSV file here, or click to select"}
//             </p>
//             <Button variant="outline">Select File</Button>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between p-4 border rounded-lg">
//               <div className="flex items-center gap-3">
//                 <FileText className="h-8 w-8 text-primary" />
//                 <div>
//                   <p className="font-medium">{uploadedFile.name}</p>
//                   <p className="text-sm text-muted-foreground">
//                     {(uploadedFile.size / 1024).toFixed(1)} KB
//                   </p>
//                 </div>
//               </div>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={removeFile}
//                 disabled={isUploading}
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>

//             {isUploading && (
//               <div className="text-center">
//                 <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
//                 <p className="mt-2 text-sm text-muted-foreground">
//                   Processing file...
//                 </p>
//               </div>
//             )}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
// src/components/dashboard/FileUpload.tsx
import { useState } from "react";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
interface FileData {
  name: string;
  size: string;
  rows: number;
  columns: string[];
  data: Record<string, any>[] | undefined;
}
interface FileUploadProps {
  onFileUpload: (file: FileData) => void;
  isLoading?: boolean;
}

export function FileUpload({ onFileUpload, isLoading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "http://127.0.0.1:8000/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          // Optional: Add timeout
          timeout: 30000, // 30 seconds
        }
      );

      const result = response.data;

      const fileData: FileData = {
        name: result.filename,
        size: result.size,
        columns: result.columns,
        rows: result.rows,
        data: result.data ?? undefined,
      };

      onFileUpload(fileData);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Handle Axios-specific errors
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          setError(err.response.data.detail || "Upload failed");
        } else if (err.request) {
          // The request was made but no response was received
          setError("No response from server. Please try again.");
        } else {
          // Something happened in setting up the request
          setError(err.message || "Upload failed");
        }
      } else {
        // Handle non-Axios errors
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileUpload(files[0]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileUpload(files[0]);
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Uploading and analyzing your file...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">Drop your CSV file here</p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose File
              </label>
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
