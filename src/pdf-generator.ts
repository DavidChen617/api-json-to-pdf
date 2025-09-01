import { parseApiSpecWithFilter } from './universal-parser';
import { pdfStyles, getMethodStyle } from './styles';
import { generateRequestSection, generateResponseSection } from './table-generator';
import type { PdfContent } from './types';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

export async function generatePdfDefinition(apiSpec: any, filterFilePath?: string): Promise<TDocumentDefinitions> {
  const { title, version, groups } = await parseApiSpecWithFilter(apiSpec, filterFilePath);

  // Generate API detailed content
  function generateApiSections(): PdfContent[] {
    const sections: PdfContent[] = [];
    
    groups.forEach(group => {
      // Section title
      sections.push({
        text: group.name,
        style: ['h2'],
        tocItem: true,
        tocStyle: ['h4', 'primary'],
        margin: [0, 25, 0, 15]
      } as any);
      
      // Each API endpoint
      group.endpoints.forEach(endpoint => {
        // Create a complete content array for a single API for intelligent pagination
        const apiContent: PdfContent[] = [];
        
        // API title - 恢復原本的結構
        apiContent.push({
          text: [
            { text: endpoint.method, style: getMethodStyle(endpoint.method) },
            { text: ` ${endpoint.path}`, style: ['mono', 'h3'] },
            { text: endpoint.summary ? ` - ${endpoint.summary}` : '', style: ['sub', 'muted'] }
          ] as any,
          tocItem: true,
          tocStyle: ['small'],
          tocMargin: [40, 4, 0, 6],
          margin: [0, 20, 0, 5]
        } as any);
        
        // Get schema definition (supports Swagger 2.0 and OpenAPI 3.0)
        const schemaDefinitions = apiSpec.definitions || apiSpec.components?.schemas || {};
        
        // REQUEST section
        const apiInfo = `${endpoint.method.toUpperCase()} ${endpoint.path}`;
        const requestContent = generateRequestSection(endpoint, schemaDefinitions, apiInfo);
        if (requestContent.length > 0) {
          apiContent.push(...requestContent);
        }
        
        // RESPONSE section  
        const responseContent = generateResponseSection(endpoint, schemaDefinitions, apiInfo);
        if (responseContent.length > 0) {
          apiContent.push(...responseContent);
        }
        
        // Intelligent pagination handling
        // If the content is short, try to keep it on the same page; if too long, allow pagination at appropriate places
        if (apiContent.length <= 4) {
          // Short content, try not to paginate
          sections.push({
            stack: apiContent,
            unbreakable: true,
            margin: [0, 0, 0, 20]
          });
        } else {
          // Longer content, use segmented approach: Title + REQUEST as one group, RESPONSE as another
          const apiTitle = apiContent[0];
          const hasRequest = requestContent.length > 0;
          const hasResponse = responseContent.length > 0;
          
          if (hasRequest && hasResponse) {
            // Has REQUEST and RESPONSE: divided into two paginable blocks
            const requestSection: any = {
              stack: [apiTitle, ...requestContent],
              margin: [0, 0, 0, 10]
            };
            requestSection.keepWithNext = true; // Keep close to the next block
            sections.push(requestSection);
            
            sections.push({
              stack: responseContent,
              margin: [0, 0, 0, 20]
            });
          } else {
            // Only REQUEST or RESPONSE: try to keep together
            sections.push({
              stack: apiContent,
              unbreakable: apiContent.length <= 6, // Try not to paginate if less than 6 elements
              margin: [0, 0, 0, 20]
            });
          }
        }
      });
    });
    
    return sections;
  }

  // Assemble final PDF definition
  const pdfDefinition: TDocumentDefinitions = {
    info: {
      title: `${title} API Documentation`,
      author: 'Swagger PDF Generator',
      subject: 'API Documentation',
      creator: 'Node.js pdfmake'
    },
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    header: {
      text: `${title} API Documentation`,
      style: ['small', 'muted'],
      alignment: 'center',
      margin: [0, 20, 0, 0]
    },
    
    footer: function(currentPage: number, pageCount: number) {
      return {
        text: `${title} API Documentation Page ${currentPage} of ${pageCount}`,
        style: ['small', 'muted'],
        alignment: 'center',
        margin: [0, 0, 0, 20]
      };
    },

    content: [
      // Title page
      {
        text: `${title} Version ${version}`,
        style: ['title'],
        margin: [0, 100, 0, 100]
      },
      
      // Page break
      { text: '', pageBreak: 'after' },
      
      // Table of contents
      {
        toc: {
          title: { text: 'API List', style: ['h2'] }
        },
        margin: [0, 0, 0, 30]
      },
      
      // Page break
      { text: '', pageBreak: 'after' },
      
      // API detailed content
      ...generateApiSections()
    ],
    
    styles: pdfStyles,
    
    defaultStyle: {
      font: 'NotoSansTC',
      fontSize: 11,
      lineHeight: 1.4
    }
  };

  return pdfDefinition;
}