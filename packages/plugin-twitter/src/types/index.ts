import { z } from "zod";
import { MediaSchema, MediaContent } from "./media";

/**
 * Interface for tweet content including optional media
 */
export interface TweetContent {
    text: string;
    media?: MediaContent;
}

/**
 * Schema for tweet content with media support
 */
export const TweetSchema = z.object({
    text: z.string().describe("The text of the tweet"),
    media: MediaSchema.optional().describe("Optional media content for the tweet")
});

/**
 * Type guard to check if an object matches the TweetContent interface
 */
export const isTweetContent = (obj: any): obj is TweetContent => {
    return TweetSchema.safeParse(obj).success;
};

// Re-export media types
export * from "./media";