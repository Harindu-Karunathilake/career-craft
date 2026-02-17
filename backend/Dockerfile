# Use Node.js LTS (20) on Debian Slim for easier Java installation
FROM node:20-slim

# Install OpenJDK 17 (required for Firebase Emulators)
RUN apt-get update && \
    apt-get install -y openjdk-17-jre-headless ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Firebase CLI globally
RUN npm install -g firebase-tools

WORKDIR /app

# Copy package files
COPY package.json ./
COPY functions/package.json ./functions/

# Install dependencies
# We need to install dependencies in the root (if any) and in functions/
RUN npm install
# Install functions dependencies
WORKDIR /app/functions
RUN npm install

# Return to app root
WORKDIR /app

# Copy the rest of the code
COPY . .

# Expose Emulator Ports
# 4000: Emulator Suite UI
# 5001: Cloud Functions
# 8081: Firestore
# 9099: Auth
EXPOSE 4000 5001 8081 9099

# Environment variables for emulators
ENV FIREBASE_PROJECT_ID=career-craft-ac840

# Start command
# We use the script we added to package.json which runs "firebase emulators:start"
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
