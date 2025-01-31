import {
    IAgentRuntime,
    ModelClass,
    ModelProviderName,
    elizaLogger,
    UUID,
    Memory,
    Service,
    ServiceType,
    State,
    Provider,
    Action,
    Evaluator,
    Plugin,
    LoggingLevel,
    Character
} from "@elizaos/core";
import { MemeService, getMemeService, MEME_GENERATION_SERVICE } from "../providers/meme";
import { postMemeAction } from "../actions/post-meme";
import { twitterPlugin } from "../index";
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { readFileSync } from 'fs';
// Enable debug logging
process.env.DEBUG = '*';
process.env.VERBOSE = 'true';
process.env.NODE_DEBUG = '*';

// Mock Twitter API credentials for testing
process.env.TWITTER_API_KEY = 'test_api_key';
process.env.TWITTER_API_SECRET = 'test_api_secret';
process.env.TWITTER_ACCESS_TOKEN = 'test_access_token';
process.env.TWITTER_ACCESS_TOKEN_SECRET = 'test_access_token_secret';

console.log('Script starting...');

// Get the directory path using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    // Load environment variables from root .env file
    const envPath = resolve(__dirname, '../../../../.env');
    console.log('Loading .env file from:', envPath);
    const result = config({ path: envPath });

    if (result.error) {
        console.error('Error loading .env file:', result.error);
        process.exit(1);
    }

    console.log('Loaded .env file successfully');
} catch (error) {
    console.error('Error during .env loading:', error);
    process.exit(1);
}

// Load character configuration
let character: Character;
try {
    const characterPath = resolve(__dirname, '../../../../characters/kirby2.character.json');
    console.log('Loading character file from:', characterPath);
    const characterContent = readFileSync(characterPath, 'utf-8');
    character = JSON.parse(characterContent);
    console.log('Loaded character configuration successfully');
} catch (error) {
    console.error('Error loading character configuration:', error);
    process.exit(1);
}

// Generate a valid UUID
function generateUUID(): UUID {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }) as UUID;
}

// Print environment and configuration status
console.log('\nConfiguration check:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'set' : 'not set');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'set' : 'not set');
console.log('Character Twitter credentials:', character.settings?.secrets ? 'set' : 'not set');

if (!process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY || !character.settings?.secrets) {
    console.error('\nRequired configuration is missing!');
    process.exit(1);
}

// Print Twitter API credentials (without values)
const apiKey = process.env.TWITTER_API_KEY;
const apiSecret = process.env.TWITTER_API_SECRET;
const accessToken = process.env.TWITTER_ACCESS_TOKEN;
const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

console.log('\nTwitter API credentials check:');
console.log('TWITTER_API_KEY:', apiKey ? 'set' : 'not set');
console.log('TWITTER_API_SECRET:', apiSecret ? 'set' : 'not set');
console.log('TWITTER_ACCESS_TOKEN:', accessToken ? 'set' : 'not set');
console.log('TWITTER_ACCESS_TOKEN_SECRET:', accessTokenSecret ? 'set' : 'not set');

if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    console.error('\nTwitter API credentials are missing!');
    process.exit(1);
}

console.log('\nAll required configuration is set');

