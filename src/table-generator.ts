// Table generation related functions
import { expandSchema, formatParameterType, getParameterLocation } from './schema-utils';
import type { ApiEndpoint, SwaggerDefinition, PdfContent, ExpandedField } from './types';
import { TABLE_CONFIG, PDF_LAYOUT } from './utils/constants';

// Extract common table generation function
function generateFieldTable(expandedFields: ExpandedField[], title: string, apiInfo?: string): PdfContent {
  const tableBody = [];
  
  // Add API info row if provided
  if (apiInfo) {
    tableBody.push([
      { 
        text: `[${apiInfo}] ${title}`,
        style: ['tableHeader'],
        colSpan: 3,
        alignment: 'center',
        fillColor: '#ffffff',
        border: [false, false, false, false], // Remove all borders
        color: '#000000' // Set to black color
      },
      {},
      {}
    ]);
  }
  
  // Add regular header
  tableBody.push([
    { text: '欄位名稱', style: ['tableHeader'] },
    { text: '型別', style: ['tableHeader'] },
    { text: '說明', style: ['tableHeader'] }
  ]);
  
  expandedFields.forEach(field => {
    // Calculate indentation level
    const indentLevel = (field.field.match(/^ */)?.[0].length || 0) / 2;
    const fieldName = field.field.trim();
    
    tableBody.push([
      { 
        text: fieldName, 
        style: fieldName.includes('*') ? ['mono', 'tableCell', 'b'] : ['mono', 'tableCell'],
        margin: [indentLevel * TABLE_CONFIG.INDENT_SIZE, 6, 4, 6]
      } as any,
      { text: field.type, style: ['small', 'tableCell'] },
      { text: field.description, style: ['small', 'tableCell'] }
    ]);
  });
  
  const headerRows = apiInfo ? 2 : 1; // If API info exists, header has two rows
  
  const tableContent: any = {
    table: {
      headerRows: headerRows,
      widths: ['30%', '15%', '*'],
      body: tableBody,
      keepWithHeaderRows: headerRows, // Ensure header stays with content
      dontBreakRows: false // Allow pagination between rows
    },
    layout: PDF_LAYOUT.DEFAULT_TABLE_LAYOUT,
    style: ['tableMargin']
  };
  
  // Large table pagination
  if (tableBody.length > TABLE_CONFIG.LARGE_TABLE_THRESHOLD) {
    tableContent.pageBreak = 'before';
  }
  
  return tableContent;
}

// Generate REQUEST section
export function generateRequestSection(endpoint: ApiEndpoint, definitions: { [name: string]: SwaggerDefinition }, apiInfo?: string): PdfContent[] {
  const content: PdfContent[] = [];
  
  if (endpoint.parameters && endpoint.parameters.length > 0) {
    content.push({
      text: 'REQUEST',
      style: ['h4', 'b'],
      margin: [0, 15, 0, 8]
    });

    endpoint.parameters.forEach(param => {
      if (param.schema) {
        const expandedFields = expandSchema(param.schema, definitions);
        
        if (expandedFields.length > 0) {
          content.push({
            text: `REQUEST BODY - application/json`,
            style: ['small', 'b', 'muted'],
            margin: [0, 8, 0, 5]
          });
          
          content.push(generateFieldTable(expandedFields, 'REQUEST', apiInfo));
        }
      } else {
        // Original logic for simple parameters
        const tableBody = [
          [
            { text: '參數名稱', style: ['tableHeader'] },
            { text: '位置', style: ['tableHeader'] },
            { text: '類型', style: ['tableHeader'] },
            { text: '必填', style: ['tableHeader'] },
            { text: '說明', style: ['tableHeader'] }
          ]
        ];
        
        tableBody.push([
          { text: param.name, style: ['mono', 'tableCell'] },
          { text: getParameterLocation(param), style: ['small', 'tableCell'] },
          { text: formatParameterType(param), style: ['mono', 'tableCell'] },
          { 
            text: param.required ? '是' : '否', 
            style: param.required ? ['required', 'tableCell'] : ['small', 'tableCell'] 
          },
          { text: param.description || '', style: ['small', 'tableCell'] }
        ]);
        
        content.push({
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto', '*'],
            body: tableBody,
            keepWithHeaderRows: 1,
            dontBreakRows: false
          },
          layout: PDF_LAYOUT.DEFAULT_TABLE_LAYOUT,
          style: ['tableMargin']
        });
      }
    });
  }
  
  return content;
}

// Generate RESPONSE section
export function generateResponseSection(endpoint: ApiEndpoint, definitions: { [name: string]: SwaggerDefinition }, apiInfo?: string): PdfContent[] {
  const content: PdfContent[] = [];
  
  if (endpoint.responses && Object.keys(endpoint.responses).length > 0) {
    content.push({
      text: 'RESPONSE',
      style: ['h4', 'b'],
      margin: [0, 15, 0, 8]
    });
    
    Object.entries(endpoint.responses).forEach(([status, response]: [string, any]) => {
      content.push({
        text: `STATUS CODE - ${status}:`,
        style: ['small', 'b'],
        margin: [0, 8, 0, 5]
      });
      
      if (response.schema) {
        const expandedFields = expandSchema(response.schema, definitions);
        
        if (expandedFields.length > 0) {
          content.push({
            text: `RESPONSE MODEL - application/json`,
            style: ['small', 'b', 'muted'],
            margin: [0, 5, 0, 5]
          });
          
          content.push(generateFieldTable(expandedFields, 'RESPONSE', apiInfo));
        }
      } else {
        // Original logic for simple responses
        const responseType = response.schema ? 'object' : 'string';
        const responseBody = [
          [
            { text: '狀態碼', style: ['tableHeader'] },
            { text: '類型', style: ['tableHeader'] },
            { text: '說明', style: ['tableHeader'] }
          ]
        ];
        
        responseBody.push([
          { text: status, style: ['mono', 'tableCell'] },
          { text: responseType, style: ['mono', 'tableCell'] },
          { text: response.description || '', style: ['small', 'tableCell'] }
        ]);
        
        content.push({
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*'],
            body: responseBody,
            keepWithHeaderRows: 1,
            dontBreakRows: false
          },
          layout: PDF_LAYOUT.DEFAULT_TABLE_LAYOUT,
          style: ['tableMargin']
        });
      }
    });
  }
  
  return content;
}