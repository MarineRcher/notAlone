FROM node:14-alpine

# Set the working directory
WORKDIR /app

# Copy the project files
COPY . .

# Install dependencies
RUN npm install


# Expose the API port
EXPOSE 3000

# Start the API server
CMD ["npm", "start"]