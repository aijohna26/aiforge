#!/bin/bash

# Start Convex dev server with correct PATH
export PATH="/Users/dollarzv2/.nvm/versions/node/v20.19.5/bin:/opt/homebrew/bin:$PATH"

echo "Starting Convex dev server..."
npx convex dev
