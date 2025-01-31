import { Service, ServiceType, IAgentRuntime } from "@elizaos/core";
import { MemeGenerationService } from "../services/meme";

/**
 * Custom service type for meme generation
 */
export const MEME_GENERATION_SERVICE = "meme_generation" as ServiceType;

/**
 * Service class for meme generation
 */
export class MemeService extends Service {
    private service: MemeGenerationService | null = null;

    static get serviceType(): ServiceType {
        return MEME_GENERATION_SERVICE;
    }

    /**
     * Initialize the meme generation service
     */
    async initialize(runtime: IAgentRuntime): Promise<void> {
        this.service = new MemeGenerationService(runtime);

        // Register cleanup on process exit
        process.on('exit', async () => {
            if (this.service) {
                await this.service.cleanup();
            }
        });
    }

    /**
     * Get the meme generation service instance
     */
    getMemeService(): MemeGenerationService {
        if (!this.service) {
            throw new Error("Meme generation service not initialized");
        }
        return this.service;
    }
}

/**
 * Helper to get the meme generation service from runtime
 */
export const getMemeService = (runtime: IAgentRuntime): MemeGenerationService => {
    const service = runtime.getService<MemeService>(MEME_GENERATION_SERVICE);
    if (!service) {
        throw new Error("Meme generation service not initialized");
    }
    return service.getMemeService();
};