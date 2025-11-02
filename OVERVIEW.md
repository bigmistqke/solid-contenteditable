# W3C Input Events Level 2 Specification

## Input Types Reference

| inputType | User's expression of intention | Support |
|-----------|--------------------------------|---------|
| `"insertText"` | insert typed plain text | ✅ |
| `"insertReplacementText"` | insert or replace existing content by means of a spell checker, auto-correct, writing suggestions or similar | ✅ |
| `"insertLineBreak"` | insert a line break | ✅ |
| `"insertParagraph"` | insert a paragraph break | ✅ |
| `"insertOrderedList"` | insert a numbered list | ❌ |
| `"insertUnorderedList"` | insert a bulleted list | ❌ |
| `"insertHorizontalRule"` | insert a horizontal rule | ❌ |
| `"insertFromYank"` | replace the current selection with content stored in a kill buffer | ❌ |
| `"insertFromDrop"` | insert content by means of drop | ❌ |
| `"insertFromPaste"` | paste content from clipboard or paste image from client provided image library | ✅ |
| `"insertFromPasteAsQuotation"` | paste content from the clipboard as a quotation | ❌ |
| `"insertTranspose"` | transpose the last two grapheme cluster that were entered | ❌ |
| `"insertCompositionText"` | replace the current composition string | ❌ |
| `"insertLink"` | insert a link | ❌ |
| `"deleteWordBackward"` | delete a word directly before the caret position | ✅ |
| `"deleteWordForward"` | delete a word directly after the caret position | ✅ |
| `"deleteSoftLineBackward"` | delete from the caret to the nearest visual line break before the caret position | ✅ |
| `"deleteSoftLineForward"` | delete from the caret to the nearest visual line break after the caret position | ✅ |
| `"deleteEntireSoftLine"` | delete from the nearest visual line break before the caret position to the nearest visual line break after the caret position | ❌ |
| `"deleteHardLineBackward"` | delete from the caret to the nearest beginning of a block element or `br` element before the caret position | ❌ |
| `"deleteHardLineForward"` | delete from the caret to the nearest end of a block element or `br` element after the caret position | ❌ |
| `"deleteByDrag"` | remove content from the DOM by means of drag | ❌ |
| `"deleteByCut"` | remove the current selection as part of a cut | ✅ |
| `"deleteContent"` | delete the selection without specifying the direction of the deletion and this intention is not covered by another inputType | ❌ |
| `"deleteContentBackward"` | delete the content directly before the caret position and this intention is not covered by another inputType or delete the selection with the selection collapsing to its start after the deletion | ✅ |
| `"deleteContentForward"` | delete the content directly after the caret position and this intention is not covered by another inputType or delete the selection with the selection collapsing to its end after the deletion | ✅ |
| `"historyUndo"` | undo the last editing action | ✅ |
| `"historyRedo"` | to redo the last undone editing action | ✅ |
| `"formatBold"` | initiate bold text | ❌ |
| `"formatItalic"` | initiate italic text | ❌ |
| `"formatUnderline"` | initiate underline text | ❌ |
| `"formatStrikeThrough"` | initiate stricken through text | ❌ |
| `"formatSuperscript"` | initiate superscript text | ❌ |
| `"formatSubscript"` | initiate subscript text | ❌ |
| `"formatJustifyFull"` | make the current selection fully justified | ❌ |
| `"formatJustifyCenter"` | center align the current selection | ❌ |
| `"formatJustifyRight"` | right align the current selection | ❌ |
| `"formatJustifyLeft"` | left align the current selection | ❌ |
| `"formatIndent"` | indent the current selection | ❌ |
| `"formatOutdent"` | outdent the current selection | ❌ |
| `"formatRemove"` | remove all formatting from the current selection | ❌ |
| `"formatSetBlockTextDirection"` | set the text block direction | ❌ |
| `"formatSetInlineTextDirection"` | set the text inline direction | ❌ |
| `"formatBackColor"` | change the background color | ❌ |
| `"formatFontColor"` | change the font color | ❌ |
| `"formatFontName"` | change the font-family | ❌ |