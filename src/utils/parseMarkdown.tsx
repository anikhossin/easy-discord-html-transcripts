import React from 'react';

let _keyCounter = 0;
function nextKey(prefix: string): string {
  return `${prefix}-${_keyCounter++}`;
}

/**
 * Format a Discord timestamp (<t:timestamp:format>) into human-readable text
 */
function formatDiscordTimestamp(unixSeconds: number, format: string): string {
  const date = new Date(unixSeconds * 1000);
  switch (format) {
    case 't': return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    case 'T': return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    case 'd': return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    case 'D': return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    case 'f': return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    case 'F': return `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    case 'R': {
      const now = Date.now();
      const diff = now - unixSeconds * 1000;
      const abs = Math.abs(diff);
      const suffix = diff > 0 ? 'ago' : 'from now';
      if (abs < 60000) return 'just now';
      if (abs < 3600000) return `${Math.floor(abs / 60000)} minutes ${suffix}`;
      if (abs < 86400000) return `${Math.floor(abs / 3600000)} hours ${suffix}`;
      return `${Math.floor(abs / 86400000)} days ${suffix}`;
    }
    default: return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
}

interface InlinePattern {
  regex: RegExp;
  render: (match: RegExpMatchArray) => React.ReactNode;
  /** If true, don't recursively parse the content */
  literal?: boolean;
}

/** Map of user ID -> username for displaying mentions. If not provided, only ID is shown. */
export type UserMap = Record<string, string>;

/**
 * Parse inline Discord formatting for a single segment of text (no code blocks, no blockquotes).
 * This is the core inline parser used recursively for nested formatting.
 */
function parseInlineSegment(text: string, userMap?: UserMap): React.ReactNode[] {
  if (!text) return [];

  const patterns: InlinePattern[] = [
    // Inline code (literal - no nested parsing)
    {
      regex: /`([^`]+)`/,
      render: (m) => <code key={nextKey('ic')} className="discord-inline-code">{m[1] ?? ''}</code>,
      literal: true,
    },
    // Masked links [text](url)
    {
      regex: /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/,
      render: (m) => (
        <a key={nextKey('ml')} href={m[2] ?? '#'} target="_blank" rel="noopener noreferrer" className="discord-link">{m[1] ?? ''}</a>
      ),
      literal: true,
    },
    // Custom animated emoji <a:name:id>
    {
      regex: /<a:(\w+):(\d+)>/,
      render: (m) => {
        const id = m[2] ?? '';
        if (!id) return <React.Fragment key={nextKey('ae')}>:{m[1] ?? ''}:</React.Fragment>;
        return (
          <img
            key={nextKey('ae')}
            src={`https://cdn.discordapp.com/emojis/${id}.gif?size=48&quality=lossless`}
            alt={`:${m[1] ?? ''}:`}
            title={`:${m[1] ?? ''}:`}
            className="discord-custom-emoji"
            draggable="false"
          />
        );
      },
      literal: true,
    },
    // Custom static emoji <:name:id>
    {
      regex: /<:(\w+):(\d+)>/,
      render: (m) => {
        const id = m[2] ?? '';
        if (!id) return <React.Fragment key={nextKey('ce')}>:{m[1] ?? ''}:</React.Fragment>;
        return (
          <img
            key={nextKey('ce')}
            src={`https://cdn.discordapp.com/emojis/${id}.webp?size=48&quality=lossless`}
            alt={`:${m[1] ?? ''}:`}
            title={`:${m[1] ?? ''}:`}
            className="discord-custom-emoji"
            draggable="false"
          />
        );
      },
      literal: true,
    },
    // Discord timestamp <t:unix:format>
    {
      regex: /<t:(\d+)(?::([tTdDfFR]))?>/,
      render: (m) => (
        <span key={nextKey('ts')} className="discord-timestamp">
          {formatDiscordTimestamp(parseInt(m[1] ?? '0'), m[2] ?? 'f')}
        </span>
      ),
      literal: true,
    },
    // User mention <@id> or <@!id> — display as <@{userId}> or <@username> when available
    {
      regex: /<@!?(\d+)>/,
      render: (m) => {
        const userId = m[1] ?? '';
        const display = userMap?.[userId] ?? userId;
        return (
          <span key={nextKey('um')} className="discord-mention" data-user-id={userId}>
            &lt;@{display}&gt;
          </span>
        );
      },
      literal: true,
    },
    // Channel mention <#id>
    {
      regex: /<#(\d+)>/,
      render: (m) => (
        <span key={nextKey('cm')} className="discord-mention discord-channel-mention" data-channel-id={m[1] ?? ''}>
          <span className="discord-mention-icon">#</span>channel
        </span>
      ),
      literal: true,
    },
    // Role mention <@&id>
    {
      regex: /<@&(\d+)>/,
      render: (m) => (
        <span key={nextKey('rm')} className="discord-mention discord-role-mention" data-role-id={m[1] ?? ''}>@role</span>
      ),
      literal: true,
    },
    // @everyone and @here
    {
      regex: /@(everyone|here)\b/,
      render: (m) => (
        <span key={nextKey('em')} className="discord-mention">@{m[1] ?? ''}</span>
      ),
      literal: true,
    },
    // URLs (not inside markdown link syntax)
    {
      regex: /(https?:\/\/[^\s<>\])"]+)/,
      render: (m) => (
        <a key={nextKey('url')} href={m[1] ?? '#'} target="_blank" rel="noopener noreferrer" className="discord-link">{m[1] ?? ''}</a>
      ),
      literal: true,
    },
    // Bold italic ***text***
    {
      regex: /\*\*\*(.+?)\*\*\*/,
      render: (m) => (
        <strong key={nextKey('bi')}><em>{parseInlineSegment(m[1] ?? '', userMap)}</em></strong>
      ),
    },
    // Bold **text**
    {
      regex: /\*\*(.+?)\*\*/,
      render: (m) => (
        <strong key={nextKey('b')}>{parseInlineSegment(m[1] ?? '', userMap)}</strong>
      ),
    },
    // Underline __text__
    {
      regex: /__(.+?)__/,
      render: (m) => (
        <u key={nextKey('u')}>{parseInlineSegment(m[1] ?? '', userMap)}</u>
      ),
    },
    // Italic *text*
    {
      regex: /(?<![*\\])\*([^*\n]+?)\*(?!\*)/,
      render: (m) => (
        <em key={nextKey('i')}>{parseInlineSegment(m[1] ?? '', userMap)}</em>
      ),
    },
    // Italic _text_
    {
      regex: /(?<![_\\])_([^_\n]+?)_(?!_)/,
      render: (m) => (
        <em key={nextKey('i2')}>{parseInlineSegment(m[1] ?? '', userMap)}</em>
      ),
    },
    // Strikethrough ~~text~~
    {
      regex: /~~(.+?)~~/,
      render: (m) => (
        <del key={nextKey('s')}>{parseInlineSegment(m[1] ?? '', userMap)}</del>
      ),
    },
    // Spoiler ||text||
    {
      regex: /\|\|(.+?)\|\|/,
      render: (m) => (
        <span key={nextKey('sp')} className="discord-spoiler">{parseInlineSegment(m[1] ?? '', userMap)}</span>
      ),
    },
  ];

  const result: React.ReactNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliestMatch: RegExpMatchArray | null = null;
    let earliestIndex = Infinity;
    let matchedPattern: InlinePattern | null = null;

    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      const match = regex.exec(remaining);
      if (match && match.index !== undefined && match.index < earliestIndex) {
        earliestIndex = match.index;
        earliestMatch = match;
        matchedPattern = pattern;
      }
    }

    if (!earliestMatch || !matchedPattern) {
      // No more matches — push remaining text
      result.push(<React.Fragment key={nextKey('t')}>{remaining}</React.Fragment>);
      break;
    }

    // Push text before the match
    if (earliestIndex > 0) {
      result.push(<React.Fragment key={nextKey('t')}>{remaining.substring(0, earliestIndex)}</React.Fragment>);
    }

    // Push the matched element
    result.push(matchedPattern.render(earliestMatch));

    // Advance past the match
    remaining = remaining.substring(earliestIndex + earliestMatch[0].length);
  }

  return result;
}

