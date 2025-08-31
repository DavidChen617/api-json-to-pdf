// Constants configuration
export const TABLE_CONFIG = {
  INDENT_SIZE: 15,
  CELL_MARGIN: [6, 4, 6] as const,
  MAX_EXPAND_LEVEL: 10,
  LARGE_TABLE_THRESHOLD: 20
} as const;

export const PDF_LAYOUT = {
  DEFAULT_TABLE_LAYOUT: {
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => '#e5e7eb',
    vLineColor: () => '#e5e7eb'
  }
} as const;

export const MEANINGFUL_FORMATS = [
  'date-time', 'date', 'time', 'email', 'uri', 'uuid', 
  'password', 'binary', 'byte', 'int32', 'int64', 'float', 'double'
] as const;

export const PARAMETER_LOCATION_MAP = {
  'query': '查詢參數',
  'body': '請求體', 
  'path': '路徑參數',
  'header': '請求頭',
  'formData': '表單數據'
} as const;