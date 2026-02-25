import React from 'react';
import { Embed as EmbedType } from '../types/messages';
import { parseDiscordContent } from '../utils/parseMarkdown';

interface EmbedProps {
  embed: EmbedType;
}

export const Embed: React.FC<EmbedProps> = ({ embed }) => {
  const getColorHex = (color?: number) => {
    if (!color) return '#5865F2'; // Discord default blurple
    return `#${color.toString(16).padStart(6, '0')}`;
  };

  const color = getColorHex(embed.color);

  return (
    <div className="discord-embed">
      <div className="discord-embed-color-bar" style={{ backgroundColor: color }} />
      <div className="discord-embed-content">
        {/* Thumbnail (floated right) */}
        {embed.thumbnail && (
          <div className="discord-embed-thumbnail">
            <a href={embed.thumbnail.url} target="_blank" rel="noopener noreferrer">
              <img src={embed.thumbnail.url} alt="Thumbnail" />
            </a>
          </div>
        )}

        {/* Author */}
        {embed.author && (
          <div className="discord-embed-author">
            {embed.author.icon_url && (
              <img src={embed.author.icon_url} alt="" className="discord-embed-author-icon" />
            )}
            {embed.author.url ? (
              <a href={embed.author.url} target="_blank" rel="noopener noreferrer" className="discord-embed-author-name">
                {embed.author.name}
              </a>
            ) : (
              <span className="discord-embed-author-name">{embed.author.name}</span>
            )}
          </div>
        )}

        {/* Title */}
        {embed.title && (
          <div className="discord-embed-title">
            {embed.url ? (
              <a href={embed.url} target="_blank" rel="noopener noreferrer">
                {embed.title}
              </a>
            ) : (
              embed.title
            )}
          </div>
        )}

        {/* Description (with markdown parsing) */}
        {embed.description && (
          <div className="discord-embed-description">
            {parseDiscordContent(embed.description)}
          </div>
        )}

        {/* Fields */}
        {embed.fields && embed.fields.length > 0 && (
          <div className="discord-embed-fields">
            {embed.fields.map((field, i) => (
              <div key={i} className={`discord-embed-field ${field.inline ? 'inline' : ''}`}>
                <div className="discord-embed-field-name">{field.name}</div>
                <div className="discord-embed-field-value">
                  {parseDiscordContent(field.value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image */}
        {embed.image && (
          <div className="discord-embed-image-container">
            <a href={embed.image.url} target="_blank" rel="noopener noreferrer">
              <img src={embed.image.url} alt="Embed image" className="discord-embed-image" />
            </a>
          </div>
        )}

        {/* Video */}
        {embed.video && embed.video.url && (
          <div className="discord-embed-video-container">
            <video src={embed.video.url} controls preload="metadata" className="discord-embed-video">
              <source src={embed.video.url} />
            </video>
          </div>
        )}

        {/* Footer */}
        {(embed.footer || embed.timestamp) && (
          <div className="discord-embed-footer">
            {embed.footer?.icon_url && (
              <img src={embed.footer.icon_url} alt="" className="discord-embed-footer-icon" />
            )}
            {embed.footer && (
              <span className="discord-embed-footer-text">{embed.footer.text}</span>
            )}
            {embed.footer && embed.timestamp && (
              <span className="discord-embed-footer-separator"> • </span>
            )}
            {embed.timestamp && (
              <span className="discord-embed-footer-timestamp">
                {new Date(embed.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {' '}
                {new Date(embed.timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