/**
 * Parse full Discord message content into React elements.
 * Handles: code blocks, blockquotes, all inline formatting, mentions, emoji, timestamps, links.
 * @param text - Message content to parse
 * @param userMap - Optional map of user ID -> username for displaying mentions as <@username> instead of <@userId>
 */
export function parseDiscordContent(text: string, userMap?: UserMap): React.ReactNode[] {
  if (!text) return [];

  // Reset key counter for each top-level call
  _keyCounter = 0;

  const elements: React.ReactNode[] = [];

  // Step 1: Split by multi-line code blocks
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Process text before this code block
    if (match.index > lastIndex) {
      elements.push(...parseBlockContent(text.slice(lastIndex, match.index), userMap));
    }

    // Render the code block
    const lang = match[1] || '';
    const code = match[2] || '';
    elements.push(
      <pre key={nextKey('cb')} className="discord-code-block" data-language={lang || undefined}>
        <code>{code}</code>
      </pre>
    );

    lastIndex = match.index + match[0].length;
  }

  // Process remaining text after last code block
  if (lastIndex < text.length) {
    elements.push(...parseBlockContent(text.slice(lastIndex), userMap));
  }

  return elements;
}

/**
 * Parse block-level content: blockquotes, headings, and regular lines.
 * Splits by newline and handles blockquote accumulation.
 */
