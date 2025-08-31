# Swagger PDF Generator

A powerful tool to generate professional PDF documentation from Swagger 2.0 and OpenAPI 3.0 specifications with Chinese font support.

## Features

- ✅ **Multi-format Support**: Swagger 2.0 and OpenAPI 3.0+ specifications
- ✅ **Chinese Font Support**: Built-in NotoSansTC and Roboto fonts for international documentation
- ✅ **API Filtering**: Filter APIs by paths, tags, methods with flexible configuration
- ✅ **Docker Ready**: Containerized for easy deployment and usage
- ✅ **Type Safety**: Full TypeScript implementation with strict type checking
- ✅ **Clean Architecture**: Modular design with extensible parser system

## Quick Start

### Using Docker (Recommended)

Pull and run directly from Docker Hub:

```bash
# Basic usage
docker run --rm -v "/path/to/your/share:/app/share" \
  davidchen617/swagger-pdf-generator:v1 \
  /app/share/your-api-spec.json \
  --output /app/share/api-documentation.pdf

# With API filtering
docker run --rm -v "/path/to/your/share:/app/share" \
  davidchen617/swagger-pdf-generator:v1 \
  /app/share/your-api-spec.json \
  --output /app/share/filtered-doc.pdf \
  --from-literal="/api/users,/api/orders"
```

### Local Development

```bash
# Install dependencies
pnpm install

# Generate PDF from API specification
pnpm run generate your-api-spec.json --output documentation.pdf

# Development mode with auto-reload
pnpm run dev your-api-spec.json --output documentation.pdf
```

## Usage

### Command Line Options

```bash
# Basic syntax
node dist/index.js <input-file> [options]

# Options:
--output <file>          # Output PDF file path
--from-json <file>       # Filter config from JSON file
--from-literal <paths>   # Filter by comma-separated API paths
```

### API Filtering

#### Using Literal Paths

```bash
pnpm run generate api-spec.json --output filtered.pdf \
  --from-literal="/api/users/create,/api/users/list,/api/orders/*"
```

#### Using JSON Configuration

Create a filter configuration file:

```json
{
  "include": {
    "pathPatterns": [
      "/api/users/*",
      "/api/orders/create",
      "/api/products/list"
    ],
    "tags": [
      "Users",
      "Orders"
    ],
    "methods": [
      "POST",
      "GET"
    ]
  },
  "exclude": {
    "pathPatterns": [
      "*/internal/*",
      "*/debug/*"
    ]
  },
  "options": {
    "strictMatch": false,
    "caseSensitive": false,
    "onNoMatch": "warn"
  }
}
```

Then use it:

```bash
pnpm run generate api-spec.json --output filtered.pdf --from-json filter-config.json
```

## Docker Usage

### Building Local Image

```bash
# Build the Docker image
docker build -t swagger-pdf-generator .

# Run with your API specification
docker run --rm -v "/path/to/your/files:/app/share" \
  swagger-pdf-generator \
  /app/share/api-spec.json \
  --output /app/share/documentation.pdf
```

### Using Pre-built Image

```bash
# Pull from Docker Hub
docker pull davidchen617/swagger-pdf-generator:v1

# Basic usage
docker run --rm -v "$(pwd):/app/share" \
  davidchen617/swagger-pdf-generator:v1 \
  /app/share/swagger.json \
  --output /app/share/api-doc.pdf

# With filtering
docker run --rm -v "$(pwd):/app/share" \
  davidchen617/swagger-pdf-generator:v1 \
  /app/share/openapi.json \
  --output /app/share/filtered-doc.pdf \
  --from-json /app/share/filter.json
```

## Project Structure

```
├── src/
│   ├── adapters/          # Legacy format adapters
│   ├── filters/           # API filtering system
│   ├── parsers/           # Specification parsers
│   │   ├── parser-factory.ts
│   │   └── swagger-v2-parser.ts
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Utilities and constants
│   ├── fonts/             # Font files (NotoSansTC, Roboto)
│   ├── index.ts           # Main entry point
│   ├── pdf-generator.ts   # PDF generation logic
│   └── universal-parser.ts # Universal parser interface
├── Dockerfile             # Docker container definition
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

## Architecture

### Parser System

- **Parser Factory**: Auto-detects API specification version
- **Swagger v2 Parser**: Handles Swagger 2.0 specifications
- **OpenAPI v3 Parser**: Future support for OpenAPI 3.0+ features
- **Legacy Adapter**: Maintains backward compatibility

### Filter System

- **Path Patterns**: Wildcard matching for API paths
- **Tag Filtering**: Include/exclude by Swagger tags
- **Method Filtering**: Filter by HTTP methods
- **Flexible Configuration**: JSON-based filter definitions

## Development

### Prerequisites

- Node.js 20+
- pnpm 10.15.0+
- Docker (optional)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd swagger-pdf-generator

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm run generate swagger.json --output test.pdf
```

### Scripts

- `pnpm run dev` - Development mode with tsx
- `pnpm run build` - Build TypeScript to JavaScript
- `pnpm run generate` - Generate PDF (development)
- `pnpm run generate:prod` - Generate PDF (production build)

## Font Support

The application includes fonts for international documentation:

- **NotoSansTC**: Traditional Chinese font support
- **Roboto**: Clean, modern English font

These fonts are automatically embedded in the Docker image and used for PDF generation.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the existing issues on GitHub
2. Create a new issue with detailed description
3. Include your API specification format and error logs

---

**Made with ❤️ for better API documentation**