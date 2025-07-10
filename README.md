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

1. **Hover over content**: Move your mouse over any content on a web page
2. **See the copy button**: A blue copy button will appear near your cursor for viable content blocks
3. **Click to copy**: Click the button to copy the content in your preferred format
4. **Configure settings**: Click the extension icon to open settings and customize behavior

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

- **Vite**: Modern build tool with TypeScript support
- **ESLint + Prettier**: Code quality and formatting
- **Sharp**: Icon generation from SVG

## Development

### Scripts

- `npm run dev`: Watch mode for development
- `npm run build`: Production build
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm run type-check`: TypeScript type checking

### Testing

Load the extension in Chrome's developer mode and test on various websites:

1. Visit different types of websites (news, blogs, documentation)
2. Test hover detection on different content blocks
3. Verify copy functionality with different settings
4. Test internationalization by changing language settings

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
