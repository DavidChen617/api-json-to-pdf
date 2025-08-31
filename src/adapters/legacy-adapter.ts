// Legacy compatibility adapter - Converts NormalizedApiSpec to existing ApiGroup format
import type { 
  NormalizedApiSpec, 
  NormalizedOperation,
  ApiGroup,
  ApiEndpoint 
} from '../types/common';

export class LegacyAdapter {
  /**
   * Converts NormalizedApiSpec to the legacy ApiGroup[] format
   * Ensures backward compatibility with existing PDF generation system
   */
  static convertToLegacyFormat(normalizedSpec: NormalizedApiSpec): {
    title: string;
    version: string;
    groups: ApiGroup[];
  } {
    // Group operations by tag
    const groupMap: { [tag: string]: ApiEndpoint[] } = {};
    
    normalizedSpec.operations.forEach(operation => {
      const tag = operation.tags?.[0] || 'Other';
      
      if (!groupMap[tag]) {
        groupMap[tag] = [];
      }
      
      groupMap[tag].push(this.convertOperation(operation));
    });
    
    // Convert to ApiGroup[] format
    const groups: ApiGroup[] = Object.entries(groupMap).map(([name, endpoints]) => ({
      name,
      endpoints: endpoints.sort((a, b) => a.path.localeCompare(b.path))
    }));
    
    return {
      title: normalizedSpec.info.title,
      version: normalizedSpec.info.version,
      groups: groups.sort((a, b) => a.name.localeCompare(b.name))
    };
  }

  /**
   * Converts a single operation to legacy format
   */
  private static convertOperation(operation: NormalizedOperation): ApiEndpoint {
    // Convert parameter format
    const parameters = operation.parameters?.map(param => ({
      name: param.name,
      in: this.mapLocationToOldFormat(param.location),
      required: param.required,
      type: param.schema?.type,
      schema: param.schema ? this.convertSchemaToOldFormat(param.schema) : undefined,
      description: param.description
    })) || [];

    // If there is a requestBody, add it to parameters (backward compatible)
    if (operation.requestBody) {
      parameters.push({
        name: 'body',
        in: 'body',
        required: operation.requestBody.required,
        type: operation.requestBody.schema?.type,
        schema: operation.requestBody.schema ? this.convertSchemaToOldFormat(operation.requestBody.schema) : undefined,
        description: operation.requestBody.description
      });
    }

    // Convert response format
    const responses: { [status: string]: any } = {};
    operation.responses.forEach(response => {
      responses[response.statusCode] = {
        description: response.description,
        schema: response.schema ? this.convertSchemaToOldFormat(response.schema) : undefined
      };
    });

    return {
      method: operation.method,
      path: operation.path,
      tag: operation.tags?.[0] || 'Other',
      summary: operation.summary || this.generateDefaultSummary(operation),
      description: operation.description || this.generateDefaultDescription(operation),
      parameters,
      responses
    };
  }

  /**
   * Generates a default API summary
   */
  private static generateDefaultSummary(operation: NormalizedOperation): string {
    const method = operation.method.toUpperCase();
    const pathParts = operation.path.split('/').filter(part => part);
    const lastPart = pathParts[pathParts.length - 1] || 'API';
    
    // Generate appropriate description based on HTTP method
    switch (method) {
      case 'GET':
        return `Get ${lastPart}`;
      case 'POST':
        return `Add ${lastPart}`;
      case 'PUT':
        return `Update ${lastPart}`;
      case 'DELETE':
        return `Delete ${lastPart}`;
      case 'PATCH':
        return `Partially Update ${lastPart}`;
      default:
        return `${method} ${lastPart}`;
    }
  }

  /**
   * Generates a default API description
   */
  private static generateDefaultDescription(operation: NormalizedOperation): string {
    const method = operation.method.toUpperCase();
    const operationId = operation.operationId;
    
    if (operationId) {
      return `Operation ID: ${operationId}`;
    }
    
    return `Operation for ${method} ${operation.path}`;
  }

  /**
   * Converts location format
   */
  private static mapLocationToOldFormat(location: string): string {
    switch (location) {
      case 'cookie': return 'header'; // Treat cookie parameters as header
      default: return location;
    }
  }

  /**
   * Converts Schema to legacy format (recursive)
   */
  private static convertSchemaToOldFormat(schema: any): any {
    if (!schema) return undefined;

    const converted: any = {
      type: schema.type,
      format: schema.format,
      description: schema.description,
      minimum: schema.minimum,
      maximum: schema.maximum,
      minLength: schema.minLength,
      maxLength: schema.maxLength,
      enum: schema.enum
    };

    // Handle references
    if (schema.ref) {
      converted.$ref = `#/definitions/${schema.ref}`;
    }

    // Handle arrays
    if (schema.items) {
      converted.items = this.convertSchemaToOldFormat(schema.items);
    }

    // Handle object properties
    if (schema.properties) {
      converted.properties = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(schema.properties)) {
        converted.properties[key] = this.convertSchemaToOldFormat(value);
        if ((value as any).required) {
          required.push(key);
        }
      }
      
      if (required.length > 0) {
        converted.required = required;
      }
    }

    // Handle combined types
    if (schema.allOf) {
      converted.allOf = schema.allOf.map((s: any) => this.convertSchemaToOldFormat(s));
    }

    // OpenAPI 3.0 specific anyOf/oneOf, converted to allOf (approximate handling)
    if (schema.anyOf) {
      converted.allOf = schema.anyOf.map((s: any) => this.convertSchemaToOldFormat(s));
    }
    
    if (schema.oneOf) {
      converted.allOf = schema.oneOf.map((s: any) => this.convertSchemaToOldFormat(s));
    }

    return converted;
  }

  /**
   * Converts Schema definition dictionary
   */
  static convertSchemasToDefinitions(schemas: { [name: string]: any }): { [name: string]: any } {
    const definitions: { [name: string]: any } = {};
    
    for (const [name, schema] of Object.entries(schemas)) {
      definitions[name] = this.convertSchemaToOldFormat(schema);
    }
    
    return definitions;
  }
}