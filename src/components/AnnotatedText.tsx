import { useMemo } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { GLOSSARY } from '../data/glossary';

interface AnnotatedTextProps {
  text: string;
  style?: TextStyle;
  // When provided, only words whose glossary key is in this set are highlighted.
  // The parent uses this to restrict highlighting to the first occurrence across all verses.
  allowedKeys?: Set<string>;
  // Allows the OS text-selection gesture (long press) on the whole passage.
  // A short tap on a glossary word still opens its definition.
  selectable?: boolean;
  onWordPress: (word: string, definition: string) => void;
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
      // Mid-word hyphens (e.g. "first-born") are preserved as part of the word.
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

export default function AnnotatedText({
  text,
  style,
  allowedKeys,
  selectable,
  onWordPress,
}: AnnotatedTextProps) {
  const tokens = useMemo(() => tokenize(text, allowedKeys), [text, allowedKeys]);

  return (
    <Text style={style} selectable={selectable}>
      {tokens.map((token, i) =>
        token.glossaryKey ? (
          <Text
            key={i}
            style={styles.glossaryWord}
            onPress={() => onWordPress(token.glossaryKey!, GLOSSARY[token.glossaryKey!])}
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
