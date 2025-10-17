# Base image
FROM node:20-bullseye-slim

# Install build dependencies (optional, only if your npm packages need compilation)
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Set working directory to backend
WORKDIR /usr/src/backend

# Copy only package files first (for caching)
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund || npm install --only=production --no-audit --no-fund

# Copy backend source code
COPY backend/. .

# Move to repo root within image to lay out shared folders
WORKDIR /usr/src

# Copy shared services used by backend route handlers
COPY services ./services

# Expose port
ENV PORT=3001
EXPOSE 3001

# Set working directory to root (optional)
WORKDIR /usr/src

# Run backend server
CMD ["node", "backend/combined-server.js"]
