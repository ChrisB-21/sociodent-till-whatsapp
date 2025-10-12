FROM node:20-slim

# Use /usr/src as root so relative imports that go up to /usr/src/* resolve correctly
WORKDIR /usr/src

# Copy the entire repository into the image (build with context=root)
COPY . .

# Install backend dependencies from backend/package.json
WORKDIR /usr/src/backend
# Install dependencies using the backend package.json (supports building with repo root context)
RUN npm --prefix /usr/src/backend ci --only=production --no-audit --no-fund || npm --prefix /usr/src/backend install --only=production --no-audit --no-fund

# Expose runtime port
ENV PORT=3001
EXPOSE 3001

# Run the backend server entry inside the container
WORKDIR /usr/src
# Run the backend server entry inside the container (backend/combined-server.js when built from repo root)
CMD ["node", "backend/combined-server.js"]
