@echo off
setlocal

REM Check for required environment variables
if "%TWITTER_USERNAME%"=="" (
    echo Error: TWITTER_USERNAME environment variable is not set
    exit /b 1
)
if "%TWITTER_PASSWORD%"=="" (
    echo Error: TWITTER_PASSWORD environment variable is not set
    exit /b 1
)
if "%TWITTER_EMAIL%"=="" (
    echo Error: TWITTER_EMAIL environment variable is not set
    exit /b 1
)
if "%OPENAI_API_KEY%"=="" (
    echo Error: OPENAI_API_KEY environment variable is not set
    exit /b 1
)

REM Build the TypeScript files
echo Building TypeScript files...
call pnpm build

REM Run the test
echo Running meme tweet test...
node dist/test/meme-tweet.test.js

REM Check the exit code
if %ERRORLEVEL% EQU 0 (
    echo Test completed successfully!
) else (
    echo Test failed!
    exit /b 1
)