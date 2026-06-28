import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AnnotatedText from '../components/AnnotatedText';
import { DayReading, Verse, fetchTodayReading } from '../services/sefaria';
import { Rite } from '../data/schedule';
import { DAY_NAMES_EN, formatAliyotLabel } from '../utils/aliyah';
import { getWeekday } from '../utils/today';
import { cancelReminders, scheduleReminders } from '../services/notifications';
import { isTodayRead, markTodayRead, unmarkTodayRead } from '../utils/storage';
import { refreshWeeklyStreak } from '../utils/tracker';

type DisplayMode = 'hebrew' | 'english' | 'both';

const MODES: { key: DisplayMode; label: string }[] = [
  { key: 'hebrew', label: 'עברית' },
  { key: 'english', label: 'English' },
  { key: 'both', label: 'Both' },
];

const RITES: { key: Rite; label: string }[] = [
  { key: 'ashkenazi', label: 'Ashkenazi' },
  { key: 'sephardi', label: 'Sephardi' },
];

// Scripture is wrapped in guillemets « » rather than quotation marks so it can't
// be confused with the speech quotes that appear inside the verses themselves.
// A single pair wraps the whole block, so in bilingual mode the Hebrew and
// English are wrapped together as one quotation.
function buildShareText(book: string, verse: Verse, mode: DisplayMode): string {
  const source = `${book} ${verse.ref}`.trim();
  const lines: string[] = [];
  if ((mode === 'hebrew' || mode === 'both') && verse.he) lines.push(verse.he);
  if ((mode === 'english' || mode === 'both') && verse.en) lines.push(verse.en);
  return `«${lines.join('\n')}»\n— ${source}`;
}

