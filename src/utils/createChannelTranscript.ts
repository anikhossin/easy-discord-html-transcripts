import { Client } from 'discord.js';
import { fetchChannelMessages } from './fetchChannelMessages';
import { generateTranscriptHTML, generateTranscriptFile } from './generateTranscript';

export interface CreateChannelTranscriptOptions {
  /**
   * Maximum number of messages to fetch. Use -1 for all messages.
   * @default -1
   */
  limit?: number;
  
  /**
   * Text to display in the footer of the transcript
   */
  footerText?: string;
  
  /**
   * Whether to remove email addresses from the transcript
   * @default false
   */
  removeEmails?: boolean;
  
  /**
   * Map of user ID -> role label. Displays as (Role) beside the author name/avatar.
   * @example { '123456789': 'Moderator', '987654321': 'Support' }
   */
  userRoles?: Record<string, string>;
  
  /**
   * Output file path. If provided, the transcript will be saved to this file.
   * If not provided, the HTML string will be returned.
   */
  outputPath?: string;
}

/**
 * Creates a transcript HTML file or string from a Discord channel
 * 
 * @param client - Discord.js client instance
 * @param channelId - The ID of the channel to create a transcript from
 * @param options - Options for transcript generation
 * @returns Promise resolving to HTML string if outputPath is not provided, or void if outputPath is provided
 * 
 * @example
 * ```typescript
 * // Generate HTML string
 * const html = await createChannelTranscript(client, '1234567890', {
 *   footerText: 'Powered by Easy System',
 *   removeEmails: true,
 * });
 * 
 * // Save to file
 * await createChannelTranscript(client, '1234567890', {
 *   outputPath: './transcript.html',
 *   footerText: 'Powered by Easy System',
 * });
 * ```
 */
export async function createChannelTranscript(
  client: Client,
  channelId: string,
  options: CreateChannelTranscriptOptions & { outputPath: string }
): Promise<void>;
export async function createChannelTranscript(
  client: Client,
  channelId: string,
  options?: CreateChannelTranscriptOptions
): Promise<string>;
export async function createChannelTranscript(
  client: Client,
  channelId: string,
  options: CreateChannelTranscriptOptions = {}
): Promise<string | void> {
  const { limit = -1, footerText, removeEmails = false, userRoles, outputPath } = options;

  // Fetch messages from channel
  const { messages, channelName } = await fetchChannelMessages(
    client,
    channelId,
    limit
  );

  // Generate transcript
  if (outputPath) {
    await generateTranscriptFile(messages, channelName, outputPath, {
      footerText,
      removeEmails,
      userRoles,
    });
    return;
  } else {
    const html = await generateTranscriptHTML(messages, channelName, {
      footerText,
      removeEmails,
      userRoles,
    });
    return html;
  }
}
