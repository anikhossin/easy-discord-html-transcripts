import React from 'react';
import { renderToString } from 'react-dom/server';
import { Message } from '../types/messages';
import { ChannelView } from '../components/ChannelView';
import * as fs from 'fs';

const DISCORD_CSS = `
/* =====================================================
   Discord Transcript Theme — Pixel-accurate Dark Mode
   ===================================================== */

/* === Reset & Base === */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #313338;
  color: #dbdee1;
  line-height: 1.375rem;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

a {
  color: #00a8fc;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #2b2d31;
}
::-webkit-scrollbar-thumb {
  background: #1a1b1e;
  border-radius: 4px;
}

/* === Channel View === */
.discord-channel-view {
  background-color: #313338;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* === Channel Header === */
.discord-channel-header {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 48px;
  min-height: 48px;
  border-bottom: 1px solid #1f2023;
  background-color: #313338;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 0 rgba(0,0,0,.2), 0 1.5px 0 rgba(0,0,0,.05), 0 2px 0 rgba(0,0,0,.025);
}

.discord-channel-header-icon {
  color: #80848e;
  margin-right: 8px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.discord-channel-header-icon svg {
  width: 24px;
  height: 24px;
  opacity: 0.6;
}

.discord-channel-header-name {
  color: #f2f3f5;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
}

/* === Messages Container === */
.discord-messages-container {
  flex: 1;
  padding-bottom: 24px;
  overflow-y: auto;
}

/* === Date Separator === */
.discord-date-separator {
  display: flex;
  align-items: center;
  margin: 24px 16px 8px;
  pointer-events: none;
}

.discord-date-separator-line {
  flex: 1;
  height: 1px;
  background-color: #3f4147;
}

.discord-date-separator-text {
  padding: 0 8px;
  color: #949ba4;
  font-size: 12px;
  font-weight: 600;
  line-height: 13px;
  white-space: nowrap;
}

/* ===================================================
   MESSAGE LAYOUT
   Uses flexbox gutter (not absolute positioning) so
   reply/interaction sections flow above the avatar.
   =================================================== */
.discord-message {
  position: relative;
  padding-right: 48px;
  /* NO padding-left — the gutter handles left spacing */
}

.discord-message:hover {
  background-color: rgba(2, 2, 2, 0.06);
}

.discord-message-group-start {
  margin-top: 1.0625rem;
}

/* === Message Row: avatar gutter + content in a flex row === */
.discord-message-row {
  display: flex;
  align-items: flex-start;
}

/* === Avatar Gutter (flex child, not absolute) === */
.discord-message-gutter {
  width: 72px;
  min-width: 72px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2px;
  position: relative;
  z-index: 2; /* sits above the reply spine */
}

/* For continuation messages, the gutter is just spacing (no avatar) */
.discord-message:not(.discord-message-group-start) .discord-message-gutter {
  padding-top: 0;
  align-items: center;
  min-height: 1.375rem;
}

/* Avatar */
.discord-avatar-wrapper {
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.discord-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.discord-avatar-fallback {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

/* Compact timestamp (shown on hover for continuation messages) */
.discord-compact-timestamp {
  display: none;
  font-size: 0.6875rem;
  color: #949ba4;
  line-height: 1.375rem;
  font-weight: 500;
  white-space: nowrap;
  text-align: right;
  width: 100%;
  padding-right: 12px;
}

.discord-message:not(.discord-message-group-start):hover .discord-compact-timestamp {
  display: block;
}

/* === Message Content === */
.discord-message-content {
  flex: 1;
  min-width: 0;
}

/* === Message Header === */
.discord-message-header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0 4px;
  line-height: 1.375rem;
}

.discord-message-author {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.375rem;
  cursor: pointer;
}
.discord-message-author:hover {
  text-decoration: underline;
}

/* User Role Badge (custom role displayed beside author) */
.discord-message-role {
  font-size: 0.75rem;
  color: #949ba4;
  font-weight: 400;
  margin-left: 4px;
}

/* Bot Badge */
.discord-bot-badge {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 0 4px;
  height: 15px;
  border-radius: 3px;
  background-color: #5865f2;
  color: #fff;
  font-size: 10px;
  font-weight: 500;
  line-height: 15px;
  text-transform: uppercase;
  vertical-align: top;
  position: relative;
  top: 2.5px;
}
.discord-bot-badge-icon {
  width: 16px;
  height: 16px;
  margin-left: -2px;
}

.discord-message-timestamp {
  font-size: 0.75rem;
  color: #949ba4;
  line-height: 1.375rem;
  font-weight: 400;
  margin-left: 4px;
}

.discord-message-edited {
  font-size: 0.625rem;
  color: #949ba4;
  user-select: none;
}

/* === Message Text === */
.discord-message-text {
  color: #dbdee1;
  font-size: 1rem;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.375rem;
}

.discord-message-text strong {
  font-weight: 700;
  color: #f2f3f5;
}

.discord-message-text em {
  font-style: italic;
}

.discord-message-text u {
  text-decoration: underline;
}

.discord-message-text del {
  text-decoration: line-through;
  opacity: 0.78;
}

/* === Inline Code === */
.discord-inline-code {
  background-color: #2b2d31;
  color: #e9ecef;
  padding: 0.05em 0.35em;
  border-radius: 3px;
  font-family: Consolas, 'Andale Mono WT', 'Andale Mono', 'Lucida Console', 'Lucida Sans Typewriter', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Liberation Mono', 'Nimbus Mono L', Monaco, 'Courier New', Courier, monospace;
  font-size: 0.875em;
  line-height: 1.125rem;
  white-space: pre-wrap;
}

/* === Code Block === */
.discord-code-block {
  background-color: #2b2d31;
  border: 1px solid #1e1f22;
  border-radius: 4px;
  padding: 8px;
  margin: 4px 0;
  overflow-x: auto;
  font-family: Consolas, 'Andale Mono WT', 'Andale Mono', 'Lucida Console', 'Lucida Sans Typewriter', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Liberation Mono', 'Nimbus Mono L', Monaco, 'Courier New', Courier, monospace;
  font-size: 0.875rem;
  line-height: 1.125rem;
  color: #e9ecef;
  white-space: pre;
}
.discord-code-block code {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
  color: inherit;
}

/* === Spoiler === */
.discord-spoiler {
  background-color: #232428;
  color: transparent;
  border-radius: 3px;
  padding: 0 2px;
  cursor: pointer;
  user-select: none;
  transition: all 0.1s ease;
}
.discord-spoiler:hover {
  background-color: rgba(35, 36, 40, 0.8);
  color: #dbdee1;
}

/* === Mentions === */
.discord-mention {
  background-color: rgba(88, 101, 242, 0.3);
  color: #c9cdfb;
  padding: 0 2px;
  border-radius: 3px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.05s ease, color 0.05s ease;
}
.discord-mention:hover {
  background-color: #5865f2;
  color: #fff;
}
.discord-mention-icon {
  margin-right: 1px;
  opacity: 0.8;
}

/* === Custom Emoji === */
.discord-custom-emoji {
  width: 22px;
  height: 22px;
  vertical-align: -5px;
  object-fit: contain;
  display: inline;
}

/* === Timestamp (Discord format) === */
.discord-timestamp {
  background-color: rgba(88, 101, 242, 0.15);
  color: #e0e1e5;
  padding: 0 2px;
  border-radius: 3px;
}

/* === Blockquote === */
.discord-blockquote {
  display: flex;
  margin: 2px 0;
}
.discord-blockquote-bar {
  width: 4px;
  border-radius: 4px;
  background-color: #4e5058;
  flex-shrink: 0;
  margin-right: 12px;
}
.discord-blockquote-content {
  flex: 1;
  min-width: 0;
}

/* === Headings === */
.discord-heading {
  font-weight: 700;
  color: #f2f3f5;
  margin: 4px 0 2px;
}
.discord-h1 {
  font-size: 1.5rem;
  line-height: 2rem;
}
.discord-h2 {
  font-size: 1.25rem;
  line-height: 1.625rem;
}
.discord-h3 {
  font-size: 1rem;
  line-height: 1.375rem;
}

/* === Links === */
.discord-link {
  color: #00a8fc;
  text-decoration: none;
  cursor: pointer;
}
.discord-link:hover {
  text-decoration: underline;
}

/* ===================================================
   REPLY SECTION
   The reply container sits ABOVE the message-row in
   normal document flow. The L-shaped spine connects
   down to the avatar in the message-row below.
   =================================================== */
.discord-reply-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 72px;   /* align content with message text */
  min-height: 22px;
  cursor: pointer;
}
.discord-reply-container:hover {
  background-color: rgba(2, 2, 2, 0.03);
}

/* L-shaped reply connector spine.
   Positioned within reply-container (which starts at message's left edge).
   - Left edge at 36px = center of the 72px gutter (avatar center)
   - Horizontal turn at 50% height of reply row
   - Vertical part extends DOWN past the reply container to meet the avatar */
.discord-reply-spine {
  position: absolute;
  left: 36px;
  top: 50%;
  bottom: -4px;
  width: 33px;
  border-left: 2px solid #4e5058;
  border-top: 2px solid #4e5058;
  border-top-left-radius: 6px;
  border-right: none;
  border-bottom: none;
}

.discord-reply-content {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: #b5bac1;
  overflow: hidden;
  min-width: 0;
  line-height: 1.125rem;
  white-space: nowrap;
}
.discord-reply-container:hover .discord-reply-text {
  color: #dbdee1;
}

.discord-reply-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.discord-reply-avatar-fallback {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #5865f2;
  flex-shrink: 0;
}

.discord-reply-username {
  font-weight: 600;
  color: #f2f3f5;
  flex-shrink: 0;
  font-size: 0.875rem;
  opacity: 0.64;
}
.discord-reply-container:hover .discord-reply-username {
  opacity: 1;
}

.discord-reply-text {
  color: #b5bac1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
}

/* ===================================================
   INTERACTION / SLASH COMMAND SECTION
   Same pattern as reply — sits above the message-row.
   =================================================== */
.discord-interaction-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 72px;
  min-height: 22px;
}

.discord-interaction-gutter {
  position: absolute;
  left: 36px;
  top: 50%;
  bottom: -4px;
  width: 33px;
  border-left: 2px solid #4e5058;
  border-top: 2px solid #4e5058;
  border-top-left-radius: 6px;
  border-right: none;
  border-bottom: none;
}

.discord-interaction-content {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #b5bac1;
  line-height: 1rem;
}

.discord-interaction-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.discord-interaction-username {
  font-weight: 600;
  color: #f2f3f5;
  opacity: 0.64;
  cursor: pointer;
}
.discord-interaction-username:hover {
  opacity: 1;
}

.discord-interaction-label {
  color: #949ba4;
}

.discord-interaction-command {
  color: #00a8fc;
  cursor: pointer;
  font-weight: 500;
}
.discord-interaction-command:hover {
  color: #00c0ff;
}

.discord-slash-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background-color: #5865f2;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  margin-right: 2px;
  vertical-align: middle;
  line-height: 1;
}

/* ===================================================
   ATTACHMENTS
   =================================================== */
.discord-message-attachments {
  margin-top: 4px;
}

/* Image Grid Layouts */
.discord-image-grid {
  display: grid;
  gap: 4px;
  margin-top: 4px;
  max-width: 550px;
}

.discord-image-single {
  grid-template-columns: 1fr;
}
.discord-image-grid-2 {
  grid-template-columns: 1fr 1fr;
}
.discord-image-grid-3 {
  grid-template-columns: 1fr 1fr;
}
.discord-image-grid-3 > :first-child {
  grid-row: span 2;
}
.discord-image-grid-4 {
  grid-template-columns: 1fr 1fr;
}

.discord-image-wrapper {
  position: relative;
  display: block;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  line-height: 0;
}
.discord-image-wrapper:hover {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.discord-attachment-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

.discord-spoiler-image {
  filter: blur(44px);
  transition: filter 0.3s ease;
}
.discord-image-wrapper:hover .discord-spoiler-image {
  filter: blur(0);
}

.discord-spoiler-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
}
.discord-image-wrapper:hover .discord-spoiler-overlay {
  display: none;
}

/* Video */
.discord-video-wrapper {
  margin-top: 4px;
  max-width: 550px;
}

.discord-attachment-video {
  width: 100%;
  max-height: 350px;
  border-radius: 8px;
  background-color: #000;
}

/* Audio */
.discord-audio-wrapper {
  margin-top: 4px;
  background-color: #2b2d31;
  border-radius: 8px;
  padding: 12px 16px;
  max-width: 400px;
}

.discord-audio-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.discord-audio-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.discord-audio-filename {
  color: #00a8fc;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.discord-audio-filename:hover {
  text-decoration: underline;
}

.discord-audio-size {
  color: #949ba4;
  font-size: 12px;
  flex-shrink: 0;
}

.discord-attachment-audio {
  width: 100%;
  height: 32px;
  border-radius: 4px;
}

/* File Attachment Box */
.discord-file-attachment {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background-color: #2b2d31;
  border: 1px solid #232428;
  border-radius: 8px;
  margin-top: 4px;
  max-width: 430px;
  transition: background-color 0.1s ease;
}
.discord-file-attachment:hover {
  background-color: #2f3136;
}

.discord-file-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.discord-file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.discord-file-name {
  color: #00a8fc;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.375rem;
}
.discord-file-name:hover {
  text-decoration: underline;
}

.discord-file-size {
  color: #949ba4;
  font-size: 0.75rem;
  line-height: 1rem;
}

.discord-file-download {
  color: #b5bac1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.1s ease;
}
.discord-file-download:hover {
  opacity: 1;
  text-decoration: none;
}

/* ===================================================
   EMBEDS
   =================================================== */
.discord-message-embeds {
  margin-top: 4px;
}

.discord-embed {
  display: flex;
  margin-top: 4px;
  max-width: 520px;
  border-radius: 4px;
  overflow: hidden;
}

.discord-embed-color-bar {
  width: 4px;
  flex-shrink: 0;
}

.discord-embed-content {
  background-color: #2b2d31;
  border: 1px solid rgba(30, 31, 34, 0.6);
  border-left: none;
  border-radius: 0 4px 4px 0;
  padding: 8px 16px 16px 12px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.discord-embed-author {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 0.875rem;
}
.discord-embed-author-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
}
.discord-embed-author-name {
  color: #f2f3f5;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
}
.discord-embed-author-name:hover {
  text-decoration: underline;
}

.discord-embed-title {
  color: #f2f3f5;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
  line-height: 1.375rem;
}
.discord-embed-title a {
  color: #00a8fc;
  text-decoration: none;
}
.discord-embed-title a:hover {
  text-decoration: underline;
}

.discord-embed-description {
  color: #dbdee1;
  font-size: 0.875rem;
  line-height: 1.125rem;
  margin-bottom: 8px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.discord-embed-fields {
  display: grid;
  grid-gap: 8px;
  margin-bottom: 8px;
}

.discord-embed-field {
  min-width: 0;
}
.discord-embed-field.inline {
  display: inline-block;
  width: calc(33.33% - 8px);
  vertical-align: top;
}

.discord-embed-field-name {
  color: #f2f3f5;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 2px;
}
.discord-embed-field-value {
  color: #dbdee1;
  font-size: 0.875rem;
  line-height: 1.125rem;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.discord-embed-image-container {
  margin-top: 8px;
  border-radius: 4px;
  overflow: hidden;
  line-height: 0;
}
.discord-embed-image {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
}

.discord-embed-video-container {
  margin-top: 8px;
  border-radius: 4px;
  overflow: hidden;
}
.discord-embed-video {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
}

.discord-embed-thumbnail {
  float: right;
  margin-left: 16px;
  margin-bottom: 8px;
}
.discord-embed-thumbnail img {
  max-width: 80px;
  max-height: 80px;
  border-radius: 4px;
  display: block;
}

.discord-embed-footer {
  display: flex;
  align-items: center;
  margin-top: 8px;
  font-size: 0.75rem;
  color: #949ba4;
  line-height: 1rem;
}
.discord-embed-footer-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
}
.discord-embed-footer-text {
  color: #949ba4;
}
.discord-embed-footer-separator {
  margin: 0 2px;
}
.discord-embed-footer-timestamp {
  color: #949ba4;
}

/* ===================================================
   COMPONENTS (Buttons, Selects, etc.)
   =================================================== */
.discord-components {
  margin-top: 4px;
}

.discord-action-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.discord-button {
  padding: 2px 16px;
  height: 32px;
  min-width: 60px;
  border-radius: 3px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.17s ease, color 0.17s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  color: #fff;
  line-height: 16px;
}

.discord-button-1 { /* Primary / Blurple */
  background-color: #5865f2;
}
.discord-button-1:hover:not(:disabled) {
  background-color: #4752c4;
}

.discord-button-2 { /* Secondary / Grey */
  background-color: #4e5058;
}
.discord-button-2:hover:not(:disabled) {
  background-color: #6d6f78;
}

.discord-button-3 { /* Success / Green */
  background-color: #248046;
}
.discord-button-3:hover:not(:disabled) {
  background-color: #1a6334;
}

.discord-button-4 { /* Danger / Red */
  background-color: #da373c;
}
.discord-button-4:hover:not(:disabled) {
  background-color: #a12d31;
}

.discord-button-5 { /* Link */
  background-color: transparent;
  color: #fff;
  border: none;
}
.discord-button-5:hover:not(:disabled) {
  background-color: rgba(78, 80, 88, 0.3);
}

.discord-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.discord-button-emoji {
  font-size: 16px;
}

/* Select Menu (styled as a div, not native select) */
.discord-select-wrapper {
  margin-top: 4px;
}
.discord-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #1e1f22;
  border: 1px solid #1e1f22;
  color: #949ba4;
  font-size: 14px;
  min-width: 200px;
  max-width: 400px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.discord-select:hover {
  border-color: #3f4147;
}
.discord-select.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.discord-select-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.discord-select-arrow {
  flex-shrink: 0;
  opacity: 0.6;
}

/* === V2 TEXT DISPLAY === */
.discord-text-display {
  color: #dbdee1;
  font-size: 1rem;
  line-height: 1.375rem;
  margin-top: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* === V2 SECTION === */
.discord-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 4px;
}
.discord-section-text {
  flex: 1;
  min-width: 0;
  color: #dbdee1;
  font-size: 1rem;
  line-height: 1.375rem;
}
.discord-section-text-item {
  white-space: pre-wrap;
  word-break: break-word;
}
.discord-section-text-item + .discord-section-text-item {
  margin-top: 4px;
}
.discord-section-accessory {
  flex-shrink: 0;
}

/* === V2 THUMBNAIL === */
.discord-thumbnail {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  display: inline-block;
}
.discord-thumbnail-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}
.discord-thumbnail-spoiler .discord-thumbnail-img {
  filter: blur(44px);
}
.discord-spoiler-overlay-small {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
}

/* === V2 MEDIA GALLERY === */
.discord-media-gallery {
  display: grid;
  gap: 4px;
  margin-top: 4px;
  max-width: 550px;
  border-radius: 8px;
  overflow: hidden;
}
.discord-media-gallery-1 {
  grid-template-columns: 1fr;
}
.discord-media-gallery-2 {
  grid-template-columns: 1fr 1fr;
}
.discord-media-gallery-multi {
  grid-template-columns: 1fr 1fr;
}
.discord-media-gallery-item {
  position: relative;
  overflow: hidden;
  line-height: 0;
}
.discord-media-gallery-item a {
  display: block;
}
.discord-media-gallery-img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  min-height: 100px;
  max-height: 300px;
}
.discord-media-gallery-1 .discord-media-gallery-img {
  max-height: 350px;
  min-height: auto;
}
.discord-media-gallery-spoiler .discord-media-gallery-img {
  filter: blur(44px);
}

/* === V2 SEPARATOR === */
.discord-separator {
  height: 1px;
  background-color: #3f4147;
  margin: 8px 0;
}
.discord-separator-large {
  margin: 16px 0;
}
.discord-separator-small {
  margin: 8px 0;
}
.discord-separator-spacing {
  /* No divider line — just spacing */
}
.discord-separator-spacing.discord-separator-large {
  height: 16px;
}
.discord-separator-spacing.discord-separator-small {
  height: 8px;
}

/* === V2 CONTAINER (embed-like wrapper) === */
.discord-container {
  display: flex;
  margin-top: 4px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #2b2d31;
  border: 1px solid #232428;
  max-width: 520px;
  position: relative;
}
.discord-container-accent {
  width: 4px;
  flex-shrink: 0;
}
.discord-container-content {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
}
.discord-container-spoiler .discord-container-content {
  filter: blur(44px);
  pointer-events: none;
  user-select: none;
}
.discord-container-spoiler-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  z-index: 2;
  cursor: pointer;
}

/* === BUTTON EXTRAS === */
.discord-button-emoji-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  vertical-align: -4px;
}
.discord-button-link-icon {
  width: 16px;
  height: 16px;
  margin-left: 4px;
  opacity: 0.7;
}

/* ===================================================
   MOBILE RESPONSIVE
   =================================================== */
@media (max-width: 768px) {
  .discord-channel-view {
    padding: 0;
  }

  .discord-channel-header {
    padding: 12px 16px;
    min-height: 44px;
  }

  .discord-channel-header-name {
    font-size: 14px;
  }

  .discord-messages-container {
    padding: 0 8px 24px;
    max-width: 100%;
  }

  .discord-date-separator {
    margin: 16px 8px 8px;
  }

  .discord-date-separator-text {
    font-size: 11px;
  }

  .discord-message {
    padding-right: 16px;
    padding-left: 8px;
  }

  .discord-message-row {
    gap: 0;
  }

  .discord-message-gutter {
    width: 40px;
    min-width: 40px;
  }

  .discord-reply-container {
    padding-left: 40px;
  }

  .discord-reply-spine {
    left: 20px;
    width: 20px;
  }

  .discord-interaction-container {
    padding-left: 40px;
  }

  .discord-interaction-gutter {
    left: 20px;
    width: 20px;
  }

  .discord-avatar-wrapper {
    width: 32px;
    height: 32px;
  }

  .discord-avatar {
    width: 32px;
    height: 32px;
  }

  .discord-avatar-fallback {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .discord-message-author {
    font-size: 0.9375rem;
  }

  .discord-message-timestamp {
    font-size: 0.6875rem;
  }

  .discord-message-text {
    font-size: 0.9375rem;
  }

  .discord-embed {
    max-width: 100%;
    flex-direction: column;
  }

  .discord-embed-thumbnail {
    float: none;
    margin-left: 0;
    margin-bottom: 8px;
  }

  .discord-embed-thumbnail img {
    max-width: 100%;
    max-height: 120px;
  }

  .discord-embed-field.inline {
    width: 100%;
    display: block;
  }

  .discord-embed-fields {
    grid-template-columns: 1fr;
  }

  .discord-image-grid {
    max-width: 100%;
  }

  .discord-video-wrapper {
    max-width: 100%;
  }

  .discord-attachment-video {
    max-height: 250px;
  }

  .discord-audio-wrapper {
    max-width: 100%;
  }

  .discord-file-attachment {
    max-width: 100%;
  }

  .discord-media-gallery {
    max-width: 100%;
  }

  .discord-container {
    max-width: 100%;
  }

  .discord-action-row {
    flex-direction: column;
  }

  .discord-button {
    width: 100%;
    justify-content: center;
  }

  .discord-select {
    min-width: 100%;
    max-width: 100%;
  }

  .discord-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .discord-reply-content {
    font-size: 0.8125rem;
  }

  .discord-reply-text {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }
}

@media (max-width: 480px) {
  .discord-message-gutter {
    width: 36px;
    min-width: 36px;
  }

  .discord-reply-container {
    padding-left: 36px;
  }

  .discord-reply-spine {
    left: 18px;
    width: 16px;
  }

  .discord-interaction-container {
    padding-left: 36px;
  }

  .discord-interaction-gutter {
    left: 18px;
    width: 16px;
  }

  .discord-avatar-wrapper {
    width: 28px;
    height: 28px;
  }

  .discord-avatar {
    width: 28px;
    height: 28px;
  }

  .discord-avatar-fallback {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}
`;

