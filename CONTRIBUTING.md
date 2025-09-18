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
├── assets/          # Icons and static assets
└── background.ts    # Background service worker
eslint-rules/        # Custom ESLint rules for i18n
scripts/
├── check-i18n.ts    # i18n compliance checker
└── ...              # Other build scripts
```

### Build System

- **Custom Inlining Script**: `scripts/inline-build.ts` preprocesses `src/content/content.ts` by inlining shared modules (from `src/shared/`) directly into it. This creates a single, cohesive content script ready for Vite.
- **Vite**: Modern build tool then compiles the preprocessed content script and other assets (popup, background script).
- **ESLint + Prettier**: Code quality and formatting.
- **Custom ESLint Rules**: Custom rules for project-specific requirements (e.g., i18n string detection).
- **i18n Validation**: Automated detection of untranslated string literals using TypeScript AST analysis.
- **Pre-commit Hooks**: Husky with lint-staged ensures code quality and i18n compliance before commits.
- **Sharp**: Icon generation from PNG/SVG (auto-detects source format).

## Development

### Scripts

- `npm run dev`: Watch mode for development
- `npm run build`: Production build
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm run type-check`: TypeScript type checking
- `npm run check-i18n`: Check for untranslated string literals

### Internationalization (i18n) Guidelines

This project enforces strict i18n compliance to ensure all user-facing text is properly localized.

#### Automated Detection System

- **ESLint Rule**: Real-time detection of untranslated strings during development
- **Check Script**: Run `npm run check-i18n` to scan all TypeScript files
- **Pre-commit Hook**: Automatically validates i18n compliance before commits

#### Development Requirements

1. **Use `chrome.i18n.getMessage()`** for all user-facing strings
2. **Define keys in `_locales/*/messages.json`** for both English and Chinese
3. **Provide fallback strings** using `chrome.i18n.getMessage('key') || 'fallback'`
4. **Run i18n check** before submitting PRs

#### Technical Strings Excluded

The system automatically ignores CSS properties, file paths, DOM selectors, console messages, and other technical identifiers.

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

Our extension includes a browser-based test suite to ensure the core content conversion logic is working correctly and to prevent regressions, especially content loss. Please run these tests after making any changes to the content processing or DOM handling code.

#### One-Time Setup

After cloning the repository, you need to install the necessary dependencies and build the test files for the first time.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Build Test Suite**:
    This command compiles the test runner and creates a manifest of all test cases.
    ```bash
    npm run build:tests
    ```

#### Running the Tests

You can run the tests directly in your browser using one of two methods:

**Method 1: The 'Easter Egg' (Recommended)**

1.  Load the extension in your browser in developer mode.
2.  Open the extension's **Settings** page.
3.  Rapidly click the **sync status button** (the cloud icon in the top right) **3 times**.
4.  The Test Runner page will open in a new tab.

**Method 2: Direct File Access**

*   In your browser, open the file `public/test/index.html` located in the project's root directory.

#### The Testing Workflow

1.  On the Test Runner page, click **'Run All Tests'**.
2.  Review the results. If a test fails, it will be highlighted in red and will show the difference between the 'Actual Output' and the 'Expected Snapshot'.
3.  **If the 'Actual Output' is correct** (meaning your code change is valid and the snapshot is outdated), you need to update the snapshot:
    a. At the bottom of the page, click the **'Generate Update Batch'** button.
    b. Click the **'Copy Batch'** button to copy the generated JSON data to your clipboard.
    c. In your terminal, run the following command:
       ```bash
       npm run apply-snapshots
       ```
    d. This command reads the data from your clipboard and automatically updates all the necessary snapshot files.
    e. Re-run the tests in the browser to confirm that they now pass.

#### Adding New Tests

1.  Create a new HTML file (e.g., `my-new-case.html`) inside the `test/cases/` directory.
2.  Add the specific HTML snippet you want to test into this file.
3.  Re-build the test manifest by running:
    ```bash
    npm run build:tests
    ```
4.  Open the Test Runner. Your new test will appear. Run it and generate its first snapshot using the workflow described above.

## Browser Compatibility

- Chrome 88+ (Manifest V3 requirement)
- Chromium-based browsers (Edge, Brave, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure linting passes
5. **Ensure i18n compliance**: Run `npm run check-i18n` to verify all user-facing strings are properly localized
6. Submit a pull request

### Code Quality Requirements

Before submitting a pull request:
- Ensure ESLint passes (including i18n rules)
- Run `npm run check-i18n` to verify string localization
- Update both English and Chinese translations in `_locales/`

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Report bugs: [GitHub Issues](https://github.com/ayqy/copy/issues)
- Feature requests: [GitHub Discussions](https://github.com/ayqy/copy/discussions)
- Documentation: [GitHub Wiki](https://github.com/ayqy/copy/wiki)
