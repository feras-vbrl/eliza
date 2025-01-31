import { State } from "@elizaos/core";

/**
 * Template for generating meme tweets
 */
export const memeTweetTemplate = ({ state }: { state: State }): string => {
    const recentMessages = state.recentMessagesData || [];
    const lastMessage = recentMessages[recentMessages.length - 1];

    return `You are a creative meme generator. Generate a tweet with an accompanying meme based on the following context:

${lastMessage?.content?.text || ""}

Please provide your response in the following format:

TWEET TEXT:
(Write a witty tweet text that works with the meme, max 280 characters)

MEME DESCRIPTION:
(Provide a detailed description for generating the meme image. Be specific about the visual elements, style, and humor)

Make the meme humorous and engaging while staying appropriate for a general audience.

Example response:

TWEET TEXT:
When your code finally works but you don't know why... 🤔 #coding #programming

MEME DESCRIPTION:
Split image meme: Top panel shows a confused programmer staring at working code with question marks floating around. Bottom panel shows the same programmer shrugging with a slight smile, surrounded by celebratory confetti. Bright, colorful style with exaggerated expressions.

Generate a meme tweet now:`;
};