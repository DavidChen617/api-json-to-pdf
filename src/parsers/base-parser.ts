// Abstract base class for parsers
import type { NormalizedApiSpec, ApiSpecVersion } from '../types/common';

export abstract class BaseApiParser {
  protected spec: any;
  
  constructor(spec: any) {
    this.spec = spec;
  }

  // Abstract method - subclasses must implement
  abstract getVersion(): ApiSpecVersion;
  abstract isValidSpec(): boolean;
  abstract normalize(): NormalizedApiSpec;

  // Common helper methods
  protected cleanFileName(name: string): string {
    return name
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  protected extractRefName(ref: string): string {
    if (ref.includes('#/definitions/')) {
      return ref.replace('#/definitions/', '');
    }
    if (ref.includes('#/components/schemas/')) {
      return ref.replace('#/components/schemas/', '');
    }
    return ref.split('/').pop() || ref;
  }

  protected getMainMediaType(content?: { [mediaType: string]: any }): string {
    if (!content) return 'application/json';
    
    const types = Object.keys(content);
    
    // Priority: json > xml > other
    if (types.includes('application/json')) return 'application/json';
    if (types.includes('application/xml')) return 'application/xml';
    if (types.includes('text/plain')) return 'text/plain';
    
    return types[0] || 'application/json';
  }
}
