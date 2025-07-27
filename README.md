# Copylot

A Chrome browser extension that intelligently copies web page content in AI-friendly formats.

## Features

- 🎯 **Smart Content Detection**: Automatically identifies viable content blocks on web pages.
- ✨ **Smart Table Conversion**: Intelligently copies tables into Markdown or CSV formats.
- 📝 **Multiple Output Formats**: Copy content as clean Markdown or plain text.
- ✨ **Professional Code Block Cleaning**: Automatically removes line numbers, prompts, and other "clutter" from copied code blocks, delivering clean, runnable code.
- 🔄 **Customizable Prompts**: Create, manage, and use your own prompts to format copied text for AI models.
- 🖱️ **Flexible Interaction Modes**: Activate by single-click or double-click, configurable via settings.
- ✨ **Hover-to-Copy for Media**: Instantly copy images, videos, and other media elements just by hovering over them.
- 🌐 **Full Page Conversion**: Convert the entire page content with a single click from the context menu.
- 🔧 **Developer Tools**: Inspect element details, including selectors and attributes, directly in Chrome DevTools.
- 🌍 **Internationalization**: Supports English and Chinese interfaces.
- ⚙️ **Customizable & Controllable**:
  - Enable or disable the Magic Copy feature entirely with a single switch.
  - Configure output format, what metadata to attach (title, URL), and interaction preferences.
- 🎨 **Modern UI**: Beautiful and responsive popup interface.
- 🚀 **High Performance**: Built with performance in mind, ensuring a smooth user experience.
- ➕ **Clipboard Accumulator**: Consecutively copy multiple blocks of content and merge them into a single clipboard entry.

## Installation

### For Development

1. Clone the repository:
   ```bash
   git clone https://github.com/ayqy/copy.git
   cd copy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### For Production

Download the latest release from the Chrome Web Store (coming soon).

## Usage

There are three main ways to use Magic Copy:

### 1. On-Page Interaction (Click or Hover)

This is the primary way to copy specific content blocks.

1.  **Activate**:
    *   **Click/Double-Click**: Click (or double-click, depending on your settings) on any text content you wish to copy.
    *   **Hover**: Alternatively, hover your mouse over images, videos, SVGs, canvases, or other media elements.
2.  **See the Copy Button**: A blue copy button will appear near your cursor, and the targeted content block will be highlighted with a border.
3.  **Expand Selection (for Text)**:
    *   If the initial selection is too narrow (e.g., a single word), press and hold the `Alt` key (`Option` on macOS).
    *   The highlighted selection will expand to its parent block. You can press `Alt` multiple times to expand further.
    *   The copy button's position **will not change** during this process.
4.  **Click to Copy**: Click the blue button to copy the content of the currently highlighted block.

### 2. Full Page Conversion (Context Menu)

To copy the entire content of a page in a clean format:

1.  **Right-click** anywhere on the page.
2.  Select **"Convert Page to AI-Friendly Format"** from the context menu.
3.  The entire page's content will be instantly copied to your clipboard.

### 3. Using Custom Prompts (Context Menu)

1.  **Select Text**: Highlight any text on a web page.
2.  **Right-click**: Open the context menu.
3.  **Choose Prompt**: Navigate to "Magic Copy with Prompt" and select one of your custom prompts.
4.  **Formatted Text is Copied**: The selected text will be inserted into your prompt template, and the final result is copied to your clipboard.

### 4. Configure Settings & Manage Prompts

Click the extension icon in the Chrome toolbar to open the popup, where you can:
- Enable or disable Magic Copy entirely.
- Switch between single-click and double-click activation.
- Enable or disable the hover-to-copy feature for media.
- Choose your preferred output format (Markdown/Plain Text).
- **For tables, choose between Markdown and CSV format.**
- Decide whether to include the page title and URL in the copied content.
- **Manage Prompts**: Add, edit, delete, and reorder your custom prompts.

## Settings

- **Output Format**: Choose between Markdown and Plain Text
- **Table Copy Format**: Choose between Markdown and CSV
- **Additional Info**: Optionally attach page title and/or source URL
- **Language**: Select interface language (System, English, or Chinese)
- **Clipboard Accumulator**: Enable or disable the clipboard accumulator feature. When enabled, holding `Shift` while clicking the copy button will append the content to a temporary stack. A regular click will merge all stacked content and copy it to the clipboard.

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome extension standard
- **TypeScript**: Fully typed codebase for better reliability
- **Modular Design**: Separated concerns with shared utilities
- **Performance Optimized**: Uses RequestIdleCallback and debounced events

### Project Structure

```
src/
├── content/          # Content script
├── popup/           # Extension popup UI
├── shared/          # Shared utilities
│   ├── block-identifier.ts    # Content detection logic
│   ├── ui-injector.ts        # Button injection and management
│   ├── content-processor.ts  # Content formatting
│   └── settings-manager.ts   # Settings management
├── assets/          # Icons and static assets
└── background.ts    # Background service worker
```

### Build System

- **Custom Inlining Script**: `scripts/inline-build.ts` preprocesses `src/content/content.ts` by inlining shared modules (from `src/shared/`) directly into it. This creates a single, cohesive content script ready for Vite.
- **Vite**: Modern build tool then compiles the preprocessed content script and other assets (popup, background script).
- **ESLint + Prettier**: Code quality and formatting.
- **Sharp**: Icon generation from PNG/SVG (auto-detects source format).

## Development

### Scripts

- `npm run dev`: Watch mode for development
- `npm run build`: Production build
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm run type-check`: TypeScript type checking

