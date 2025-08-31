import type { StyleDictionary, Alignment } from 'pdfmake/interfaces';

export const pdfStyles: StyleDictionary = {
  title: { fontSize: 28, bold: true, alignment: 'center' as Alignment, color: '#1f2937' },
  subtitle: { fontSize: 14, alignment: 'center' as Alignment, color: '#6b7280' },
  h1: { fontSize: 24, bold: true, color: '#1f2937' },
  h2: { fontSize: 20, bold: true, color: 'white', fillColor: '#7c3aed', margin: [0, 20, 0, 10] },
  h3: { fontSize: 16, bold: true, color: '#374151', margin: [0, 15, 0, 8] },
  h4: { fontSize: 14, bold: true, color: '#4b5563', margin: [0, 12, 0, 6] },
  p: { fontSize: 11, margin: [0, 4, 0, 4] },
  small: { fontSize: 10 },
  sub: { fontSize: 9 },
  
  // margin
  topMargin1: { margin: [0, 30, 0, 10] },
  topMargin2: { margin: [0, 20, 0, 8] },
  topMargin3: { margin: [0, 15, 0, 6] },
  tableMargin: { margin: [0, 10, 0, 15] },
  
  // format
  b: { bold: true },
  i: { italics: true },
  center: { alignment: 'center' },
  
  // color
  primary: { color: '#2563eb' },
  success: { color: '#059669' },
  warning: { color: '#d97706' },
  danger: { color: '#dc2626' },
  muted: { color: '#6b7280' },
  
  // font
  mono: { font: 'Roboto', fontSize: 10 },
  monoSub: { font: 'Roboto', fontSize: 9 },
  
  // table
  tableHeader: { fillColor: '#1f2937', color: 'white', bold: true },
  tableCell: { margin: [4, 6, 4, 6] },
  
  // HTTP method style
  methodGet: { color: '#059669', bold: true, fontSize: 10 },
  methodPost: { color: '#2563eb', bold: true, fontSize: 10 },
  methodPut: { color: '#d97706', bold: true, fontSize: 10 },
  methodDelete: { color: '#dc2626', bold: true, fontSize: 10 },
  methodPatch: { color: '#7c3aed', bold: true, fontSize: 10 },
  
  // Special Areas
  tocSection: { fillColor: '#f8fafc', margin: [0, 10, 0, 20] },
  apiCard: { margin: [0, 15, 0, 15] },
  required: { color: '#dc2626', bold: true }
};

// Get HTTP method style
export function getMethodStyle(method: string): string[] {
  switch (method.toLowerCase()) {
    case 'get': return ['methodGet'];
    case 'post': return ['methodPost'];
    case 'put': return ['methodPut'];  
    case 'delete': return ['methodDelete'];
    case 'patch': return ['methodPatch'];
    default: return ['mono'];
  }
}