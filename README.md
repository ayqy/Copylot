# AI Copilot – MagicCopy

A Chrome browser extension that intelligently copies web page content in AI-friendly formats.

## Features

- 🎯 **Smart Content Detection**: Automatically identifies viable content blocks on web pages
- 📝 **Multiple Output Formats**: Copy content as Markdown or plain text
- 🌍 **Internationalization**: Supports English and Chinese interfaces
- ⚙️ **Customizable Settings**: Configure output format, additional info, and language preferences
- 🎨 **Modern UI**: Beautiful and responsive popup interface
- 🚀 **High Performance**: Uses RequestIdleCallback for optimal performance

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

1. **Click on content**: Click directly on any text content on a web page that you wish to copy.
2. **See the copy button**: A blue copy button will appear near your cursor, and the selected content block will be highlighted with a border.
3. **Expand selection (Optional)**:
    - If the initial selection is too small (e.g., just a single word or paragraph), press and hold the `Alt` key (or `Option` key on macOS).
    - The highlighted selection will expand to its parent block. You can press `Alt` multiple times to expand further.
    - The copy button's position **will not change** during this process; it remains where you initially clicked.
4. **Click to copy**: Click the blue button to copy the content of the currently highlighted block in your preferred format.
5. **Configure settings**: Click the extension icon to open settings and customize behavior (output format, language, etc.).

## Settings

- **Output Format**: Choose between Markdown and Plain Text
- **Additional Info**: Optionally attach page title and/or source URL
- **Language**: Select interface language (System, English, or Chinese)

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
- **Sharp**: Icon generation from SVG.

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
    *   Installation instructions can be found at [cli.github.com](https://cli.github.com/).
    *   You'll need to authenticate `gh` with your GitHub account (e.g., using `gh auth login`).

### Testing

Load the extension in Chrome's developer mode and test on various websites:

1. Visit different types of websites (news, blogs, documentation).
2. **Click-to-activate**:
    - Click on various text elements. Verify the copy button appears near the cursor and the element gets a border.
    - Click on non-viable areas. Verify the button and border (if previously visible) disappear.
    - Click from one viable element to another. Verify the button and border move correctly.
3. **Alt/Option Key for Selection Expansion**:
    - Click on a small text element to show the button and border.
    - Press `Alt`/`Option` key. Verify the selected block expands to its parent and the border updates.
    - Crucially, verify the copy button **does not change its position** during Alt-key usage.
    - Press `Alt`/`Option` multiple times to see further expansion, ensuring the button position remains static.
    - After expanding, click the copy button and verify it copies the content of the larger, expanded block.
4. **Copy Functionality**: Verify content is copied correctly with different settings (Markdown/Plain Text, include title/URL).
5. **Settings Panel**: Test all options in the popup settings panel and ensure they apply correctly.
6. **Internationalization**: Test by changing language settings in the popup and verifying UI text updates.

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
