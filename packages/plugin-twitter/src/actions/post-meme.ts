import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    composeContext,
    elizaLogger,
    ModelClass,
    generateText,
} from "@elizaos/core";
import { memeTweetTemplate } from "../templates/meme";
import { getMemeService } from "../providers/meme";
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Parse the generated content into tweet text and meme description
 */
function parseGeneratedContent(content: string): { text: string; description: string } | null {
    try {
        const tweetMatch = content.match(/TWEET TEXT:\s*([^\n]+)/);
        const descriptionMatch = content.match(/MEME DESCRIPTION:\s*([\s\S]+?)(?=\n\n|$)/);

        if (!tweetMatch || !descriptionMatch) {
            elizaLogger.error("Failed to parse generated content:", content);
            return null;
        }

        return {
            text: tweetMatch[1].trim(),
            description: descriptionMatch[1].trim()
        };
    } catch (error) {
        elizaLogger.error("Error parsing generated content:", error);
        return null;
    }
}

/**
 * Generate tweet content with meme description
 */
async function composeMemeContent(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
): Promise<{ text: string; description: string }> {
    try {
        const context = composeContext({
            state,
            template: memeTweetTemplate,
        });

        elizaLogger.log("Generating text...");
        const generatedContent = await generateText({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
            stop: ["Generate a meme tweet now:"],
        });

        const parsedContent = parseGeneratedContent(generatedContent);
        if (!parsedContent) {
            throw new Error("Failed to generate valid meme tweet content");
        }

        elizaLogger.log("Generated meme tweet content:", parsedContent.text);
        elizaLogger.log("Generated meme description:", parsedContent.description);

        return parsedContent;
    } catch (error) {
        elizaLogger.error("Error composing meme tweet:", error);
        throw error;
    }
}

/**
 * Generate filename based on current date and hour
 */
function generateFilename(): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = now.getHours().toString().padStart(2, '0');
    return `${date}_${hour}`;
}

/**
 * Save content to files
 */
async function saveContent(
    text: string,
    imagePath: string,
    baseName: string
): Promise<void> {
    elizaLogger.log("Saving content to files...");

    // Create output directory if it doesn't exist
    const outputDir = join(process.cwd(), 'memes');

    // Save text file
    const textPath = join(outputDir, `${baseName}.txt`);
    writeFileSync(textPath, text);
    elizaLogger.log("Saved text file:", textPath);

    // Copy image file
    const newImagePath = join(outputDir, `${baseName}.png`);
    writeFileSync(newImagePath, imagePath);
    elizaLogger.log("Saved image file:", newImagePath);
}

/**
 * Post a meme with text and image to files
 */
export const postMemeAction: Action = {
    name: "POST_MEME_TWEET",
    similes: ["TWEET_MEME", "POST_MEME", "SEND_MEME_TWEET"],
    description: "Generate a meme with text and image and save to files",
    validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        return true; // Always valid since we're just saving files
    },
    handler: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
        try {
            // Generate tweet content and meme description
            const { text, description } = await composeMemeContent(runtime, message, state);
            if (!text || !description) {
                elizaLogger.error("No content generated for meme");
                return false;
            }

            // Generate meme image
            const memeService = getMemeService(runtime);
            const imagePath = await memeService.generateMeme(description);

            // Generate filename based on current date and hour
            const baseName = generateFilename();

            try {
                // Save content to files
                await saveContent(text, imagePath, baseName);

                // Clean up the generated image
                await memeService.deleteMeme(imagePath);

                return true;
            } catch (error) {
                elizaLogger.error("Error during file operations:", {
                    message: error.message,
                    stack: error.stack,
                    cause: error.cause
                });
                return false;
            }
        } catch (error) {
            elizaLogger.error("Error in post meme action:", error);
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Create a meme about this" }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll create and save a meme about that!",
                    action: "POST_MEME_TWEET"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Make this into a funny meme" }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll generate a humorous meme and save it!",
                    action: "POST_MEME_TWEET"
                }
            }
        ]
    ]
};