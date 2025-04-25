# Use Node.js 22 as the base image
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and config files
COPY tsconfig.json ./
COPY index.d.ts ./
COPY src/ ./src/

# Build TypeScript code
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Set environment variables
ENV NODE_ENV=production

# Run the bot
CMD ["npm", "start"] 