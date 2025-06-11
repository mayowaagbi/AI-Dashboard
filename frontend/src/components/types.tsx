// src/types.ts
export interface DataRow {
  [key: string]: any;
  id?: string | number;
}

export interface QueryAnalysis {
  explanation: string;
  insights: string[];
  code: string;
}

export interface QueryChart {
  type: "line" | "bar" | "pie" | "area";
  data: Array<{
    name?: string;
    category?: string;
    value: number;
    [key: string]: any;
  }>;
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

export interface FileMetadata {
  filename: string;
  size_kb: number;
  shape: string;
}

// export interface QueryResult {
//   query: string;
//   analysis: QueryAnalysis;
//   chart: QueryChart;
//   metadata: FileMetadata;
//   sample_data: DataRow[];
//   columns: string[];
//   chartData?: Array<{ name: string; value: number; [key: string]: any }>;
//   chartType?: string;
// }