// Mock runtime for testing
const mockRuntime: IAgentRuntime = {
    agentId: generateUUID(),
    serverUrl: "http://localhost:3000",
    token: process.env.ANTHROPIC_API_KEY,
    modelProvider: ModelProviderName.ANTHROPIC,
    imageModelProvider: ModelProviderName.OPENAI,
    imageVisionModelProvider: ModelProviderName.OPENAI,
    character: {
        ...character,
        modelProvider: ModelProviderName.ANTHROPIC,
        imageModelProvider: ModelProviderName.OPENAI,
        settings: {
            ...character.settings,
            modelConfig: {
                ...character.settings?.modelConfig,
                temperature: 0.7,
                maxInputTokens: 4096,
                frequency_penalty: 0,
                presence_penalty: 0
            }
        }
    },
    // Required IAgentRuntime properties
    providers: [],
    actions: [],
    evaluators: [],
    plugins: [twitterPlugin],
    getSetting: (key: string) => {
        // First check character secrets
        if (character.settings?.secrets?.[key]) {
            return character.settings.secrets[key];
        }
        // Then check environment variables
        return process.env[key] || null;
    },
    services: new Map<ServiceType, Service>(),
    clients: {
        twitter: {
            client: {
                headers: {
                    'Authorization': `OAuth oauth_consumer_key="${process.env.TWITTER_API_KEY}"`
                }
            }
        }
    },
    databaseAdapter: null,
    messageManager: null,
    descriptionManager: null,
    documentsManager: null,
    knowledgeManager: null,
    ragKnowledgeManager: null,
    loreManager: null,
    cacheManager: null,
    verifiableInferenceAdapter: null,
    initialize: async () => {
        console.log('Initializing runtime...');
    },
    registerMemoryManager: () => {},
    getMemoryManager: () => null,
    getService: <T extends Service>(service: ServiceType): T | null => {
        console.log(`Getting service: ${service}`);
        return mockRuntime.services.get(service) as T || null;
    },
    registerService: (service: Service) => {
        console.log(`Registering service: ${service.serviceType}`);
        mockRuntime.services.set(service.serviceType, service);
    },
    getConversationLength: () => 0,
    processActions: async () => {},
    evaluate: async () => null,
    ensureParticipantExists: async () => {},
    ensureUserExists: async () => {},
    registerAction: (action: Action) => {
        console.log(`Registering action: ${action.name}`);
        mockRuntime.actions.push(action);
    },
    ensureConnection: async () => {},
    ensureParticipantInRoom: async () => {},
    ensureRoomExists: async () => {},
    composeState: async () => ({} as State),
    updateRecentMessageState: async (state: State) => state,
};

async function testMemeGeneration() {
    console.log('\nStarting meme generation test...');
    try {
        // Initialize meme service
        console.log('Initializing meme service...');
        const memeService = MemeService.getInstance();
        await memeService.initialize(mockRuntime);
        mockRuntime.registerService(memeService);

        // Register the post meme action
        console.log('Registering post meme action...');
        mockRuntime.registerAction(postMemeAction);

        // Test meme generation
        console.log('Generating meme...');
        const description = "A funny meme showing a confused programmer staring at working code with question marks floating around";
        const service = getMemeService(mockRuntime);
        const imagePath = await service.generateMeme(description);

        elizaLogger.info("Generated meme at:", imagePath);

        // Create a message about programming
        const recentMessage: Memory = {
            id: generateUUID(),
            content: {
                text: "Just spent hours debugging only to find out it was a missing semicolon 😅",
            },
            userId: generateUUID(),
            agentId: generateUUID(),
            roomId: generateUUID(),
            createdAt: Date.now() - 1000, // 1 second ago
        };

        // Test tweet posting with media
        console.log('Creating test message...');
        const message: Memory = {
            id: generateUUID(),
            content: {
                text: "Create a funny programming meme",
            },
            userId: recentMessage.userId,
            agentId: recentMessage.agentId,
            roomId: recentMessage.roomId,
            createdAt: Date.now(),
        };

        console.log('Creating test state...');
        const state: State = {
            userId: message.userId,
            agentId: message.agentId,
            roomId: message.roomId,
            bio: "Test bio",
            lore: "Test lore",
            messageDirections: "",
            postDirections: "",
            actors: "",
            recentMessages: "",
            recentMessagesData: [recentMessage]
        };

        // Validate action
        console.log('Validating post meme action...');
        const isValid = await postMemeAction.validate(mockRuntime, message, state);
        if (!isValid) {
            throw new Error("Post meme action validation failed");
        }

        // Post the tweet
        console.log('Posting meme tweet...');
        const result = await postMemeAction.handler(mockRuntime, message, state);

        if (result) {
            elizaLogger.info("Successfully posted meme tweet!");
        } else {
            elizaLogger.error("Failed to post meme tweet");
            throw new Error("Failed to post meme tweet");
        }

        // Clean up
        console.log('Cleaning up...');
        await service.cleanup(0); // Clean up all generated memes
    } catch (error) {
        console.error('Test failed with error:', error);
        elizaLogger.error("Test failed:", error);
        throw error;
    }
}

// Run the test
console.log('\nStarting test execution...');
testMemeGeneration()
    .then(() => {
        elizaLogger.info("Test completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        elizaLogger.error("Test failed:", error);
        process.exit(1);
    });