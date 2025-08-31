// Universal parser - supports multiple API specification versions
import { ParserFactory } from './parsers/parser-factory';
import { LegacyAdapter } from './adapters/legacy-adapter';
import { ApiFilter } from './filters/api-filter';
import { Logger } from './utils/logger';
import type { ApiGroup } from './types/common';
import type { ApiFilterConfig } from './types/filter';

/**
 * Universal API specification parser function
 * Auto-detects version and parses to format compatible with existing PDF generation system
 */
export function parseApiSpec(spec: any, filterConfig?: ApiFilterConfig): {
  title: string;
  version: string;
  groups: ApiGroup[];
} {
  try {
    // Detect API specification version
    const detectedVersion = ParserFactory.detectVersion(spec);
    
    if (!detectedVersion) {
      throw new Error('Unrecognized API specification format. Please ensure it is a valid Swagger 2.0 or OpenAPI 3.0+ specification.');
    }
    
    Logger.info(`Detected API specification version: ${detectedVersion}`);
    
    // Use factory pattern to create parser and normalize
    const normalizedSpec = ParserFactory.parseSpec(spec);
    
    // Convert to legacy format via adapter for backward compatibility
    const result = LegacyAdapter.convertToLegacyFormat(normalizedSpec);
    
    // Apply filtering if filter config is provided
    if (filterConfig) {
      Logger.info(`Applying API filter...`);
      const filter = new ApiFilter(filterConfig);
      const filterResult = filter.filter(result.groups);
      
      Logger.info(`Filter results: ${filterResult.matched}/${filterResult.total} APIs`);
      if (filterResult.skippedApis.length > 0) {
        Logger.info(`Skipped APIs: ${filterResult.skippedApis.length}`);
      }
      
      return {
        ...result,
        groups: filterResult.filteredGroups
      };
    }
    
    return result;
    
  } catch (error) {
    console.error('Error parsing API specification:', error);
    throw error;
  }
}

/**
 * Check if file is a supported API specification
 */
export function isValidApiSpec(spec: any): boolean {
  try {
    const version = ParserFactory.detectVersion(spec);
    return version !== null && ParserFactory.isVersionSupported(version);
  } catch {
    return false;
  }
}

/**
 * Get API specification version information
 */
export function getApiSpecInfo(spec: any): {
  version: string | null;
  title?: string;
  specVersion?: string;
  supported: boolean;
} {
  try {
    const detectedVersion = ParserFactory.detectVersion(spec);
    
    return {
      version: detectedVersion,
      title: spec.info?.title,
      specVersion: spec.swagger || spec.openapi,
      supported: detectedVersion !== null
    };
  } catch {
    return {
      version: null,
      supported: false
    };
  }
}

/**
 * Parse API specification with filter configuration (supports config object or file path)
 */
export async function parseApiSpecWithFilter(
  spec: any, 
  filterInput?: string | ApiFilterConfig
): Promise<{
  title: string;
  version: string;
  groups: ApiGroup[];
}> {
  let filterConfig: ApiFilterConfig | undefined;
  
  if (filterInput) {
    if (typeof filterInput === 'string') {
      // Load filter configuration from file
      try {
        const fs = await import('fs');
        if (!fs.existsSync(filterInput)) {
          throw new Error(`Filter file does not exist: ${filterInput}`);
        }
        
        Logger.info(`Loading filter configuration: ${filterInput}`);
        const filterContent = fs.readFileSync(filterInput, 'utf8');
        filterConfig = JSON.parse(filterContent);
      } catch (error) {
        Logger.error('Failed to load filter configuration:', error);
        throw error;
      }
    } else {
      // Use configuration object directly
      Logger.info(`Using --from-literal filter configuration`);
      filterConfig = filterInput;
    }
    
    // Validate configuration format
    if (!ApiFilter.validateConfig(filterConfig)) {
      throw new Error('Invalid filter configuration format');
    }
  }
  
  return parseApiSpec(spec, filterConfig);
}

// Backward compatibility: keep original function name
export { parseApiSpec as parseSwagger };