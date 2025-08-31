// Swagger 2.0 Parser
import { BaseApiParser } from './base-parser';
import type { SwaggerSpec, SwaggerSchema, SwaggerOperation } from '../types/swagger-v2';
import type { 
  NormalizedApiSpec, 
  NormalizedOperation, 
  NormalizedParameter,
  NormalizedRequestBody,
  NormalizedResponse,
  NormalizedSchema,
  ApiSpecVersion 
} from '../types/common';

export class SwaggerV2Parser extends BaseApiParser {
  protected spec: SwaggerSpec;

  constructor(spec: SwaggerSpec) {
    super(spec);
    this.spec = spec;
  }

  getVersion(): ApiSpecVersion {
    return 'swagger-2.0';
  }

  isValidSpec(): boolean {
    return this.spec.swagger === '2.0' && 
           !!this.spec.info && 
           !!this.spec.paths;
  }

  normalize(): NormalizedApiSpec {
    const operations: NormalizedOperation[] = [];

    // Parse paths and operations
    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (this.isHttpMethod(method)) {
          operations.push(this.normalizeOperation(method, path, operation as SwaggerOperation));
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
      servers: this.normalizeServers(),
      operations,
      schemas: this.normalizeSchemas(),
      tags: this.spec.tags
    };
  }

  private isHttpMethod(method: string): boolean {
    return ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase());
  }

  private normalizeOperation(method: string, path: string, operation: SwaggerOperation): NormalizedOperation {
    return {
      method: method.toUpperCase(),
      path,
      operationId: operation.operationId,
      summary: operation.summary,
      description: operation.description,
      tags: operation.tags,
      parameters: this.normalizeParameters(operation.parameters || []),
      requestBody: this.normalizeRequestBody(operation.parameters || []),
      responses: this.normalizeResponses(operation.responses || {}),
      deprecated: operation.deprecated
    };
  }

  private normalizeParameters(parameters: any[]): NormalizedParameter[] {
    return parameters
      .filter(param => param.in !== 'body') // body parameters are handled separately
      .map(param => ({
        name: param.name,
        location: this.mapParameterLocation(param.in),
        description: param.description,
        required: param.required,
        schema: param.schema ? this.normalizeSchema(param.schema) : {
          type: param.type || 'string',
          format: param.format
        }
      }));
  }

  private normalizeRequestBody(parameters: any[]): NormalizedRequestBody | undefined {
    const bodyParam = parameters.find(param => param.in === 'body');
    if (!bodyParam) return undefined;

    return {
      description: bodyParam.description,
      required: bodyParam.required,
      schema: bodyParam.schema ? this.normalizeSchema(bodyParam.schema) : undefined,
      mediaType: 'application/json' // Swagger 2.0 default
    };
  }

  private normalizeResponses(responses: { [status: string]: any }): NormalizedResponse[] {
    return Object.entries(responses).map(([statusCode, response]) => ({
      statusCode,
      description: response.description,
      schema: response.schema ? this.normalizeSchema(response.schema) : undefined,
      mediaType: 'application/json'
    }));
  }

  private normalizeSchema(schema: SwaggerSchema): NormalizedSchema {
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

    return normalized;
  }

  private normalizeServers() {
    if (!this.spec.host) return undefined;

    const protocol = this.spec.schemes?.[0] || 'https';
    const basePath = this.spec.basePath || '';
    
    return [{
      url: `${protocol}://${this.spec.host}${basePath}`,
      description: 'API Server'
    }];
  }

  private normalizeSchemas(): { [name: string]: NormalizedSchema } {
    const schemas: { [name: string]: NormalizedSchema } = {};
    
    if (this.spec.definitions) {
      for (const [name, definition] of Object.entries(this.spec.definitions)) {
        schemas[name] = this.normalizeSchema(definition as SwaggerSchema);
      }
    }

    return schemas;
  }

  private mapParameterLocation(location: string): NormalizedParameter['location'] {
    switch (location) {
      case 'query': return 'query';
      case 'header': return 'header';
      case 'path': return 'path';
      case 'formData': return 'formData';
      case 'body': return 'body';
      default: return 'query';
    }
  }
}
