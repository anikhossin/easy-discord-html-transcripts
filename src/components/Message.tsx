import React from 'react';
import { Message as MessageType, Attachment } from '../types/messages';
import { Embed } from './Embed';
import { Components } from './Components';
import { parseDiscordContent, type UserMap } from '../utils/parseMarkdown';

interface MessageProps {
  message: MessageType;
  isGroupStart?: boolean;
  /** Map of user ID -> username for mention display */
  userMap?: UserMap;
  /** Role label to display beside author name, e.g. "Moderator" */
  userRole?: string;
}

/** Format file size in human-readable format */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Check if an attachment is an image */
function isImageAttachment(att: Attachment): boolean {
  if (att.contentType?.startsWith('image/')) return true;
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(att.url);
}

/** Check if an attachment is a video */
function isVideoAttachment(att: Attachment): boolean {
  if (att.contentType?.startsWith('video/')) return true;
  return /\.(mp4|webm|mov|avi)(\?.*)?$/i.test(att.url);
}

/** Check if an attachment is an audio file */
function isAudioAttachment(att: Attachment): boolean {
  if (att.contentType?.startsWith('audio/')) return true;
  return /\.(mp3|ogg|wav|flac|m4a)(\?.*)?$/i.test(att.url);
}

/** Get file extension from filename */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts[parts.length - 1] ?? '').toUpperCase() : '';
}

