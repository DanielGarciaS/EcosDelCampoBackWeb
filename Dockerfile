# Build Stage
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /usr/src/app/backend
RUN npm ci --only=production

# Copy app source
COPY backend .

# Expose port
EXPOSE 3000

# Start command
CMD [ "node", "index.js" ]
