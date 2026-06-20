# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for modern package manager support if needed
RUN corepack enable

COPY package*.json ./
RUN npm ci

COPY . .

# Build Vite frontend and esbuild backend
RUN npm run build

# Production Environment
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install only production dependencies
RUN npm ci --omit=dev

# Expose port
EXPOSE 3000

# Start compiled server
CMD ["npm", "run", "start"]
