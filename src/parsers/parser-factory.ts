// Parser Factory
import { BaseApiParser } from './base-parser';
import { SwaggerV2Parser } from './swagger-v2-parser';
import { OpenAPIV3Parser } from './openapi-v3-parser';
import type { NormalizedApiSpec, ApiSpecVersion } from '../types/common';

export class ParserFactory {
  /**
   * Detects the API specification version
   */
  static detectVersion(spec: any): ApiSpecVersion | null {
    if (spec.swagger === '2.0') {
      return 'swagger-2.0';
    }
    
    if (spec.openapi && typeof spec.openapi === 'string') {
      if (spec.openapi.startsWith('3.0')) {
        return 'openapi-3.0';
      }
      if (spec.openapi.startsWith('3.1')) {
        return 'openapi-3.1';
      }
    }
    
    return null;
  }

  /**
   * Creates the appropriate parser
   */
  static createParser(spec: any): BaseApiParser {
    const version = this.detectVersion(spec);
    
    switch (version) {
      case 'swagger-2.0':
        return new SwaggerV2Parser(spec);
      
      case 'openapi-3.0':
      case 'openapi-3.1':
        return new OpenAPIV3Parser(spec);
      
      default:
        throw new Error(`Unsupported API specification version. Supported versions: Swagger 2.0, OpenAPI 3.0+`);
    }
  }

  /**
   * Parses the API specification into a unified format
   */
  static parseSpec(spec: any): NormalizedApiSpec {
    const parser = this.createParser(spec);
    
    if (!parser.isValidSpec()) {
      throw new Error(`Invalid API specification file`);
    }
    
    return parser.normalize();
  }

  /**
   * Gets the list of supported versions
   */
  static getSupportedVersions(): ApiSpecVersion[] {
    return ['swagger-2.0', 'openapi-3.0', 'openapi-3.1'];
  }

  /**
   * Checks if the specified version is supported
   */
  static isVersionSupported(version: string): boolean {
    return this.getSupportedVersions().some(v => v === version || version.startsWith(v.replace('-', ' ')));
  }
}
