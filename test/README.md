# solid-contenteditable Test Suite

This test suite provides comprehensive testing for the solid-contenteditable component.

## Test Structure

### Unit Tests (`unit.test.tsx`)
Basic unit tests that verify the component's behavior using jsdom. These tests cover:
- Basic rendering and props
- Event handling and prevention
- Input types support
- Paste behavior
- Custom key bindings
- Render prop functionality
- History (undo/redo) behavior
- Platform-specific key bindings

### Unicode Tests (`unicode.test.tsx`)
Tests for international character support and Unicode edge cases:
- Various character sets (Latin, Cyrillic, Greek, CJK, Arabic, Hebrew, etc.)
- Emoji and grapheme clusters
- Special characters and symbols
- Mixed scripts and bidirectional text
- Zero-width characters
- Control characters
- Unicode normalization

### W3C Compatibility Tests (`w3c-compatibility.test.tsx`)
Documentation and compatibility matrix for W3C Input Events Level 2:
- Lists all supported input types
- Identifies unsupported input types and reasons
- Generates compatibility reports
- Provides implementation priorities

### Legacy Tests (`contenteditable.test.tsx`)
More complex integration tests that require proper browser APIs. These tests are currently failing in jsdom and would benefit from browser-based testing.

## Running Tests

```bash
# Run all tests
pnpm test

# Run client tests only
pnpm test:client

# Run server-side tests
pnpm test:ssr

# Run tests in watch mode
pnpm vitest --watch
```

## Current Test Coverage

### ✅ What's Tested
- Basic text input and deletion
- Clipboard operations (copy, paste, cut)
- History management (undo/redo)
- Custom key bindings
- International character support
- Unicode edge cases
- Render prop functionality
- Single-line vs multi-line behavior

### ⚠️ What Needs Browser Testing
Due to limitations of jsdom, the following features require real browser testing:

1. **Input Method Editor (IME) Support**
   - Composition events (`insertCompositionText`, etc.)
   - CJK language input
   - Complex character composition

2. **Selection and Caret Management**
   - Precise caret positioning
   - Selection across complex DOM structures
   - Grapheme cluster navigation

3. **Platform-Specific Behavior**
   - Different browsers handle contenteditable differently
   - OS-specific keyboard shortcuts
   - Touch input and mobile keyboards

4. **Visual Testing**
   - RTL/LTR text rendering
   - Emoji rendering across platforms
   - Font fallback behavior

## Recommended Browser Testing Setup

For comprehensive testing of contenteditable behavior, consider using:

1. **Playwright** or **Cypress** for cross-browser testing
2. **Manual testing** for IME and complex input scenarios
3. **Visual regression testing** for rendering consistency

## W3C Input Events Support

Current coverage: ~35% of W3C Input Events Level 2 specification

### Supported Input Types
- `insertText`
- `insertReplacementText`
- `insertLineBreak`
- `insertParagraph`
- `insertFromPaste`
- `deleteContentBackward`
- `deleteContentForward`
- `deleteWordBackward`
- `deleteWordForward`
- `deleteSoftLineBackward`
- `deleteSoftLineForward`
- `deleteByCut`

### Not Applicable (Plain Text)
- Formatting operations (`formatBold`, `formatItalic`, etc.)
- List operations (`insertOrderedList`, etc.)
- Rich text features

### Implementation Priorities
1. Composition events for CJK support
2. Drag & drop operations
3. Hard line operations

## Known Issues

1. **Special Characters**: Some special characters (like backtick) may cause issues
2. **Complex Grapheme Clusters**: Navigation through emoji families needs testing
3. **IME Support**: Not tested due to jsdom limitations
4. **Browser Differences**: Each browser implements contenteditable slightly differently

## Contributing

When adding new tests:
1. Add unit tests to `unit.test.tsx` for logic testing
2. Add unicode tests to `unicode.test.tsx` for character support
3. Document browser-specific tests that can't be automated
4. Update this README with any new test categories