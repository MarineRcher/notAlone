FROM node:14-alpine

# Set the working directory
WORKDIR .

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose the API port
EXPOSE 3000

# Start the API server
CMD ["npm", "start"]