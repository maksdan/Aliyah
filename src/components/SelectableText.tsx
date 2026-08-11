import { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, Text, TextInput, TextStyle } from 'react-native';
import { GLOSSARY } from '../data/glossary';

// Why a read-only TextInput instead of <Text selectable>:
//
// <Text selectable> is unreliable on current iOS — it pops the copy menu but
// never shows a selection highlight or drag handles, so you cannot extend a
// selection across words (facebook/react-native#54686, #55187). A multiline
// TextInput with editable={false} is backed by a real UITextView, which gives
// the ordinary system behaviour: press and hold, drag the handles, Copy /
// Look Up / Share.
//
// The trade-off is that touch handlers on nested <Text> do not fire inside a
// TextInput — styles apply, presses do not. So a glossary word can no longer
// be *tapped*; instead we watch the selection, and when it lands on exactly one
// highlighted word we show its definition. Double-tap (or press-and-hold) on a
// word is precisely the gesture iOS uses to select one word, so the definition
// comes up on the same gesture a reader would already use.

interface SelectableTextProps {
  text: string;
  style?: TextStyle;
  // When provided, only words whose glossary key is in this set are highlighted.
  // The parent uses this to restrict highlighting to the first occurrence
  // across the whole reading.
  allowedKeys?: Set<string>;
  onWordSelect?: (word: string, definition: string) => void;
}

interface Token {
  text: string;
  glossaryKey?: string;
}

function normalize(word: string): string {
  return word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
}

function tokenize(text: string, allowedKeys?: Set<string>): Token[] {
  const parts = text.split(/(\s+)/);
  const seenInVerse = new Set<string>();
  const result: Token[] = [];

  for (const part of parts) {
    const cleaned = normalize(part);
    if (
      cleaned &&
      GLOSSARY[cleaned] &&
      !seenInVerse.has(cleaned) &&
      (!allowedKeys || allowedKeys.has(cleaned))
    ) {
      seenInVerse.add(cleaned);
      // Strip leading/trailing punctuation from the highlighted span.
      // Mid-word hyphens (e.g. "Beer-sheba") stay part of the word.
      const prefixLen = part.match(/^[^a-zA-Z]*/)?.[0].length ?? 0;
      const suffixLen = part.match(/[^a-zA-Z]*$/)?.[0].length ?? 0;
      const prefix = part.slice(0, prefixLen);
      const word = part.slice(prefixLen, part.length - suffixLen || undefined);
      const suffix = suffixLen ? part.slice(part.length - suffixLen) : '';
      if (prefix) result.push({ text: prefix });
      result.push({ text: word, glossaryKey: cleaned });
      if (suffix) result.push({ text: suffix });
    } else {
      result.push({ text: part });
    }
  }

  return result;
}

export default function SelectableText({
  text,
  style,
  allowedKeys,
  onWordSelect,
}: SelectableTextProps) {
  const tokens = useMemo(
    () => (onWordSelect ? tokenize(text, allowedKeys) : null),
    [text, allowedKeys, onWordSelect],
  );

  const handleSelectionChange = useCallback(
    (start: number, end: number) => {
      if (!onWordSelect || end <= start) return;
      // Only a single-word selection opens a definition; dragging across a
      // phrase is an ordinary copy and must stay out of the way.
      const selected = text.slice(start, end).trim();
      if (!selected || /\s/.test(selected)) return;
      const key = normalize(selected);
      if (!key || !GLOSSARY[key]) return;
      if (allowedKeys && !allowedKeys.has(key)) return;
      onWordSelect(key, GLOSSARY[key]);
    },
    [text, allowedKeys, onWordSelect],
  );

  return (
    <TextInput
      style={[styles.base, style]}
      editable={false}
      multiline
      scrollEnabled={false}
      selectTextOnFocus={false}
      // Android needs this to stop the field grabbing focus like an input.
      showSoftInputOnFocus={false}
      onSelectionChange={
        onWordSelect
          ? e => handleSelectionChange(e.nativeEvent.selection.start, e.nativeEvent.selection.end)
          : undefined
      }
    >
      {tokens
        ? tokens.map((token, i) =>
            token.glossaryKey ? (
              <Text key={i} style={styles.glossaryWord}>
                {token.text}
              </Text>
            ) : (
              token.text
            ),
          )
        : text}
    </TextInput>
  );
}

const styles = StyleSheet.create({
  base: {
    // TextInput carries platform chrome a Text does not; strip it so the
    // passage sits exactly where the old <Text> did.
    padding: 0,
    margin: 0,
    ...Platform.select({
      android: { textAlignVertical: 'top', includeFontPadding: false },
      default: {},
    }),
  },
  glossaryWord: {
    backgroundColor: 'rgba(176, 146, 106, 0.25)',
  },
});
