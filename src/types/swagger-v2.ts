// Swagger 2.0 Type Definitions (moved from existing types.ts)
export interface SwaggerSchema {
  type?: string;
  format?: string;
  $ref?: string;
  items?: SwaggerSchema;
  properties?: { [key: string]: SwaggerSchema };
  required?: string[];
  allOf?: SwaggerSchema[];
  enum?: (string | number | boolean)[];
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

export interface SwaggerResponse {
  description: string;
  schema?: SwaggerSchema;
}

export interface SwaggerDefinition {
  type?: string;
  properties?: { [key: string]: SwaggerSchema };
  required?: string[];
  allOf?: SwaggerSchema[];
  description?: string;
}

export interface SwaggerParameter {
  name: string;
  in: string;
  required?: boolean;
  type?: string;
  schema?: SwaggerSchema;
  description?: string;
}

export interface SwaggerOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: SwaggerParameter[];
  responses?: { [status: string]: SwaggerResponse };
  deprecated?: boolean;
  security?: any[];
}

export interface SwaggerSpec {
  swagger: string; // "2.0"
  info: {
    title: string;
    version: string;
    description?: string;
  };
  host?: string;
  basePath?: string;
  schemes?: string[];
  consumes?: string[];
  produces?: string[];
  paths: {
    [path: string]: {
      [method: string]: SwaggerOperation;
    };
  };
  definitions?: {
    [name: string]: SwaggerDefinition;
  };
  tags?: Array<{ name: string; description?: string }>;
}