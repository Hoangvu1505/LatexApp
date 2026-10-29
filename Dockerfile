# Stage 1: Build Frontend
FROM node:20-bookworm-slim AS builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server with Tectonic Engine
FROM node:20-bookworm-slim
WORKDIR /app

# Install curl, ca-certificates, tar, fontconfig, and official standalone Tectonic binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    tar \
    fontconfig \
    && curl -fsSL -L "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-musl.tar.gz" | tar -xz -C /usr/local/bin \
    && chmod +x /usr/local/bin/tectonic \
    && tectonic --version \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production

# Copy backend code
COPY server/ ./

# Copy built static frontend
COPY --from=builder /app/client/dist /app/client/dist

# Ensure projects folder exists
RUN mkdir -p /app/projects

ENV PORT=3001
ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "index.js"]
