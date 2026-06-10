FROM node:20-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "src/server.js"]
