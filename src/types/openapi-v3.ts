// OpenAPI 3.0 Type Definitions
export interface OpenAPIv3Schema {
  type?: string;
  format?: string;
  $ref?: string;
  items?: OpenAPIv3Schema;
  properties?: { [key: string]: OpenAPIv3Schema };
  required?: string[];
  allOf?: OpenAPIv3Schema[];
  anyOf?: OpenAPIv3Schema[];
  oneOf?: OpenAPIv3Schema[];
  enum?: (string | number | boolean)[];
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  example?: any;
  examples?: { [key: string]: any };
}

export interface OpenAPIv3MediaType {
  schema?: OpenAPIv3Schema;
  example?: any;
  examples?: { [key: string]: { value: any; summary?: string; description?: string } };
}

export interface OpenAPIv3RequestBody {
  description?: string;
  content: { [mediaType: string]: OpenAPIv3MediaType };
  required?: boolean;
}

export interface OpenAPIv3Response {
  description: string;
  content?: { [mediaType: string]: OpenAPIv3MediaType };
  headers?: { [name: string]: any };
}

export interface OpenAPIv3Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: OpenAPIv3Schema;
  example?: any;
}

export interface OpenAPIv3Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenAPIv3Parameter[];
  requestBody?: OpenAPIv3RequestBody;
  responses: { [statusCode: string]: OpenAPIv3Response };
  deprecated?: boolean;
  security?: any[];
}

export interface OpenAPIv3PathItem {
  summary?: string;
  description?: string;
  get?: OpenAPIv3Operation;
  put?: OpenAPIv3Operation;
  post?: OpenAPIv3Operation;
  delete?: OpenAPIv3Operation;
  options?: OpenAPIv3Operation;
  head?: OpenAPIv3Operation;
  patch?: OpenAPIv3Operation;
  trace?: OpenAPIv3Operation;
  parameters?: OpenAPIv3Parameter[];
}

export interface OpenAPIv3Server {
  url: string;
  description?: string;
  variables?: { [key: string]: { default: string; description?: string; enum?: string[] } };
}

export interface OpenAPIv3Info {
  title: string;
  version: string;
  description?: string;
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

export interface OpenAPIv3Components {
  schemas?: { [name: string]: OpenAPIv3Schema };
  responses?: { [name: string]: OpenAPIv3Response };
  parameters?: { [name: string]: OpenAPIv3Parameter };
  requestBodies?: { [name: string]: OpenAPIv3RequestBody };
  securitySchemes?: { [name: string]: any };
}

export interface OpenAPIv3Spec {
  openapi: string; // "3.0.0", "3.0.1", etc.
  info: OpenAPIv3Info;
  servers?: OpenAPIv3Server[];
  paths: { [path: string]: OpenAPIv3PathItem };
  components?: OpenAPIv3Components;
  security?: any[];
  tags?: Array<{ name: string; description?: string }>;
  externalDocs?: { description?: string; url: string };
}