#!/bin/bash
set -e

echo "Starting build process..."

# Install root dependencies and expo-cli
echo "Installing root dependencies..."
npm install
echo "Installing expo-cli..."
npm install -g expo-cli

# Build web client
echo "Building web client..."
npx expo export:web
echo "Web build output:"
ls -la web-build/

# Build server
echo "Building server..."
cd server
npm install
npm run build
echo "Server dist output:"
ls -la dist/

# Move web build to server dist
echo "Moving web build to server/dist/web-build..."
cd ..
mkdir -p server/dist/web-build
cp -r web-build/* server/dist/web-build/
echo "Final server/dist/web-build contents:"
ls -la server/dist/web-build/
