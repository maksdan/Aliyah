import { useMemo } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { GLOSSARY } from '../data/glossary';

interface AnnotatedTextProps {
  text: string;
  style?: TextStyle;
  onWordPress: (word: string, definition: string) => void;
}

interface Token {
  text: string;
  glossaryKey?: string;
}

function tokenize(text: string): Token[] {
  const parts = text.split(/(\s+)/);
  return parts.map((part) => {
    const cleaned = part.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
    if (cleaned && GLOSSARY[cleaned]) {
      return { text: part, glossaryKey: cleaned };
    }
    return { text: part };
  });
}

export default function AnnotatedText({ text, style, onWordPress }: AnnotatedTextProps) {
  const tokens = useMemo(() => tokenize(text), [text]);

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
    backgroundColor: 'rgba(176, 146, 106, 0.15)',
    textDecorationLine: 'underline',
    textDecorationColor: '#B0926A',
  },
});
