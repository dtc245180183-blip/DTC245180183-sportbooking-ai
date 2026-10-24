# Build Stage
FROM node:20-slim AS build

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy application source code
COPY . .

# Build production distribution
RUN npm run build

# Production Stage: Serve with lightweight Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production build files to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Expose web application port
EXPOSE 5173

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
