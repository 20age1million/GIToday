// src/scheduler/messenger.ts
// A small Messenger helper to proactively send messages to a channel.
// - Fetches channel by id and verifies it's sendable
// - Splits long content into 2000-char chunks (Discord hard limit)
// - Optional basic rate limiting between chunks to avoid burst sends
// - Optionally suppress @mentions by default
//
// References:
//  - Discord Message resource: content up to 2000 characters
//    https://discord.com/developers/docs/resources/message
//  - Discord rate limits overview
//    https://discord.com/developers/docs/topics/rate-limits

import type { Client, MessageCreateOptions, MessagePayload } from "discord.js";
import { ChannelType, type SendableChannels } from "discord.js";

export class Messenger {
  private readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  /** Resolve a channelId to a sendable text-based channel */
  private async resolveSendableChannel(channelId: string): Promise<SendableChannels> {
    const ch = await this.client.channels.fetch(channelId);
    if (!ch) throw new Error(`Channel ${channelId} not found`);

    // Must be text-based
    if (!("isTextBased" in ch) || !ch.isTextBased()) {
      throw new Error(`Channel ${channelId} is not text-based (type=${(ch as any).type})`);
    }
    // Must be sendable (narrows to SendableChannels)
    if (!("isSendable" in ch) || !ch.isSendable()) {
      throw new Error(`Channel ${channelId} is not sendable (type=${(ch as any).type})`);
    }
    return ch;
  }

  /**
   * Send content to a channelId. If content exceeds 2000 chars, it's split into chunks.
   * You can pass a partial MessageCreateOptions for the first chunk; subsequent chunks carry over
   * only "allowedMentions" to keep intent simple.
   */
  async send(
    channelId: string,
    content: string,
    options?: MessageCreateOptions | MessagePayload
  ) {
    const channel = await this.resolveSendableChannel(channelId);

    const chunks = splitIntoDiscordChunks(content);
    const firstOptions = normalizeOptions(options, true);

    const firstContent: string = chunks[0];
    const firstPayload: MessageCreateOptions = { ...firstOptions, content: firstContent };
    const first = await channel.send(firstPayload);

    // If only one chunk, we're done
    if (chunks.length === 1) return [first];

    // Subsequent chunks: keep allowedMentions behavior consistent
    const restResults = [] as any[];
    for (let i = 1; i < chunks.length; i++) {
      const chunkContent: string = chunks[i]!;
      const am = firstOptions.allowedMentions;
      const payload: MessageCreateOptions = am
        ? { content: chunkContent, allowedMentions: am }
        : { content: chunkContent };
      const msg = await channel.send(payload);
      restResults.push(msg);
    }
    return [first, ...restResults];
  }

  /** Convenience: send multiple blocks as separate messages (each block split again if needed). */
  async sendBlocks(channelId: string, blocks: string[], options?: MessageCreateOptions | MessagePayload) {
    const out: any[] = [];
    for (const block of blocks) {
      const res = await this.send(channelId, block, options);
      out.push(...res);
    }
    return out;
  }
}

/** Split a long string into <=2000 char chunks, preferring line breaks. */
export function splitIntoDiscordChunks(text: string, limit = 2000): [string, ...string[]] {
  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    let idx = remaining.lastIndexOf("\n", limit);
    if (idx <= 0) idx = remaining.lastIndexOf(" ", limit);
    if (idx <= 0) idx = limit; // hard split if no good boundary

    parts.push(remaining.slice(0, idx));
    remaining = remaining.slice(idx);
    if (remaining.startsWith("\n")) remaining = remaining.slice(1);
    if (remaining.startsWith(" ")) remaining = remaining.slice(1);
  }

  // Always push the final remainder so the array is non-empty
  parts.push(remaining);
  return parts as [string, ...string[]];
}

function normalizeOptions(
  opts: MessageCreateOptions | MessagePayload | undefined,
  suppressMentions = true
): Omit<MessageCreateOptions, "content"> {
  let base: MessageCreateOptions = {} as MessageCreateOptions;

  if (opts) {
    // If it's a MessagePayload, prefer toJSON(); else assume MessageCreateOptions
    const raw = ("toJSON" in (opts as any) ? (opts as any).toJSON?.() ?? {} : opts) as MessageCreateOptions;
    base = { ...raw };
  }

  // Remove undefined content to satisfy exactOptionalPropertyTypes
  if (Object.prototype.hasOwnProperty.call(base, "content") && (base as any).content === undefined) {
    delete (base as any).content;
  }

  // Build an options object without 'content'
  const out: Omit<MessageCreateOptions, "content"> = { ...(base as any) };
  delete (out as any).content;

  if (suppressMentions) {
    if (!out.allowedMentions) out.allowedMentions = { parse: [] };
  }
  return out;
}
