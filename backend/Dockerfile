# Base image
FROM node:20-slim

# Install build dependencies (optional, only if your npm packages need compilation)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Set working directory to backend
WORKDIR /usr/src/backend

<<<<<<< HEAD
# Expose runtime port
ENV PORT=3000
EXPOSE 3000
=======
# Copy only package files first (for caching)
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund || npm install --only=production --no-audit --no-fund

# Copy backend source code
COPY backend/. .

# Expose port
ENV PORT=3001
EXPOSE 3001
>>>>>>> ae0061e (chore(dev): add ngrok tunnel helpers and npm scripts; update backend Dockerfile and server config; add deployment scripts)

# Set working directory to root (optional)
WORKDIR /usr/src

# Run backend server
CMD ["node", "backend/combined-server.js"]
