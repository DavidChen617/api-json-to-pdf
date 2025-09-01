// Schema processing utility functions
import type { SwaggerSchema, SwaggerDefinition, ExpandedField, TypeInfo, Parameter } from './types';
import { MEANINGFUL_FORMATS, TABLE_CONFIG, PARAMETER_LOCATION_MAP } from './utils/constants';

// Removed generateDefaultFieldDescription - let API docs provide their own descriptions

export function formatSchema(schema: SwaggerSchema | undefined): string {
  if (!schema) {
    return '';
  }
  if (schema.$ref) {
    // Following RapiPdf's approach: directly take the last segment of $ref as the type name
    return schema.$ref.substring(schema.$ref.lastIndexOf('/') + 1);
  }
  if (schema.type === 'array') {
    const itemType = formatSchema(schema.items);
    return `array of ${itemType}`;
  }
  if (schema.type) {
    if (schema.format) {
      if (MEANINGFUL_FORMATS.includes(schema.format as any)) {
        return schema.format;
      } else {
        return `${schema.type} (${schema.format})`;
      }
    }
    return schema.type;
  }
  return 'object';
}

// Recursively expand schema into a tree structure
export function expandSchema(schema: SwaggerSchema | undefined, definitions: { [name: string]: SwaggerDefinition }, level: number = 0, maxLevel: number = TABLE_CONFIG.MAX_EXPAND_LEVEL): ExpandedField[] {
  if (!schema || level > maxLevel) {
    return [];
  }

  const result: ExpandedField[] = [];
  const indent = '  '.repeat(level); // Indentation

  if (schema.$ref) {
    // Supports Swagger 2.0 and OpenAPI 3.0 reference formats
    const refName = schema.$ref.replace('#/definitions/', '').replace('#/components/schemas/', '');
    const definition = definitions[refName];
    if (definition) {
      return expandSchema(definition, definitions, level, maxLevel);
    }
    return [{ field: `${indent}{${refName}}`, type: 'object', description: `參考 ${refName}` }];
  }

  if (schema.allOf) {
    // Handle allOf: merge properties of all sub-schemas
    schema.allOf.forEach((subSchema: any) => {
      result.push(...expandSchema(subSchema, definitions, level, maxLevel));
    });
    return result;
  }

  if (schema.type === 'object' || schema.properties) {
    // Expand object properties
    for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
      const isRequired = schema.required && schema.required.includes(propName);
      const displayName = isRequired ? `${propName}*` : propName;
      
      const typeInfo = getTypeInfo(propSchema as any);
      
      result.push({
        field: `${indent}${displayName}`,
        type: typeInfo.type,
        description: typeInfo.description || (propSchema as any).description || ''
      });

      // If it's a complex type, recursively expand
      const shouldExpand = (
        (propSchema as any).type === 'object' || 
        (propSchema as any).properties ||
        (propSchema as any).$ref ||
        (propSchema as any).allOf ||
        // Handle schemas without explicit type but might be complex objects
        (!(propSchema as any).type && !(propSchema as any).format && Object.keys(propSchema as any).length > 1)
      );
      
      if (shouldExpand) {
        result.push(...expandSchema(propSchema, definitions, level + 1, maxLevel));
      } else if ((propSchema as any).type === 'array' && (propSchema as any).items) {
        result.push(...expandSchema((propSchema as any).items, definitions, level + 1, maxLevel));
      }
    }
  } else if (schema.type === 'array' && schema.items) {
    // Array type
    result.push(...expandSchema(schema.items, definitions, level, maxLevel));
  }

  return result;
}

// Get type information (similar to RapiPdf's getTypeInfo)
export function getTypeInfo(schema: SwaggerSchema | undefined): TypeInfo {
  if (!schema) {
    return { type: '', description: '' };
  }

  if (schema.$ref) {
    const refName = schema.$ref.substring(schema.$ref.lastIndexOf('/') + 1);
    return { type: refName, description: schema.description || '' };
  }

  if (schema.enum) {
    return { type: 'enum', description: `允許值: ${schema.enum.join(', ')}` };
  }

  if (schema.type === 'array') {
    const itemType = getTypeInfo(schema.items);
    return { type: `array of ${itemType.type}`, description: schema.description || '' };
  }

  let type = schema.type || 'object';
  
  // 優先顯示有意義的格式，而不是 "string (format)" 
  if (schema.format) {
    if (MEANINGFUL_FORMATS.includes(schema.format as any)) {
      type = schema.format;
    } else {
      type = `${type} (${schema.format})`;
    }
  }

  return { type, description: schema.description || '' };
}

export function formatParameterType(param: Parameter): string {
  if (param.schema) {
    return formatSchema(param.schema);
  }
  return param.type || 'string';
}

export function getParameterLocation(param: Parameter): string {
  return PARAMETER_LOCATION_MAP[param.in as keyof typeof PARAMETER_LOCATION_MAP] || param.in;
}