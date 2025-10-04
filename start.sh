#!/bin/bash
# Start script for Render deployment

# Set production environment
export NODE_ENV=production

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting StableBitcoin application on port $PORT"
npx http-server . -p $PORT -a 0.0.0.0 --cors -c-1
