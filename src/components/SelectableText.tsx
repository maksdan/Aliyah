import { useMemo } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { GLOSSARY } from '../data/glossary';

// Renders a passage as plain <Text>.
//
// An earlier version rendered each passage as a read-only multiline TextInput
// to get real drag-selection. That clipped the text: RN measures an
// auto-sizing TextInput with Yoga, but UITextView lays the text out itself, and
// the two disagree once a custom lineHeight is involved — so the last line of
// every verse, the closing words and the sof pasuq, was cut off. Driving the
// height from onContentSizeChange did not fix it either.
//
// Correct, complete text matters more than the selection gesture, and <Text>
// has always measured correctly here. Free-form selection across the whole
// passage now lives behind the "select text" button instead, where the
// TextInput can scroll and therefore needs no intrinsic measurement at all.

interface SelectableTextProps {
  text: string;
  style?: TextStyle;
  // When provided, only words whose glossary key is in this set are highlighted.
  // The parent uses this to restrict highlighting to the first occurrence
  // across the whole reading.
  allowedKeys?: Set<string>;
  onWordPress?: (word: string, definition: string) => void;
}

interface Token {
  text: string;
  glossaryKey?: string;
}

function tokenize(text: string, allowedKeys?: Set<string>): Token[] {
  const parts = text.split(/(\s+)/);
  const seenInVerse = new Set<string>();
  const result: Token[] = [];

  for (const part of parts) {
    const cleaned = part.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
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
  onWordPress,
}: SelectableTextProps) {
  const tokens = useMemo(
    () => (onWordPress ? tokenize(text, allowedKeys) : null),
    [text, allowedKeys, onWordPress],
  );

  if (!tokens) {
    return (
      <Text style={style}>
        {text}
      </Text>
    );
  }

  return (
    <Text style={style}>
      {tokens.map((token, i) =>
        token.glossaryKey ? (
          <Text
            key={i}
            style={styles.glossaryWord}
            onPress={() => onWordPress!(token.glossaryKey!, GLOSSARY[token.glossaryKey!])}
          >
            {token.text}
          </Text>
        ) : (
          token.text
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  glossaryWord: {
    backgroundColor: 'rgba(176, 146, 106, 0.25)',
  },
});
