FROM reactnativecommunity/react-native-android:latest

# Set the working directory
WORKDIR .

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

RUN npm install @react-native/metro-config

# Copy the rest of the project files
COPY . .

# Expose the development server port
EXPOSE 8081

# Start the development server
CMD ["npx", "react-native", "start", "--host", "0.0.0.0"]