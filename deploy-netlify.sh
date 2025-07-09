#!/bin/bash

# SocioDent Netlify Deployment Script
echo "🚀 Deploying SocioDent to Netlify..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found after build."
    exit 1
fi

echo "📁 Build output ready in ./dist"
echo ""
echo "🎉 Your SocioDent app is ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Go to https://netlify.com"
echo "2. Drag the ./dist folder to the deploy area"
echo "3. Your site will be live in seconds!"
echo ""
echo "Or use Netlify CLI:"
echo "  npm install -g netlify-cli"
echo "  netlify login"
echo "  netlify deploy --dir=dist --prod"
echo ""
echo "🌐 Your SocioDent dental care platform will be live worldwide! 🦷"
