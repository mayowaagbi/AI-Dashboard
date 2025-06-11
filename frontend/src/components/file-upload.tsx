import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";
import Papa from "papaparse";

interface FileUploadProps {
  onFileUpload: (file: UploadedFile) => void;
}
export interface UploadedFile {
  id: string;
  name: string;
  data: any[];
  uploadDate: Date;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && file.type === "text/csv") {
        setUploadedFile(file);
        setIsUploading(true);

        Papa.parse(file, {
          complete: (results) => {
            const data = results.data as string[][];
            const headers = data[0];
            const rows = data
              .slice(1)
              .filter((row) => row.some((cell) => cell.trim() !== ""));

            const processedData = rows.map((row, index) => {
              const obj: any = { id: index };
              headers.forEach((header, i) => {
                const value = row[i] || "";
                // Try to convert to number if possible
                const numValue = Number.parseFloat(value);
                obj[header] = isNaN(numValue) ? value : numValue;
              });
              return obj;
            });

            const uploadedFileData: UploadedFile = {
              id: Date.now().toString(),
              name: file.name,
              data: processedData,
              uploadDate: new Date(),
            };

            onFileUpload(uploadedFileData);
            setIsUploading(false);
            setUploadedFile(null);
          },
          header: false,
          skipEmptyLines: true,
        });
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
            <p className="text-muted-foreground mb-4">
              {isDragActive
                ? "Drop the CSV file here..."
                : "Drag and drop a CSV file here, or click to select"}
            </p>
            <Button variant="outline">Select File</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isUploading && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Processing file...
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
