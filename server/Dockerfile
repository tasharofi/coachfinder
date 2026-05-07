FROM node:20-alpine

WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies for prisma CLI)
COPY package.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy server source code
COPY src ./src

# Expose port
EXPOSE 3001

# Start script: push schema then start server, with error logging
CMD ["sh", "-c", "echo '=== Starting CoachFinder ===' && echo \"DATABASE_URL present: $(if [ -n \"$DATABASE_URL\" ]; then echo YES; else echo NO; fi)\" && echo '--- Running prisma db push ---' && npx prisma db push --skip-generate 2>&1 && echo '--- Starting Node server ---' && node src/index.js"]
