FROM reactnativecommunity/react-native-android:latest

# Set the working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose the development server port
EXPOSE 8081

# Start the development server
CMD ["npx", "expo", "start"]