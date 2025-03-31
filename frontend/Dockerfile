FROM reactnativecommunity/react-native-android:latest
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8081
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
CMD ["npx", "expo", "start", "--lan"]
