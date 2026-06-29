import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { DayReading, Verse, fetchTargumVerses, fetchTodayReading } from '../services/sefaria';
import { Rite, SEPHARDI_HAFTARAH } from '../data/schedule';
import { GLOSSARY } from '../data/glossary';
import { formatAliyotLabel } from '../utils/aliyah';
import { cancelReminders, scheduleReminders } from '../services/notifications';
import { getLastSeenStreak, isDateRead, markDateRead, markStreakBannerSeen, unmarkDateRead } from '../utils/storage';
import { refreshWeeklyStreak } from '../utils/tracker';

type DisplayMode = 'bilingual' | 'targum';

const MODES: { key: DisplayMode; label: string }[] = [
  { key: 'bilingual', label: 'English' },
  { key: 'targum', label: 'Aramaic' },
];

const RITES: { key: Rite; label: string }[] = [
  { key: 'ashkenazi', label: 'Ashkenazi' },
  { key: 'sephardi', label: 'Sephardi' },
];

function buildShareText(book: string, verse: Verse, mode: DisplayMode, targumVerse?: Verse): string {
  const source = `${book} ${verse.ref}`.trim();
  const lines: string[] = [];
  if (verse.he) lines.push(verse.he);
  if (mode === 'bilingual' && verse.en) lines.push(verse.en);
  if (mode === 'targum' && targumVerse?.he) lines.push(targumVerse.he);
  return `«${lines.join('\n')}»\n— ${source}`;
}

