FROM node:20-alpine

WORKDIR /app

# Cài dependencies
COPY package*.json ./
RUN npm ci

# Copy prisma schema và generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source và build
COPY . .
RUN npm run build

EXPOSE 3000

# Migrate rồi mới start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
