# Twitter Plugin for ElizaOS

This plugin provides Twitter integration for ElizaOS, including tweet posting and meme generation capabilities.

## Features

- Post regular tweets
- Generate and post meme tweets using AI
- Media upload support
- Automatic cleanup of generated images

## Testing Meme Tweet Functionality

To test the meme tweet generation and posting:

1. Set up required environment variables:
```bash
export TWITTER_USERNAME="your_twitter_username"
export TWITTER_PASSWORD="your_twitter_password"
export TWITTER_EMAIL="your_twitter_email"
export OPENAI_API_KEY="your_openai_api_key"
```

2. Run the test:
```bash
npm run test:meme
```

The test will:
1. Initialize the meme generation service
2. Generate a test meme using DALL-E
3. Post the meme to Twitter with test text
4. Clean up generated images

## Development

### Building
```bash
npm run build
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run meme tweet test specifically
npm run test:meme
```

### Project Structure

- `src/actions/` - Tweet posting actions
- `src/services/` - Meme generation service
- `src/types/` - TypeScript types and schemas
- `src/test/` - Test files
- `scripts/` - Test and utility scripts

## Configuration

The plugin requires the following environment variables:

- `TWITTER_USERNAME` - Twitter account username
- `TWITTER_PASSWORD` - Twitter account password
- `TWITTER_EMAIL` - Twitter account email
- `TWITTER_2FA_SECRET` (optional) - Twitter 2FA secret if enabled
- `OPENAI_API_KEY` - OpenAI API key for DALL-E image generation

## Error Handling

The plugin includes comprehensive error handling for:
- Twitter API errors
- Image generation failures
- Media upload issues
- Authentication problems

Errors are logged with detailed information to help with debugging.
