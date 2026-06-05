FROM node:18-alpine

# Install OpenSSL — required by Prisma engines
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Push schema to DB then start server
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