export default function HomeScreen() {
  const [reading, setReading] = useState<DayReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [offsetDays, setOffsetDays] = useState(0);
  const [mode, setMode] = useState<DisplayMode>('bilingual');
  const [targumVerses, setTargumVerses] = useState<Verse[] | null>(null);
  const [targumLoading, setTargumLoading] = useState(false);
  const [targumUnavailable, setTargumUnavailable] = useState(false);
  const [rite, setRite] = useState<Rite>('ashkenazi');
  const [isRead, setIsRead] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showStreakBanner, setShowStreakBanner] = useState(false);
  const [glossaryWord, setGlossaryWord] = useState<{ word: string; definition: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Animate streak toast in, hold, then fade out.
  useEffect(() => {
    if (!showStreakBanner) return;
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setShowStreakBanner(false));
  }, [showStreakBanner, toastAnim]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMode('bilingual');
    setTargumVerses(null);
    setTargumUnavailable(false);
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    try {
      const [result, read] = await Promise.all([fetchTodayReading(rite, target), isDateRead(target)]);
      setReading(result);
      setIsRead(read);
      // Only manage reminders based on today's reading, not a navigated day.
      if (offsetDays === 0) {
        if (result === null || read) cancelReminders();
        else scheduleReminders();
      }
      const newStreak = await refreshWeeklyStreak();
      setStreak(newStreak);
      const lastSeen = await getLastSeenStreak();
      if (newStreak > 0 && newStreak > lastSeen) {
        setShowStreakBanner(true);
        await markStreakBannerSeen(newStreak);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [rite, offsetDays]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const handleModeChange = useCallback(async (newMode: DisplayMode) => {
    setMode(newMode);
    if (newMode === 'targum' && !targumVerses && !targumLoading && !targumUnavailable && reading) {
      setTargumLoading(true);
      const verses = await fetchTargumVerses(reading.ref);
      setTargumLoading(false);
      if (verses) setTargumVerses(verses);
      else setTargumUnavailable(true);
    }
  }, [targumVerses, targumLoading, targumUnavailable, reading]);

  const handleCopyVerse = useCallback(
    async (book: string, verse: Verse, key: string, targumVerse?: Verse) => {
      await Clipboard.setStringAsync(buildShareText(book, verse, mode, targumVerse));
      setCopiedKey(key);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopiedKey(null), 1500);
    },
    [mode],
  );

  const handleToggleRead = async () => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    if (isRead) {
      await unmarkDateRead(target);
      setIsRead(false);
      if (offsetDays === 0) scheduleReminders();
    } else {
      await markDateRead(target);
      setIsRead(true);
      if (offsetDays === 0) cancelReminders();
    }
    const newStreak = await refreshWeeklyStreak();
    setStreak(newStreak);
    const lastSeen = await getLastSeenStreak();
    if (newStreak > 0 && newStreak > lastSeen) {
      setShowStreakBanner(true);
      await markStreakBannerSeen(newStreak);
    }
  };

  // Pre-compute which glossary keys appear for the first time in each verse,
  // so AnnotatedText highlights only the first occurrence across the whole reading.
  const verseGlossaryKeys = useMemo(() => {
    if (!reading) return [] as Set<string>[];
    const seen = new Set<string>();
    return reading.verses.map(verse => {
      const allowed = new Set<string>();
      for (const part of verse.en.split(/\s+/)) {
        const key = part.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
        if (GLOSSARY[key] && !seen.has(key)) {
          seen.add(key);
          allowed.add(key);
        }
      }
      return allowed;
    });
  }, [reading]);

  // Full-screen spinner only on the very first load (no previous content to show).
  if (loading && !reading) {
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

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + offsetDays);
  const navLabel = offsetDays === -1 ? 'Yesterday'
    : offsetDays === 1 ? 'Tomorrow'
    : offsetDays === 0 ? 'Today'
    : targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const navRow = (
    <View style={styles.navRow}>
      <Pressable
        onPress={() => setOffsetDays(o => o - 1)}
        hitSlop={16}
        disabled={loading}
        accessibilityLabel="Previous day"
      >
        <Text style={[styles.navArrow, loading && styles.navArrowDisabled]}>‹</Text>
      </Pressable>
      {offsetDays !== 0 ? (
        <Pressable onPress={() => setOffsetDays(0)} hitSlop={8} accessibilityLabel="Return to today">
          <Text style={[styles.navLabel, styles.navLabelTappable]}>{navLabel}</Text>
        </Pressable>
      ) : (
        <Text style={styles.navLabel}>{navLabel}</Text>
      )}
      <Pressable
        onPress={() => setOffsetDays(o => o + 1)}
        hitSlop={16}
        disabled={loading}
        accessibilityLabel="Next day"
      >
        <Text style={[styles.navArrow, loading && styles.navArrowDisabled]}>›</Text>
      </Pressable>
    </View>
  );

  if (!reading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          {navRow}
          <Text style={styles.parashaHe}>שבת שלום</Text>
          <Text style={styles.parashaEn}>Shabbat Shalom</Text>
          <Text style={styles.aliyahLabel}>No reading on Shabbat</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.shabbatText}>Rest and recharge.</Text>
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
        {navRow}
        <Text style={styles.parashaHe}>{reading.parashaHe}</Text>
        <Text style={styles.parashaEn}>Parshat {reading.parashaEn}</Text>
        <Text style={styles.aliyahLabel}>
          {sectionLabel}
        </Text>
        <Text style={styles.dayLabel}>{reading.day}</Text>
        <Text style={styles.refLabel}>{reading.heRef}</Text>
        <Text style={styles.refLabelEn}>{reading.ref}</Text>

        {/* Friday: Ashkenazi / Sephardi Haftarah toggle — only when the two rites differ */}
        {reading.isHaftarah && SEPHARDI_HAFTARAH[reading.parashaEn] !== undefined && (
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

      {/* Language Tabs + Reading Time — mode tabs hidden for Haftarah (no Aramaic) */}
      <View style={styles.toggleRow}>
        {!reading.isHaftarah && MODES.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.toggleBtn, mode === key && styles.toggleBtnActive]}
            onPress={() => handleModeChange(key)}
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
        {mode === 'targum' && targumLoading && (
          <ActivityIndicator color={BROWN} style={{ marginBottom: 16 }} />
        )}
        {mode === 'targum' && targumUnavailable && (
          <Text style={styles.targumNote}>
            Targum Onkelos is not available for this reading.
          </Text>
        )}
        {reading.verses.map((verse, i) => {
          const targumVerse = targumVerses?.[i];
          return (
            <View key={i} style={styles.verseBlock}>
              <View style={styles.verseNumberRow}>
                <Text style={styles.verseNumber}>{i + 1}</Text>
                <Text style={styles.verseRef}>{verse.ref}</Text>
              </View>
              <Text style={styles.hebrewText}>{verse.he}</Text>
              {mode === 'bilingual' && (
                <AnnotatedText
                  text={verse.en}
                  style={styles.englishText}
                  allowedKeys={verseGlossaryKeys[i]}
                  onWordPress={(word, definition) => setGlossaryWord({ word, definition })}
                />
              )}
              {mode === 'targum' && targumVerse && (
                <Text style={styles.targumText}>{targumVerse.he}</Text>
              )}
              <View style={styles.copyRow}>
                <TouchableOpacity
                  onPress={() => handleCopyVerse(reading.book, verse, `${i}`, targumVerse)}
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
          );
        })}
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
        <TouchableOpacity
          style={[styles.readBtn, isRead && styles.readBtnDone]}
          onPress={handleToggleRead}
        >
          <Text style={styles.readBtnText}>
            {isRead ? `✓ Read${offsetDays === 0 ? ' Today' : ''}` : 'Mark as Read'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Streak toast — floats above footer, auto-dismisses */}
      {showStreakBanner && (
        <Animated.View style={[styles.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }]}>
          <Text style={styles.toastText}>
            {streak} week{streak === 1 ? '' : 's'} in a row · keep it up!
          </Text>
        </Animated.View>
      )}

      {/* Subtle overlay while navigating between days */}
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={BROWN} />
        </View>
      )}
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
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  navArrow: {
    fontSize: 30,
    color: '#F5DEB3',
    lineHeight: 34,
    paddingHorizontal: 4,
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  navLabel: {
    fontSize: 11,
    color: '#D4B896',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  navLabelTappable: {
    color: '#F5DEB3',
    textDecorationLine: 'underline',
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
    fontSize: 15,
    color: '#F5DEB3',
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  dayLabel: {
    fontSize: 12,
    color: '#D4B896',
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
  targumText: {
    fontFamily: 'NotoSerifHebrew_400Regular',
    fontSize: 19,
    lineHeight: 34,
    color: '#5C3D1E',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
    opacity: 0.85,
  },
  targumNote: {
    fontSize: 14,
    color: MID,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
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
  toast: {
    position: 'absolute',
    bottom: 110,
    left: 24,
    right: 24,
    backgroundColor: BROWN,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: PARCHMENT,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(253, 246, 227, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
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