/** Get avatar color from user ID */
function getAvatarColor(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/** Get author name color */
function getAuthorColor(message: MessageType): string {
  if (message.authorRoleColor) {
    return `#${message.authorRoleColor.toString(16).padStart(6, '0')}`;
  }
  return '#f2f3f5';
}

export const Message: React.FC<MessageProps> = ({ message, isGroupStart = false, userMap, userRole }) => {
  const createdAt = new Date(message.createdAt);
  const editedAt = message.editedAt ? new Date(message.editedAt) : null;
  const avatarColor = getAvatarColor(message.author.id);
  const authorColor = getAuthorColor(message);

  const hasReply = !!message.reference;
  const hasInteraction = !!message.interaction;

  // Format timestamps
  const fullTimestamp = `${createdAt.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })} ${createdAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;

  const compactTimestamp = createdAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Split attachments by type
  const imageAttachments = message.attachments.filter(isImageAttachment);
  const videoAttachments = message.attachments.filter(isVideoAttachment);
  const audioAttachments = message.attachments.filter(isAudioAttachment);
  const fileAttachments = message.attachments.filter(
    att => !isImageAttachment(att) && !isVideoAttachment(att) && !isAudioAttachment(att)
  );

  const renderImageGrid = (images: Attachment[]) => {
    if (images.length === 0) return null;
    const gridClass = images.length === 1 ? 'discord-image-single'
      : images.length === 2 ? 'discord-image-grid-2'
      : images.length === 3 ? 'discord-image-grid-3'
      : 'discord-image-grid-4';

    return (
      <div className={`discord-image-grid ${gridClass}`}>
        {images.map((img, i) => (
          <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="discord-image-wrapper">
            <img
              src={img.url}
              alt={img.filename}
              className={`discord-attachment-image${img.spoiler ? ' discord-spoiler-image' : ''}`}
              style={{
                maxWidth: images.length === 1 ? '550px' : '100%',
                maxHeight: images.length === 1 ? '350px' : '200px',
              }}
            />
            {img.spoiler && <div className="discord-spoiler-overlay">SPOILER</div>}
          </a>
        ))}
      </div>
    );
  };

  const renderVideoAttachment = (att: Attachment, i: number) => (
    <div key={i} className="discord-video-wrapper">
      <video
        src={att.url}
        controls
        preload="metadata"
        className="discord-attachment-video"
        style={{ maxWidth: '550px', maxHeight: '350px' }}
      >
        <source src={att.url} type={att.contentType || 'video/mp4'} />
      </video>
    </div>
  );

  const renderAudioAttachment = (att: Attachment, i: number) => (
    <div key={i} className="discord-audio-wrapper">
      <div className="discord-audio-file-info">
        <span className="discord-audio-icon">🎵</span>
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="discord-audio-filename">
          {att.filename}
        </a>
        {att.size && <span className="discord-audio-size">{formatFileSize(att.size)}</span>}
      </div>
      <audio src={att.url} controls preload="metadata" className="discord-attachment-audio" />
    </div>
  );

  const renderFileAttachment = (att: Attachment, i: number) => {
    const ext = getFileExtension(att.filename);
    return (
      <div key={i} className="discord-file-attachment">
        <div className="discord-file-icon">
          <svg width="30" height="40" viewBox="0 0 30 40" fill="none">
            <path d="M0 4C0 1.79086 1.79086 0 4 0H19L30 11V36C30 38.2091 28.2091 40 26 40H4C1.79086 40 0 38.2091 0 36V4Z" fill="#d3d6fd" />
            <path d="M19 0L30 11H23C20.7909 11 19 9.20914 19 7V0Z" fill="#7984f5" />
            <text x="15" y="28" textAnchor="middle" fill="#4752c4" fontSize="8" fontWeight="600" fontFamily="sans-serif">{ext}</text>
          </svg>
        </div>
        <div className="discord-file-info">
          <a href={att.url} target="_blank" rel="noopener noreferrer" className="discord-file-name">
            {att.filename}
          </a>
          <span className="discord-file-size">{formatFileSize(att.size)}</span>
        </div>
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="discord-file-download" title="Download">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.293 9.293L17.707 10.707L12 16.414L6.293 10.707L7.707 9.293L11 12.586V2H13V12.586L16.293 9.293ZM18 20V18H20V20C20 21.102 19.104 22 18 22H6C4.896 22 4 21.102 4 20V18H6V20H18Z" />
          </svg>
        </a>
      </div>
    );
  };

  return (
    <div className={`discord-message${isGroupStart ? ' discord-message-group-start' : ''}${hasReply ? ' discord-message-has-reply' : ''}${hasInteraction ? ' discord-message-has-interaction' : ''}`}>
      {/* Reply section — shown above the message body */}
      {hasReply && (
        <div className="discord-reply-container">
          <div className="discord-reply-spine" />
          <div className="discord-reply-content">
            {message.reference!.author?.avatarURL ? (
              <img
                src={message.reference!.author.avatarURL}
                alt=""
                className="discord-reply-avatar"
              />
            ) : (
              <div className="discord-reply-avatar-fallback" />
            )}
            <span className="discord-reply-username">
              {message.reference!.author?.displayName || message.reference!.author?.username || 'Unknown User'}
            </span>
            <span className="discord-reply-text">
              {message.reference!.content
                ? (message.reference!.content.length > 150
                  ? `${message.reference!.content.substring(0, 150)}...`
                  : message.reference!.content)
                : (message.reference!.attachments
                  ? 'Click to see attachment'
                  : 'Original message was deleted')
              }
            </span>
          </div>
        </div>
      )}

      {/* Interaction (slash command usage) — shown above the message body */}
      {hasInteraction && (
        <div className="discord-interaction-container">
          <div className="discord-interaction-gutter" />
          <div className="discord-interaction-content">
            {message.interaction!.user?.avatarURL && (
              <img
                src={message.interaction!.user.avatarURL}
                alt=""
                className="discord-interaction-avatar"
              />
            )}
            <span className="discord-interaction-username">
              {message.interaction!.user?.displayName || message.interaction!.user?.username || 'Unknown'}
            </span>
            <span className="discord-interaction-label"> used </span>
            {message.interaction!.name && (
              <span className="discord-interaction-command">
                <span className="discord-slash-icon">/</span>
                {message.interaction!.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main message row: avatar gutter + content */}
      <div className="discord-message-row">
        {/* Left gutter: avatar (group start) or hover timestamp (continuation) */}
        <div className="discord-message-gutter">
          {isGroupStart ? (
            <div className="discord-avatar-wrapper">
              {message.author.avatarURL ? (
                <img
                  src={message.author.avatarURL}
                  alt={message.author.username}
                  className="discord-avatar"
                />
              ) : (
                <div
                  className="discord-avatar-fallback"
                  style={{ backgroundColor: avatarColor }}
                >
                  {message.author.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ) : (
            <span className="discord-compact-timestamp">{compactTimestamp}</span>
          )}
        </div>

        {/* Content area */}
        <div className="discord-message-content">
          {/* Header with author name + timestamp (group start only) */}
          {isGroupStart && (
            <div className="discord-message-header">
              <span className="discord-message-author" style={{ color: authorColor }}>
                {message.author.displayName || message.author.username}
              </span>
              {userRole && (
                <span className="discord-message-role">({userRole})</span>
              )}
              {message.isBot && (
                <span className="discord-bot-badge">
                  <svg width="16" height="16" viewBox="0 0 16 15.2" className="discord-bot-badge-icon">
                    <path d="M7.4,11.17,4,8.62,5,7.26l2,1.53L10.64,4l1.36,1Z" fill="currentColor" />
                  </svg>
                  BOT
                </span>
              )}
              <span className="discord-message-timestamp">{fullTimestamp}</span>
            </div>
          )}

          {/* Message text content */}
          {message.content && (
            <div className="discord-message-text">
              {parseDiscordContent(message.content, userMap)}
              {editedAt && <span className="discord-message-edited"> (edited)</span>}
            </div>
          )}

          {/* Image attachments */}
          {imageAttachments.length > 0 && (
            <div className="discord-message-attachments">
              {renderImageGrid(imageAttachments)}
            </div>
          )}

          {/* Video attachments */}
          {videoAttachments.length > 0 && (
            <div className="discord-message-attachments">
              {videoAttachments.map(renderVideoAttachment)}
            </div>
          )}

          {/* Audio attachments */}
          {audioAttachments.length > 0 && (
            <div className="discord-message-attachments">
              {audioAttachments.map(renderAudioAttachment)}
            </div>
          )}

          {/* File attachments */}
          {fileAttachments.length > 0 && (
            <div className="discord-message-attachments">
              {fileAttachments.map(renderFileAttachment)}
            </div>
          )}

          {/* Embeds */}
          {message.embeds && message.embeds.length > 0 && (
            <div className="discord-message-embeds">
              {message.embeds.map((embed, i) => (
                <Embed key={i} embed={embed} />
              ))}
            </div>
          )}

          {/* Components (buttons, selects, etc.) */}
          {message.components && message.components.length > 0 && (
            <Components components={message.components} />
          )}
        </div>
      </div>
    </div>
  );
};
