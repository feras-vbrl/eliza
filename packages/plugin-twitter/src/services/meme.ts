import { IAgentRuntime, generateImage, elizaLogger } from "@elizaos/core";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import path from "path";
import crypto from "crypto";
import { google } from "googleapis";

/**
 * Configuration options for meme generation
 */
interface MemeGenerationOptions {
    width?: number;
    height?: number;
    modelId?: string;
}

/**
 * Service for generating and managing meme images
 */
export class MemeGenerationService {
    private readonly storageDir: string;
    private readonly runtime: IAgentRuntime;
    private drive;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
        this.storageDir = path.join(process.cwd(), "memes");

        // Initialize Google Drive client if credentials are available
        const driveCredentials = this.runtime.getSetting("GOOGLE_DRIVE_CREDENTIALS");
        if (driveCredentials) {
            try {
                const credentials = JSON.parse(driveCredentials);
                const auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/drive.file'],
                });
                this.drive = google.drive({ version: 'v3', auth });
            } catch (error) {
                elizaLogger.error("Failed to initialize Google Drive:", error);
            }
        }
    }

    /**
     * Initialize the meme storage directory
     */
    private async initStorage(): Promise<void> {
        try {
            await fs.mkdir(this.storageDir, { recursive: true });
        } catch (error) {
            elizaLogger.error("Failed to create meme storage directory:", error);
            throw new Error("Failed to initialize meme storage");
        }
    }

    /**
     * Generate a unique filename for a meme
     */
    private generateFilename(): string {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `meme-${timestamp}-${random}`;
    }

    /**
     * Upload file to Google Drive
     */
    private async uploadToGoogleDrive(filepath: string, description: string): Promise<string | null> {
        if (!this.drive) {
            elizaLogger.warn("Google Drive not initialized, skipping upload");
            return null;
        }

        const folderId = this.runtime.getSetting("GOOGLE_DRIVE_FOLDER_ID");
        if (!folderId) {
            elizaLogger.warn("Google Drive folder ID not set, skipping upload");
            return null;
        }

        try {
            // Upload the file
            const fileMetadata = {
                name: path.basename(filepath),
                parents: [folderId],
                description
            };

            const media = {
                mimeType: 'image/png',
                body: fsSync.createReadStream(filepath)
            };

            const file = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id,webViewLink'
            });

            // Make the file publicly readable
            await this.drive.permissions.create({
                fileId: file.data.id!,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });

            elizaLogger.info("File uploaded to Google Drive:", file.data.webViewLink);
            return file.data.webViewLink || null;
        } catch (error) {
            elizaLogger.error("Failed to upload to Google Drive:", error);
            return null;
        }
    }

    /**
     * Generate a meme image from a description
     */
    async generateMeme(
        description: string,
        options: MemeGenerationOptions = {}
    ): Promise<string> {
        await this.initStorage();

        const {
            width = 1024,
            height = 1024,
            modelId = "dall-e-3"
        } = options;

        try {
            // Generate image using DALL-E
            const result = await generateImage({
                prompt: description,
                width,
                height,
                modelId,
            }, this.runtime);

            if (!result.success || !result.data?.length) {
                throw new Error("Failed to generate meme image");
            }

            // Get the base64 image data
            const base64Data = result.data[0].replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(base64Data, "base64");

            // Save to file
            const filename = this.generateFilename();
            const filepath = path.join(this.storageDir, `${filename}.png`);
            await fs.writeFile(filepath, imageBuffer);

            // Try to upload to Google Drive
            const driveUrl = await this.uploadToGoogleDrive(filepath, description);
            if (driveUrl) {
                elizaLogger.info("Meme uploaded to Google Drive:", driveUrl);
            }

            elizaLogger.info("Generated meme saved to:", filepath);
            return filepath;
        } catch (error) {
            elizaLogger.error("Error generating meme:", error);
            throw new Error("Failed to generate meme");
        }
    }

    /**
     * Clean up old meme files
     * @param maxAge Maximum age in milliseconds (default: 24 hours)
     */
    async cleanup(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
        try {
            const files = await fs.readdir(this.storageDir);
            const now = Date.now();

            for (const file of files) {
                const filepath = path.join(this.storageDir, file);
                const stats = await fs.stat(filepath);

                if (now - stats.mtimeMs > maxAge) {
                    await fs.unlink(filepath);
                    elizaLogger.info("Cleaned up old meme:", filepath);
                }
            }
        } catch (error) {
            elizaLogger.error("Error cleaning up memes:", error);
        }
    }

    /**
     * Delete a specific meme file
     */
    async deleteMeme(filepath: string): Promise<void> {
        try {
            await fs.unlink(filepath);
            elizaLogger.info("Deleted meme:", filepath);
        } catch (error) {
            elizaLogger.error("Error deleting meme:", error);
        }
    }
}