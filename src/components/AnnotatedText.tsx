import { useMemo } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { GLOSSARY } from '../data/glossary';

interface AnnotatedTextProps {
  text: string;
  style?: TextStyle;
  // When provided, only words whose glossary key is in this set are highlighted.
  // The parent uses this to restrict highlighting to the first occurrence across all verses.
  allowedKeys?: Set<string>;
  onWordPress: (word: string, definition: string) => void;
}

interface Token {
  text: string;
  glossaryKey?: string;
}

function tokenize(text: string, allowedKeys?: Set<string>): Token[] {
  const parts = text.split(/(\s+)/);
  const seenInVerse = new Set<string>();
  return parts.map((part) => {
    const cleaned = part.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
    if (
      cleaned &&
      GLOSSARY[cleaned] &&
      !seenInVerse.has(cleaned) &&
      (!allowedKeys || allowedKeys.has(cleaned))
    ) {
      seenInVerse.add(cleaned);
      return { text: part, glossaryKey: cleaned };
    }
    return { text: part };
  });
}

export default function AnnotatedText({ text, style, allowedKeys, onWordPress }: AnnotatedTextProps) {
  const tokens = useMemo(() => tokenize(text, allowedKeys), [text, allowedKeys]);

  return (
    <Text style={style}>
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