### Publishing Process

To create a new release of the extension, use the automated publish script:

```bash
npm run publish
```

This script will guide you through the following steps:

1.  **Version Bump**: Automatically suggests a new version number (patch increment) based on `manifest.json`. You will be asked to confirm.
2.  **Git Commit & Tag**: Commits the version change with a message like `chore: bump version to x.y.z` and creates a Git tag `vx.y.z`.
3.  **Build**: Runs `npm run build` to generate the production-ready extension files in the `dist/` directory.
4.  **Testing Confirmation**: Prompts you to confirm that you have tested the built extension.
5.  **Packaging**: Zips the contents of the `dist/` directory into `plugin-vx.y.z.zip`. The full path to this zip file will be displayed.
6.  **GitHub Release**:
    *   If GitHub CLI (`gh`) is installed and configured, it will attempt to create a new GitHub Release, using the tag and uploading the zip file.
    *   If `gh` is not available or fails, you will be prompted to create the GitHub Release manually. The script will provide the necessary tag name and the path to the zip file.
7.  **Push to Remote**: Asks for final confirmation before pushing the commit and the new tag to the remote repository.

**Dependencies for the publish script:**

*   **Git**: Must be installed and available in your system's PATH.
*   **zip**: The `zip` command-line utility must be installed.
    *   On macOS: Usually pre-installed.
    *   On Linux: `sudo apt-get install zip` (Debian/Ubuntu) or `sudo yum install zip` (Fedora/CentOS).
    *   On Windows: You might need to install it separately (e.g., via [Git for Windows SDK](https://gitforwindows.org/) which includes common Unix tools, or other sources).
*   **GitHub CLI (`gh`)** (Optional, for automatic GitHub Release creation):
    *   **Installation**:
        *   On macOS: `brew install gh`
        *   On Linux: See [installation guide](https://cli.github.com/manual/installation)
        *   On Windows: See [installation guide](https://cli.github.com/manual/installation)
    *   **Authentication**: After installation, you need to authenticate with your GitHub account:
        *   Run `gh auth login` and follow the prompts
        *   For detailed authentication options, see the [official documentation](https://cli.github.com/manual/gh_auth_login)

## Developer Tools

For web developers and QA engineers, Magic Copy includes a handy DevTools panel.

1.  **Open DevTools**: Press `F12` or right-click on the page and select "Inspect".
2.  **Go to Elements Panel**: Select the "Elements" tab.
3.  **Find MagicCopy Sidebar**: In the right-hand pane (where you usually see Styles, Computed, etc.), find and click on the "MagicCopy" tab.
4.  **Inspect Elements**: As you select different elements in the Elements panel, the MagicCopy sidebar will display a structured JSON object containing:
    - `tagName`
    - Important `attributes` (like `id`, `class`, `data-*`, etc.)
    - `innerText`
    - `selectors` (including CSS, XPath, and a stable selector)
5.  **Copy Details**: Click the "Copy" button in the sidebar to copy the complete JSON object to your clipboard.

### Testing

Load the extension in Chrome's developer mode and test on various websites.

1.  **Settings Panel**:
    - Toggle the main "Enable Magic Copy" switch. Verify all on-page features (click, hover) are disabled/enabled.
    - Switch between "Single Click" and "Double Click" interaction modes and test the activation behavior on text elements.
    - Toggle "Enable Hover-to-Copy". Verify that hovering over media elements does/does not activate the copy button.
    - Test all other settings (output format, attach info) and ensure they are applied correctly.

2.  **On-Page Functionality**:
    - **Click/Dbl-Click**: Test on various text elements. Verify the button appears and the element is bordered. Check that it doesn't appear on non-viable elements.
- **Table Selection**: Click inside any part of a table (`<td>`, `<th>`, `<tr>`). The entire `<table>` should be highlighted and become the copy target.
    - **Selection Expansion**: On a small text element, use the `Alt`/`Option` key to expand the selection. Verify the border updates while the button position remains static.
    - **Hover-to-Copy**: Hover over images, videos, SVGs, etc. Verify the button appears and content is copied correctly. Ensure it doesn't trigger for very small media elements.

3.  **Context Menu**:
    - Right-click on a page and select "Convert Page to AI-Friendly Format".
    - Paste the content and verify it represents the entire page's text in the correct format.

4.  **DevTools Panel**:
    - Open the DevTools and navigate to the MagicCopy sidebar in the Elements panel.
    - Select various elements on the page and confirm the JSON details are displayed correctly.
    - Test the "Copy" button in the sidebar.

## Browser Compatibility

- Chrome 88+ (Manifest V3 requirement)
- Chromium-based browsers (Edge, Brave, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure linting passes
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Report bugs: [GitHub Issues](https://github.com/ayqy/copy/issues)
- Feature requests: [GitHub Discussions](https://github.com/ayqy/copy/discussions)
- Documentation: [GitHub Wiki](https://github.com/ayqy/copy/wiki)
