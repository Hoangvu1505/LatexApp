# Stage 1: Build Frontend
FROM node:20-bullseye-slim AS builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server with Tectonic Engine
FROM node:20-bullseye-slim
WORKDIR /app

# Install system libraries and Tectonic binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    fontconfig \
    libfontconfig1 \
    libgraphite2-3 \
    libharfbuzz0b \
    && curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh \
    && mv tectonic /usr/local/bin/ \
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

