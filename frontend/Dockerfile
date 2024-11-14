FROM reactnativecommunity/react-native-android:latest

# Set the working directory
WORKDIR /app

# Copy the project files
COPY . .

# Install dependencies
RUN npm install

# Expose the development server port
EXPOSE 8081

# Start the development server
CMD ["npx", "react-native", "start"]