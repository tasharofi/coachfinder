FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy server source code
COPY src ./src

# Expose port
EXPOSE 3001

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
