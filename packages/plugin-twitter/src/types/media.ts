import { z } from "zod";

/**
 * Supported media types for tweets
 */
export const MediaType = {
    MEME: "meme",
} as const;

/**
 * Media type enum for zod schema
 */
export const MediaTypeEnum = z.enum([MediaType.MEME]);

/**
 * Base interface for media content
 */
export interface BaseMediaContent {
    type: typeof MediaType[keyof typeof MediaType];
    path?: string;
}

/**
 * Interface for meme-specific media content
 */
export interface MemeMediaContent extends BaseMediaContent {
    type: typeof MediaType.MEME;
    description: string;
}

/**
 * Type guard to check if content is meme media
 */
export const isMemeMediaContent = (content: BaseMediaContent): content is MemeMediaContent => {
    return content.type === MediaType.MEME && 'description' in content;
};

/**
 * Schema for meme media content
 */
export const MemeMediaSchema = z.object({
    type: z.literal(MediaType.MEME),
    description: z.string().describe("Description for generating the meme image"),
    path: z.string().optional().describe("Local path to the generated meme image")
});

/**
 * Union type for all media content types
 */
export type MediaContent = MemeMediaContent;

/**
 * Schema for media content (currently only memes, but extensible)
 */
export const MediaSchema = MemeMediaSchema;