// Common Type Definitions - Version-agnostic abstract interfaces
import type { Content } from 'pdfmake/interfaces';

export type ApiSpecVersion = 'swagger-2.0' | 'openapi-3.0' | 'openapi-3.1';

export interface NormalizedSchema {
  type?: string;
  format?: string;
  description?: string;
  required?: boolean;
  items?: NormalizedSchema;
  properties?: { [key: string]: NormalizedSchema };
  allOf?: NormalizedSchema[];
  anyOf?: NormalizedSchema[];
  oneOf?: NormalizedSchema[];
  enum?: (string | number | boolean)[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  ref?: string; // Unified reference format, does not include #/ prefix
}

export interface NormalizedParameter {
  name: string;
  location: 'query' | 'header' | 'path' | 'body' | 'formData' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: NormalizedSchema;
}

export interface NormalizedRequestBody {
  description?: string;
  required?: boolean;
  schema?: NormalizedSchema;
  mediaType: string; // Primary media type
}

export interface NormalizedResponse {
  statusCode: string;
  description: string;
  schema?: NormalizedSchema;
  mediaType?: string;
}

export interface NormalizedOperation {
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: NormalizedParameter[];
  requestBody?: NormalizedRequestBody;
  responses: NormalizedResponse[];
  deprecated?: boolean;
}

export interface NormalizedApiSpec {
  version: ApiSpecVersion;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  operations: NormalizedOperation[];
  schemas: { [name: string]: NormalizedSchema };
  tags?: Array<{ name: string; description?: string }>;
}

// PDF generation related types remain unchanged
export interface ExpandedField {
  field: string;
  type: string;
  description: string;
}

export interface TypeInfo {
  type: string;
  description: string;
}

// Legacy parameter format for backward compatibility
export interface LegacyParameter {
  name: string;
  in: string;
  required?: boolean;
  type?: string;
  schema?: any;
  description?: string;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  tag: string;
  summary: string;
  description: string;
  parameters: LegacyParameter[];
  responses: { [status: string]: any }; // Compatible with existing code
}

export interface ApiGroup {
  name: string;
  endpoints: ApiEndpoint[];
}

export interface ParseArgsResult {
  inputFile: string;
  outputFile: string;
  filterFile?: string;      // Filter file path (for --from-json)
  filterType: 'none' | 'file' | 'literal';  // Filter type
  filterLiteral?: string[]; // Path list (for --from-literal)
}

export type PdfContent = Content;