export default function HomeScreen() {
  const [reading, setReading] = useState<DayReading | null>(null);
  const [isShabbat, setIsShabbat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<DisplayMode>('both');
  const [rite, setRite] = useState<Rite>('ashkenazi');
  const [isRead, setIsRead] = useState(false);
  const [streak, setStreak] = useState(0);
  const [glossaryWord, setGlossaryWord] = useState<{ word: string; definition: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dayName = DAY_NAMES_EN[getWeekday()];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [result, read] = await Promise.all([fetchTodayReading(rite), isTodayRead()]);
      setReading(result);
      setIsShabbat(result === null);
      setIsRead(read);
      if (result === null || read) cancelReminders();
      else scheduleReminders();
      setStreak(await refreshWeeklyStreak());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [rite]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const handleCopyVerse = useCallback(
    async (book: string, verse: Verse, key: string) => {
      await Clipboard.setStringAsync(buildShareText(book, verse, mode));
      setCopiedKey(key);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopiedKey(null), 1500);
    },
    [mode],
  );

  const handleToggleRead = async () => {
    if (isRead) {
      await unmarkTodayRead();
      setIsRead(false);
      scheduleReminders();
    } else {
      await markTodayRead();
      setIsRead(true);
      cancelReminders();
    }
    setStreak(await refreshWeeklyStreak());
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading today's reading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isShabbat || !reading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.parashaHe}>שבת שלום</Text>
          <Text style={styles.parashaEn}>Shabbat Shalom</Text>
          <Text style={styles.aliyahLabel}>No reading today — enjoy your Shabbat!</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.shabbatText}>Rest and recharge. Your next reading is on Sunday.</Text>
        </View>
      </View>
    );
  }

  const totalWords = reading.verses.reduce(
    (s, v) => s + v.en.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  const readingMinutes = Math.max(1, Math.round(totalWords / 200));
  const sectionLabel = reading.isHaftarah ? 'Haftarah' : formatAliyotLabel(reading.aliyot);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.parashaHe}>{reading.parashaHe}</Text>
        <Text style={styles.parashaEn}>Parshat {reading.parashaEn}</Text>
        <Text style={styles.aliyahLabel}>
          {sectionLabel} · {dayName}
        </Text>
        <Text style={styles.refLabel}>{reading.heRef}</Text>
        <Text style={styles.refLabelEn}>{reading.ref}</Text>

        {/* Friday: Ashkenazi / Sephardi Haftarah toggle */}
        {reading.isHaftarah && (
          <View style={styles.riteRow}>
            {RITES.map(({ key, label }) => (
              <Pressable
                key={key}
                style={[styles.riteBtn, rite === key && styles.riteBtnActive]}
                onPress={() => setRite(key)}
              >
                <Text style={[styles.riteText, rite === key && styles.riteTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Language Toggle + Reading Time */}
      <View style={styles.toggleRow}>
        {MODES.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.toggleBtn, mode === key && styles.toggleBtnActive]}
            onPress={() => setMode(key)}
          >
            <Text style={[styles.toggleText, mode === key && styles.toggleTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
        <Text style={styles.readingTime}>~{readingMinutes} min</Text>
      </View>

      {/* Text Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {reading.verses.map((verse, i) => (
          <View key={i} style={styles.verseBlock}>
            <View style={styles.verseNumberRow}>
              <Text style={styles.verseNumber}>{i + 1}</Text>
              <Text style={styles.verseRef}>{verse.ref}</Text>
            </View>
            {(mode === 'hebrew' || mode === 'both') && (
              <Text style={styles.hebrewText}>{verse.he}</Text>
            )}
            {(mode === 'english' || mode === 'both') && (
              <AnnotatedText
                text={verse.en}
                style={styles.englishText}
                onWordPress={(word, definition) => setGlossaryWord({ word, definition })}
              />
            )}
            <View style={styles.copyRow}>
              <TouchableOpacity
                onPress={() => handleCopyVerse(reading.book, verse, `${i}`)}
                hitSlop={8}
                accessibilityLabel="Copy verse"
              >
                <Text style={styles.copyBtn}>
                  {copiedKey === `${i}` ? '✓' : '⧉'}
                </Text>
              </TouchableOpacity>
            </View>
            {i < reading.verses.length - 1 && <View style={styles.verseDivider} />}
          </View>
        ))}
      </ScrollView>

      {/* Glossary Popup */}
      <Modal
        visible={glossaryWord !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setGlossaryWord(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setGlossaryWord(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalWord}>{glossaryWord?.word}</Text>
            <Text style={styles.modalDefinition}>{glossaryWord?.definition}</Text>
          </View>
        </Pressable>
      </Modal>

      {/* Mark as Read */}
      <View style={styles.footer}>
        {streak > 0 && (
          <Text style={styles.streakText}>
            {streak} week{streak === 1 ? '' : 's'} in a row · keep it up!
          </Text>
        )}
        <TouchableOpacity
          style={[styles.readBtn, isRead && styles.readBtnDone]}
          onPress={handleToggleRead}
        >
          <Text style={styles.readBtnText}>
            {isRead ? '✓ Read Today' : 'Mark as Read'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PARCHMENT = '#FDF6E3';
const BROWN = '#8B4513';
const DARK = '#3D2B1F';
const MID = '#A0826D';
const GREEN = '#5B8A3C';
const GREEN_DIM = '#3D6128';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PARCHMENT,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PARCHMENT,
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: MID,
    fontSize: 15,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: BROWN,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    backgroundColor: BROWN,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  parashaHe: {
    fontSize: 28,
    color: '#FDF6E3',
    fontFamily: 'NotoSerifHebrew_700Bold',
    marginBottom: 2,
  },
  parashaEn: {
    fontSize: 18,
    color: '#F5DEB3',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  aliyahLabel: {
    fontSize: 13,
    color: '#D4B896',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  refLabel: {
    fontSize: 12,
    color: '#C4A882',
    marginTop: 2,
    fontFamily: 'NotoSerifHebrew_400Regular',
  },
  refLabelEn: {
    fontSize: 12,
    color: '#C4A882',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  riteRow: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 8,
    padding: 3,
    gap: 3,
  },
  riteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
  },
  riteBtnActive: {
    backgroundColor: '#F5DEB3',
  },
  riteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F5DEB3',
    letterSpacing: 0.2,
  },
  riteTextActive: {
    color: BROWN,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F5EDD8',
    borderBottomWidth: 1,
    borderBottomColor: '#E8D8C0',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#EDE0CC',
  },
  toggleBtnActive: {
    backgroundColor: BROWN,
  },
  toggleText: {
    fontSize: 14,
    color: MID,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 16,
  },
  verseBlock: {
    marginBottom: 4,
  },
  verseNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  verseNumber: {
    fontSize: 13,
    lineHeight: 18,
    color: '#B0926A',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  verseRef: {
    fontSize: 13,
    lineHeight: 18,
    color: '#B0926A',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  copyRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  copyBtn: {
    fontSize: 18,
    lineHeight: 18,
    color: BROWN,
    fontWeight: '600',
    letterSpacing: 0.3,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  hebrewText: {
    fontFamily: 'NotoSerifHebrew_400Regular',
    fontSize: 22,
    lineHeight: 38,
    color: DARK,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  englishText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4A3728',
    textAlign: 'left',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  verseDivider: {
    height: 1,
    backgroundColor: '#E8D8C0',
    marginVertical: 10,
  },
  footer: {
    padding: 16,
    paddingBottom: 36,
    backgroundColor: '#F5EDD8',
    borderTopWidth: 1,
    borderTopColor: '#E8D8C0',
  },
  readBtn: {
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  readBtnDone: {
    backgroundColor: GREEN_DIM,
    opacity: 0.8,
  },
  readBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  streakText: {
    textAlign: 'center',
    color: BROWN,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  readingTime: {
    fontSize: 12,
    color: MID,
    alignSelf: 'center',
    marginLeft: 4,
  },
  shabbatText: {
    fontSize: 17,
    color: MID,
    textAlign: 'center',
    lineHeight: 26,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: PARCHMENT,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 40,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#D4B896',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalWord: {
    fontSize: 18,
    fontWeight: '700',
    color: BROWN,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  modalDefinition: {
    fontSize: 15,
    lineHeight: 22,
    color: DARK,
  },
});
