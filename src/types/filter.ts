// API Filtering Related Type Definitions

// Filter configuration format - supports multiple methods
export interface ApiFilterConfig {
  // Method 1: Directly list required APIs
  include?: {
    apis?: Array<{
      method: string;     // "GET", "POST", etc.
      path: string;       // "/api/users/{id}"
    }>;
    
    // Or filter by tags
    tags?: string[];      // ["Users", "Orders"]
    
    // Or filter by path patterns
    pathPatterns?: string[]; // ["/api/users/*", "/api/orders/*"]
  };
  
  // Method 2: Exclude unwanted APIs
  exclude?: {
    apis?: Array<{
      method: string;
      path: string;
    }>;
    tags?: string[];
    pathPatterns?: string[];
  };
  
  // Method 3: Filter by operation ID
  operationIds?: string[];
  
  // Configuration options
  options?: {
    // Whether to use strict matching (default: false, supports wildcards)
    strictMatch?: boolean;
    
    // Whether to be case-sensitive (default: false)
    caseSensitive?: boolean;
    
    // Behavior when no match is found
    onNoMatch?: 'error' | 'warn' | 'empty'; // Default: warn
  };
}

// Filter Results
export interface FilterResult {
  matched: number;      // Number of matched APIs
  total: number;        // Total number of original APIs
  filteredGroups: any[]; // Filtered API groups
  skippedApis: Array<{  // List of skipped APIs
    method: string;
    path: string;
    reason: string;
  }>;
}