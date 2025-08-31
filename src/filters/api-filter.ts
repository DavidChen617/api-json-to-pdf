// API Filter
import type { ApiGroup, ApiEndpoint } from '../types/common';
import type { ApiFilterConfig, FilterResult } from '../types/filter';

export class ApiFilter {
  private config: ApiFilterConfig;

  constructor(config: ApiFilterConfig) {
    this.config = config;
  }

  /**
   * Filter API groups
   */
  filter(groups: ApiGroup[]): FilterResult {
    const originalCount = this.countTotalApis(groups);
    const skippedApis: FilterResult['skippedApis'] = [];
    
    const filteredGroups: ApiGroup[] = groups.map(group => {
      const filteredEndpoints = group.endpoints.filter(endpoint => {
        const shouldInclude = this.shouldIncludeEndpoint(endpoint);
        
        if (!shouldInclude) {
          let reason = 'Filtered out'; // Default reason

          if (this.config.include && !this.matchesIncludeRules(endpoint)) {
            reason = 'Not in include list';
          } else if (this.config.exclude && this.matchesExcludeRules(endpoint)) {
            reason = 'In exclude list';
          }
          // Add more specific reasons if operationIds filtering is implemented later

          skippedApis.push({
            method: endpoint.method,
            path: endpoint.path,
            reason: reason
          });
        }
        
        return shouldInclude;
      });
      
      return {
        ...group,
        endpoints: filteredEndpoints
      };
    }).filter(group => group.endpoints.length > 0); // Remove empty groups
    
    const matchedCount = this.countTotalApis(filteredGroups);
    
    // Check if there are any matching results
    if (matchedCount === 0) {
      this.handleNoMatch(originalCount);
    }
    
    return {
      matched: matchedCount,
      total: originalCount,
      filteredGroups,
      skippedApis
    };
  }

  /**
   * Determines if this endpoint should be included
   */
  private shouldIncludeEndpoint(endpoint: ApiEndpoint): boolean {
    // If there are include rules, at least one include condition must be met
    if (this.config.include) {
      if (!this.matchesIncludeRules(endpoint)) {
        return false;
      }
    }
    
    // If there are exclude rules, no exclude condition can be met
    if (this.config.exclude) {
      if (this.matchesExcludeRules(endpoint)) {
        return false;
      }
    }
    
    // If operationIds are specified, they must be in the list
    if (this.config.operationIds && this.config.operationIds.length > 0) {
      // Note: Current ApiEndpoint does not have an operationId field, needs to be obtained from raw data
      // For now, return true; needs to be extended for actual use
      return true;
    }
    
    return true;
  }

  /**
   * Checks if include rules are met
   */
  private matchesIncludeRules(endpoint: ApiEndpoint): boolean {
    const include = this.config.include!;
    
    // Check direct API match
    if (include.apis) {
      const directMatch = include.apis.some(api => 
        this.matchesApi(endpoint, api.method, api.path)
      );
      if (directMatch) return true;
    }
    
    // Check tag match
    if (include.tags) {
      const tagMatch = include.tags.some(tag => 
        this.matchesTag(endpoint, tag)
      );
      if (tagMatch) return true;
    }
    
    // Check path pattern match
    if (include.pathPatterns) {
      const patternMatch = include.pathPatterns.some(pattern => 
        this.matchesPathPattern(endpoint.path, pattern)
      );
      if (patternMatch) return true;
    }
    
    return false;
  }

  /**
   * Checks if exclude rules are met
   */
  private matchesExcludeRules(endpoint: ApiEndpoint): boolean {
    const exclude = this.config.exclude!;
    
    // Check direct API match
    if (exclude.apis) {
      const directMatch = exclude.apis.some(api => 
        this.matchesApi(endpoint, api.method, api.path)
      );
      if (directMatch) return true;
    }
    
    // Check tag match
    if (exclude.tags) {
      const tagMatch = exclude.tags.some(tag => 
        this.matchesTag(endpoint, tag)
      );
      if (tagMatch) return true;
    }
    
    // Check path pattern match
    if (exclude.pathPatterns) {
      const patternMatch = exclude.pathPatterns.some(pattern => 
        this.matchesPathPattern(endpoint.path, pattern)
      );
      if (patternMatch) return true;
    }
    
    return false;
  }

  /**
   * Checks if API matches
   */
  private matchesApi(endpoint: ApiEndpoint, method: string, path: string): boolean {
    const caseSensitive = this.config.options?.caseSensitive ?? false;
    const strictMatch = this.config.options?.strictMatch ?? false;
    
    const methodMatch = caseSensitive 
      ? endpoint.method === method.toUpperCase()
      : endpoint.method.toLowerCase() === method.toLowerCase();
    
    if (!methodMatch) return false;
    
    if (strictMatch) {
      return caseSensitive 
        ? endpoint.path === path
        : endpoint.path.toLowerCase() === path.toLowerCase();
    } else {
      return this.matchesPathPattern(endpoint.path, path);
    }
  }

  /**
   * Checks if tag matches
   */
  private matchesTag(endpoint: ApiEndpoint, tag: string): boolean {
    const caseSensitive = this.config.options?.caseSensitive ?? false;
    
    return caseSensitive 
      ? endpoint.tag === tag
      : endpoint.tag.toLowerCase() === tag.toLowerCase();
  }

  /**
   * Checks if path pattern matches (supports wildcards)
   */
  private matchesPathPattern(path: string, pattern: string): boolean {
    const caseSensitive = this.config.options?.caseSensitive ?? false;
    
    const normalizedPath = caseSensitive ? path : path.toLowerCase();
    const normalizedPattern = caseSensitive ? pattern : pattern.toLowerCase();
    
    // First escape special characters, then convert wildcards to regular expressions
    const regexPattern = normalizedPattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // Escape regex special characters (excluding slashes, asterisks, question marks)
      .replace(/\*/g, '.*')                  // * matches any character
      .replace(/\?/g, '.');                  // ? matches a single character
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(normalizedPath);
  }

  /**
   * Counts total number of APIs
   */
  private countTotalApis(groups: ApiGroup[]): number {
    return groups.reduce((total, group) => total + group.endpoints.length, 0);
  }

  

  /**
   * Handles cases where no APIs match
   */
  private handleNoMatch(totalCount: number): void {
    const onNoMatch = this.config.options?.onNoMatch ?? 'warn';
    const message = `No APIs match the filter criteria. Total APIs: ${totalCount}`;
    
    switch (onNoMatch) {
      case 'error':
        throw new Error(message);
      case 'warn':
        console.warn(`${message}`);
        break;
      case 'empty':
        // Silent handling
        break;
    }
  }

  /**
   * Loads filter configuration from a JSON file
   */
  static fromJsonFile(filePath: string): ApiFilter {
    const fs = require('fs');
    const configContent = fs.readFileSync(filePath, 'utf8');
    const config: ApiFilterConfig = JSON.parse(configContent);
    return new ApiFilter(config);
  }

  /**
   * Validates filter configuration format
   */
  static validateConfig(config: any): config is ApiFilterConfig {
    if (typeof config !== 'object' || config === null) return false;
    
    // At least one filtering method must be present
    const hasInclude = config.include && (
      config.include.apis || config.include.tags || config.include.pathPatterns
    );
    const hasExclude = config.exclude && (
      config.exclude.apis || config.exclude.tags || config.exclude.pathPatterns
    );
    const hasOperationIds = config.operationIds && Array.isArray(config.operationIds);
    
    return hasInclude || hasExclude || hasOperationIds;
  }
}