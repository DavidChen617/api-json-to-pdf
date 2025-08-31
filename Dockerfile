# Multi-stage build for smaller final image
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10.15.0

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY src/ ./src/

# Build the project
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10.15.0

# Copy package files and install only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod && pnpm store prune

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy fonts (essential for PDF generation with Chinese support)
COPY src/fonts ./src/fonts

# Create directories for input/output files
RUN mkdir -p /app/input /app/output

# Set proper permissions
RUN chown -R node:node /app
USER node

# Set working directory for volumes
VOLUME ["/app/input", "/app/output"]

# Default entry point using node directly
ENTRYPOINT ["node", "dist/index.js"]