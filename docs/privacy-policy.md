# Privacy Policy for Copylot

**Last Updated:** 2026-07-25

## Overview

Copylot is a browser extension that helps you copy web content into clean, AI-friendly formats (for example: Markdown/CSV/Plain Text). This privacy policy explains what Copylot processes and stores when you use the extension.

## What Copylot Processes (On Your Device)

To provide the copy/format features, Copylot reads the relevant parts of the current web page inside your browser when you trigger an action (for example: click/double-click to copy a block, hover-to-copy for code blocks, or use the context menu).

All extraction/cleanup/formatting happens locally on your device. The formatted result is written to your clipboard.

## Data We Do NOT Collect or Upload

Copylot does **not** send your copied content or browsing data to any Copylot server. In particular, we do not collect or upload:

- Any copied web page content
- Personal information (name, email, phone number, address)
- Browsing history
- The full URLs/titles/content of the pages you visit (not uploaded)
- Any third-party analytics identifiers or tracking cookies

## Data Stored in Your Browser

Copylot stores some data in your browser storage to make the extension work and to remember your preferences. This data is not uploaded to Copylot.

### Settings / Prompts / Chat Services (Browser Storage)

- Storage: `chrome.storage.sync`
- Key: `copilot_settings`
- What it may include:
  - Extension settings (format options, interaction mode, switches)
  - Your Prompt templates and their usage counters (if you create/edit prompts)
  - Chat service configuration (built-in services + any custom services you add)

Note: `chrome.storage.sync` is provided by the browser. If you enable Chrome Sync in your browser, this data may be synced across your devices by Chrome/Google. Copylot does not operate that sync service and does not receive this data.

### Basic Product State (Current Device Only)

- Storage: `chrome.storage.local`
- Key: `copilot_growth_stats`
- What it may include:
  - Install timestamp
  - Successful copy count
  - Temporary append-session state used to combine several copied sections
- What it never includes:
  - Copied or selected content
  - Page titles or URLs
- Network: **not sent over the network**

### Local Usage Records (Optional, Current Device Only)

Copylot provides a “Local usage records” toggle for optional, on-device troubleshooting.

- Default: **OFF**
- Storage: `chrome.storage.local`
- Key: `copilot_telemetry_events`
- When ON: Copylot records a local event log with a strict schema (feature action, timestamp, and a small set of allowlisted enum-like fields).
- What it never contains: any copied content, page content, URLs, page titles, or other sensitive data.
- Network: **not sent over the network**
- Retention: keeps up to the most recent 100 events (FIFO)
- When turned OFF: the local event log is cleared immediately

## External Pages and Third Parties

Some features may open external pages (for example: GitHub Issues for feedback, Chrome Web Store pages for rating/sharing, or the chat services you choose to open). Those websites are operated by third parties and their privacy practices are governed by their own policies.

Copylot does not automatically upload your copied content to those websites. You control what you paste or submit.

## Permissions We Request

Copylot requests the following Chrome extension permissions:

- `storage`: to store your settings (and optional local logs) in browser storage
- `clipboardWrite`: to write the formatted result into your clipboard
- `contextMenus`: to provide right-click menu actions

Copylot also runs content scripts on web pages (as declared in `manifest.json`) to enable the copy/format functionality. The page processing happens locally on your device as described above.

## Your Choices

- You can change settings at any time in the extension Options/Popup.
- You can keep “Local usage records” OFF (default). Turning it OFF clears the optional local event log immediately.
- Uninstalling the extension removes its local data from your browser.

## Contact

If you have questions or concerns about this privacy policy, please contact us via:

- GitHub Issues: https://github.com/ayqy/copy/issues/new
