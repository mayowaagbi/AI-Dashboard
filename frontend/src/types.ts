export type DataRow = Record<string, any>;

export interface QueryResult {
  query: string;
  result: any;
  chartData?: any;
  chartType?: string;
}
export interface UploadedFile {
  name: string;
  data: any[];
}
