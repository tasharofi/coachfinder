FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Force cache bust for source changes
ARG CACHEBUST=1

# Copy server source code
COPY src ./src

# Expose port
EXPOSE 3001

# Push schema to DB then start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/index.js"]
