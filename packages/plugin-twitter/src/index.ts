import { Plugin } from "@elizaos/core";
import { postAction } from "./actions/post";
import { postMemeAction } from "./actions/post-meme";
import { MemeService } from "./providers/meme";

/**
 * Twitter integration plugin for posting tweets and memes
 */
export const twitterPlugin: Plugin = {
    name: "twitter",
    description: "Twitter integration plugin for posting tweets and memes",
    actions: [postAction, postMemeAction],
    evaluators: [],
    providers: [],
    services: [new MemeService()],
};

export default twitterPlugin;
