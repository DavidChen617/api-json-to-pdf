import fs from "fs";
import path from "path";
import PdfPrinter from "pdfmake";
import { generatePdfDefinition } from "./pdf-generator";
import { Logger } from "./utils/logger";

import type { ParseArgsResult } from "./types";

// Parse command line arguments
function parseArgs(): ParseArgsResult {
  const args: string[] = process.argv.slice(2);
  
  let inputFile = "swagger.json";
  let outputFile = "";
  let filterFile: string | undefined;
  let filterType: 'none' | 'file' | 'literal' = 'none';
  let filterLiteral: string[] | undefined;
  
  // Parse arguments
  let positionalArgs: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--output')) {
      if (arg.includes('=')) {
        // --output=file.pdf
        outputFile = arg.split('=')[1];
      } else {
        // --output file.pdf
        outputFile = args[++i];
      }
    } else if (arg.startsWith('--from-json')) {
      if (arg.includes('=')) {
        // --from-json=path/to/config.json
        filterFile = arg.split('=')[1];
      } else {
        // --from-json path/to/config.json
        filterFile = args[++i];
      }
      filterType = 'file';
    } else if (arg.startsWith('--from-literal')) {
      if (arg.includes('=')) {
        // --from-literal=/api/xxx/aaa,/api/ccc/bbb
        const literalValue = arg.split('=')[1];
        filterLiteral = literalValue.split(',').map(path => path.trim());
      } else {
        // --from-literal /api/xxx/aaa,/api/ccc/bbb
        const literalValue = args[++i];
        filterLiteral = literalValue.split(',').map(path => path.trim());
      }
      filterType = 'literal';
    } else if (!arg.startsWith('--')) {
      positionalArgs.push(arg);
    }
  }
  
  // Handle positional arguments: only allow first argument (input file)
  if (positionalArgs.length > 0) {
    inputFile = positionalArgs[0];
  }
  
  // Check for extra positional arguments
  if (positionalArgs.length > 1) {
    Logger.error('Error: Too many positional arguments provided');
    Logger.error(`Unexpected argument: "${positionalArgs[1]}"`);
    Logger.error('Did you mean to use --output instead?');
    Logger.error(`Correct usage: npx tsx src/index.ts ${positionalArgs[0]} --output ${positionalArgs[1]}`);
    process.exit(1);
  }
  
  return { inputFile, outputFile, filterFile, filterType, filterLiteral };
}

async function main(): Promise<void> {
  try {
    const args: string[] = process.argv.slice(2);
    
    // Check if at least one parameter is provided
    if (args.length === 0) {
      Logger.error('Error: Please provide at least one parameter (input JSON file)');
      Logger.info('Usage:');
      Logger.info('  npx tsx src/index.ts <input-file> [--output <output-file>]');
      Logger.info('  npx tsx src/index.ts <input-file> [--output <output-file>] --from-json <filter-file>');
      Logger.info('  npx tsx src/index.ts <input-file> [--output <output-file>] --from-literal=/api/path1,/api/path2');
      Logger.info('');
      Logger.info('Options:');
      Logger.info('  --output <file>          Output PDF file path');
      Logger.info('  --from-json <file>       Filter config from JSON file');
      Logger.info('  --from-literal <paths>   Filter by comma-separated API paths');
      process.exit(1);
    }
    
    const { inputFile, outputFile, filterFile, filterType, filterLiteral } = parseArgs();
    
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      Logger.error(`Error: Input file "${inputFile}" not found`);
      process.exit(1);
    }
    
    // 1. Setup fonts
    const fonts = {
      NotoSansTC: {
        normal: path.resolve("src/fonts/NotoSansTC-Regular.ttf"),
        bold: path.resolve("src/fonts/NotoSansTC-Medium.ttf"),
        italics: path.resolve("src/fonts/NotoSansTC-Regular.ttf"),
        bolditalics: path.resolve("src/fonts/NotoSansTC-Medium.ttf")
      },
      Roboto: {
        normal: path.resolve("src/fonts/Roboto-Regular.ttf"),
        bold: path.resolve("src/fonts/Roboto-Medium.ttf"),
        italics: path.resolve("src/fonts/Roboto-Regular.ttf"),
        bolditalics: path.resolve("src/fonts/Roboto-Medium.ttf")
      },
    };
    
    const printer = new PdfPrinter(fonts);
    
    // 2. Read and parse API specification
    Logger.info(`Reading API specification: ${inputFile}`);
    const swaggerContent: string = fs.readFileSync(path.resolve(inputFile), "utf8");
    const apiSpec: any = JSON.parse(swaggerContent);
    
    // 3. Determine output filename
    let finalOutputFile: string = outputFile;
    if (!finalOutputFile) {
      // Use project name as default output name
      const projectName: string = apiSpec.info?.title || "swagger-pdf-generator";
      // Clean special characters from filename
      const cleanName: string = projectName
        .replace(/[^\w\s.-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with dashes
        .toLowerCase();            // Convert to lowercase
      finalOutputFile = `${cleanName}.pdf`;
    }
    
    // Prepare filter configuration
    let filterInput: string | any = undefined;
    
    if (filterType === 'file' && filterFile) {
      filterInput = filterFile;
    } else if (filterType === 'literal' && filterLiteral) {
      // Dynamically create filter config from literal path list
      Logger.info(`Using --from-literal filter: ${filterLiteral.join(', ')}`);
      filterInput = {
        include: {
          pathPatterns: filterLiteral
        },
        options: {
          strictMatch: false,
          caseSensitive: false,
          onNoMatch: 'warn'
        }
      };
    }
    
    Logger.info(`Generating PDF definition...`);
    const docDefinition = await generatePdfDefinition(apiSpec, filterInput);
    
    // 4. Generate PDF
    Logger.info(`Creating PDF file: ${finalOutputFile}`);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(fs.createWriteStream(finalOutputFile));
    pdfDoc.end();
    
    Logger.success(`PDF generated successfully: ${finalOutputFile}`);
    
  } catch (error) {
    Logger.error('Error generating PDF:', error);
    process.exit(1);
  }
}

main();