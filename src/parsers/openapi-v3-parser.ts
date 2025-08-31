// OpenAPI 3.0 Parser (to be implemented in the future)
import { BaseApiParser } from './base-parser';
import type { OpenAPIv3Spec, OpenAPIv3Operation, OpenAPIv3Schema } from '../types/openapi-v3';
import type { 
  NormalizedApiSpec, 
  NormalizedOperation, 
  NormalizedParameter,
  NormalizedResponse,
  NormalizedSchema,
  ApiSpecVersion 
} from '../types/common';

export class OpenAPIV3Parser extends BaseApiParser {
  protected spec: OpenAPIv3Spec;

  constructor(spec: OpenAPIv3Spec) {
    super(spec);
    this.spec = spec;
  }

  getVersion(): ApiSpecVersion {
    if (this.spec.openapi.startsWith('3.1')) return 'openapi-3.1';
    return 'openapi-3.0';
  }

  isValidSpec(): boolean {
    return this.spec.openapi.startsWith('3.') && 
           !!this.spec.info && 
           !!this.spec.paths;
  }

  normalize(): NormalizedApiSpec {
    const operations: NormalizedOperation[] = [];

    // Parse paths and operations
    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (this.isHttpMethod(method) && operation) {
          operations.push(this.normalizeOperation(method, path, operation as OpenAPIv3Operation));
        }
      }
    }

    return {
      version: this.getVersion(),
      info: {
        title: this.spec.info.title,
        version: this.spec.info.version,
        description: this.spec.info.description
      },
      servers: this.spec.servers?.map(server => ({
        url: server.url,
        description: server.description
      })),
      operations,
      schemas: this.normalizeSchemas(),
      tags: this.spec.tags
    };
  }

  private isHttpMethod(method: string): boolean {
    return ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'].includes(method.toLowerCase());
  }

  private normalizeOperation(method: string, path: string, operation: OpenAPIv3Operation): NormalizedOperation {
    return {
      method: method.toUpperCase(),
      path,
      operationId: operation.operationId,
      summary: operation.summary,
      description: operation.description,
      tags: operation.tags,
      parameters: this.normalizeParameters(operation.parameters || []),
      requestBody: this.normalizeRequestBody(operation.requestBody),
      responses: this.normalizeResponses(operation.responses),
      deprecated: operation.deprecated
    };
  }

  private normalizeParameters(parameters: any[]): NormalizedParameter[] {
    return parameters.map(param => ({
      name: param.name,
      location: param.in === 'cookie' ? 'cookie' : param.in as NormalizedParameter['location'],
      description: param.description,
      required: param.required,
      schema: param.schema ? this.normalizeSchema(param.schema) : undefined
    }));
  }

  private normalizeRequestBody(requestBody?: any): any {
    if (!requestBody) return undefined;

    const mainMediaType = this.getMainMediaType(requestBody.content);
    const mediaTypeObj = requestBody.content[mainMediaType];

    return {
      description: requestBody.description,
      required: requestBody.required,
      schema: mediaTypeObj?.schema ? this.normalizeSchema(mediaTypeObj.schema) : undefined,
      mediaType: mainMediaType
    };
  }

  private normalizeResponses(responses: { [statusCode: string]: any }): NormalizedResponse[] {
    return Object.entries(responses).map(([statusCode, response]) => {
      let schema;
      let mediaType;

      if (response.content) {
        mediaType = this.getMainMediaType(response.content);
        const mediaTypeObj = response.content[mediaType];
        schema = mediaTypeObj?.schema ? this.normalizeSchema(mediaTypeObj.schema) : undefined;
      }

      return {
        statusCode,
        description: response.description,
        schema,
        mediaType
      };
    });
  }

  private normalizeSchema(schema: OpenAPIv3Schema): NormalizedSchema {
    const normalized: NormalizedSchema = {
      type: schema.type,
      format: schema.format,
      description: schema.description,
      minimum: schema.minimum,
      maximum: schema.maximum,
      minLength: schema.minLength,
      maxLength: schema.maxLength,
      enum: schema.enum
    };

    if (schema.$ref) {
      normalized.ref = this.extractRefName(schema.$ref);
    }

    if (schema.items) {
      normalized.items = this.normalizeSchema(schema.items);
    }

    if (schema.properties) {
      normalized.properties = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        normalized.properties[key] = this.normalizeSchema(value);
        // Handle required fields
        if (schema.required?.includes(key)) {
          normalized.properties[key].required = true;
        }
      }
    }

    if (schema.allOf) {
      normalized.allOf = schema.allOf.map(s => this.normalizeSchema(s));
    }

    if (schema.anyOf) {
      normalized.anyOf = schema.anyOf.map(s => this.normalizeSchema(s));
    }

    if (schema.oneOf) {
      normalized.oneOf = schema.oneOf.map(s => this.normalizeSchema(s));
    }

    return normalized;
  }

  private normalizeSchemas(): { [name: string]: NormalizedSchema } {
    const schemas: { [name: string]: NormalizedSchema } = {};
    
    if (this.spec.components?.schemas) {
      for (const [name, schema] of Object.entries(this.spec.components.schemas)) {
        schemas[name] = this.normalizeSchema(schema);
      }
    }

    return schemas;
  }
}
