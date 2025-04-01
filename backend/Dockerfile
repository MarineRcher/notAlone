FROM node:14-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy the rest of the project files
COPY . .

# Expose the API port
EXPOSE 3000

# Use nodemon for development
CMD ["npm", "run", "dev"]