export async function generateTranscriptHTML(
  messages: Message[],
  channelName: string,
  options?: {
    footerText?: string;
    removeEmails?: boolean;
    userRoles?: Record<string, string>;
  }
): Promise<string> {
  const channelView = React.createElement(ChannelView, {
    messages,
    channelName,
    userRoles: options?.userRoles,
  });
  const htmlContent = renderToString(channelView);

  let finalHtml = htmlContent;

  // Remove emails if requested
  if (options?.removeEmails) {
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi;
    finalHtml = finalHtml.replace(emailRegex, '[EMAIL REDACTED]');
    finalHtml = finalHtml.replace(/<a[^>]*href=["']mailto:[^"']*["'][^>]*>.*?<\/a>/gi, '');
  }

  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transcript - #${channelName}</title>
  <style>
    ${DISCORD_CSS}
  </style>
</head>
<body>
  ${finalHtml}
  ${options?.footerText ? `<div style="text-align: center; padding: 16px; color: #949ba4; font-size: 12px; border-top: 1px solid #3f4147; margin-top: 32px;">${options.footerText}</div>` : ''}
  <script>
    // Spoiler toggle
    document.querySelectorAll('.discord-spoiler').forEach(function(el) {
      el.addEventListener('click', function() {
        this.style.backgroundColor = 'rgba(35, 36, 40, 0.8)';
        this.style.color = '#dbdee1';
      });
    });
  </script>
</body>
</html>`;

  return fullHTML;
}

export async function generateTranscriptFile(
  messages: Message[],
  channelName: string,
  outputPath: string,
  options?: {
    footerText?: string;
    removeEmails?: boolean;
    userRoles?: Record<string, string>;
  }
): Promise<void> {
  const html = await generateTranscriptHTML(messages, channelName, options);
  await fs.promises.writeFile(outputPath, html, 'utf-8');
}
