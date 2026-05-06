FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY server/prisma ./prisma
RUN npx prisma generate

# Copy server source
COPY server/src ./src

# Expose port
EXPOSE 3001

# Run migrations then start
CMD npx prisma migrate deploy && node src/index.js