function parseBlockContent(text: string, userMap?: UserMap): React.ReactNode[] {
  if (!text) return [];

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let blockquoteLines: string[] = [];

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <div key={nextKey('bq')} className="discord-blockquote">
          <div className="discord-blockquote-bar" />
          <div className="discord-blockquote-content">
            {blockquoteLines.map((bqLine, j) => (
              <React.Fragment key={nextKey('bql')}>
                {parseInlineSegment(bqLine, userMap)}
                {j < blockquoteLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        </div>
      );
      blockquoteLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    // Blockquote: > text
    if (line.startsWith('> ')) {
      blockquoteLines.push(line.slice(2));
      continue;
    }
    // Also handle >>> (multi-line blockquote marker - treat rest as blockquote)
    if (line.startsWith('>>> ')) {
      // Everything from here to end is blockquote
      blockquoteLines.push(line.slice(4));
      for (let j = i + 1; j < lines.length; j++) {
        blockquoteLines.push(lines[j] ?? '');
      }
      flushBlockquote();
      return elements;
    }

    // Flush any accumulated blockquote before processing normal line
    flushBlockquote();

    // Heading: # ## ###
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = (headingMatch[1] ?? '').length;
      const headingClass = `discord-heading discord-h${level}`;
      elements.push(
        <div key={nextKey('h')} className={headingClass}>
          {parseInlineSegment(headingMatch[2] ?? '', userMap)}
        </div>
      );
      continue;
    }

    // Regular line
    if (line.length > 0) {
      elements.push(
        <React.Fragment key={nextKey('ln')}>
          {parseInlineSegment(line, userMap)}
        </React.Fragment>
      );
    }

    // Line break between lines (not after last line)
    if (i < lines.length - 1) {
      elements.push(<br key={nextKey('br')} />);
    }
  }

  // Flush remaining blockquote
  flushBlockquote();

  return elements;
}

/**
 * Legacy export for backward compatibility.
 * @deprecated Use parseDiscordContent instead
 */
export function parseDiscordMarkdown(text: string, userMap?: UserMap): React.ReactNode[] {
  return parseDiscordContent(text, userMap);
}
