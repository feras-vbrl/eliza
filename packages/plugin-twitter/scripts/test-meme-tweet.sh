#!/bin/bash

# Enable debug output
set -x

# Source the .env file from the project root
source ../../.env

# Print environment variables (without values for security)
echo "Checking environment variables..."
[ ! -z "$TWITTER_USERNAME" ] && echo "TWITTER_USERNAME is set"
[ ! -z "$TWITTER_PASSWORD" ] && echo "TWITTER_PASSWORD is set"
[ ! -z "$TWITTER_EMAIL" ] && echo "TWITTER_EMAIL is set"
[ ! -z "$OPENAI_API_KEY" ] && echo "OPENAI_API_KEY is set"

# Check for required environment variables
if [ -z "$TWITTER_USERNAME" ] || [ -z "$TWITTER_PASSWORD" ] || [ -z "$TWITTER_EMAIL" ] || [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: Missing required environment variables"
    echo "Required variables:"
    echo "- TWITTER_USERNAME"
    echo "- TWITTER_PASSWORD"
    echo "- TWITTER_EMAIL"
    echo "- OPENAI_API_KEY"
    exit 1
fi

# Build the TypeScript files
echo "Building TypeScript files..."
pnpm build

# Run the test with Node debugging enabled
echo "Running meme tweet test..."
NODE_DEBUG=* node --trace-warnings dist/test/meme-tweet.test.js

# Check the exit code
if [ $? -eq 0 ]; then
    echo "Test completed successfully!"
else
    echo "Test failed!"
    exit 1
fi