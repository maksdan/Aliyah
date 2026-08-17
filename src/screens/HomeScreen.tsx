import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import SelectableText, { glossaryKeysIn } from '../components/SelectableText';
import { DayReading, Verse, fetchTargumForReading, fetchTodayReading } from '../services/sefaria';
import { getDarkDay } from '../services/planner';
import type { DarkDay } from '../services/planner';
import { Rite, SEPHARDI_HAFTARAH } from '../data/schedule';
import { splitAtEtnachta } from '../utils/phrasing';
import { refreshReminders, requestPermissionAndSchedule } from '../services/notifications';
import { CUSTOM_TRANSLITERATION_ENABLED, PARASHA_TRANSLITERATIONS } from '../data/transliterations';
import {
  getLastSeenStreak,
  getReadingPosition,
  getSavedMode,
  getSavedRite,
  isDateRead,
  markDateRead,
  markStreakBannerSeen,
  saveMode,
  saveReadingPosition,
  saveRite,
  unmarkDateRead,
} from '../utils/storage';
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

// The half of the pasuq after the etnachta. A lift of DARK rather than a new
// hue: it should read as the same voice reaching its second phrase, not as
// different material. Widening the space at the pause was the other candidate
// and was rejected — a gap mid-verse reads as a setumah, and implying a break
// the scroll does not have is worse than no cue at all.
const PASUQ_AFTER_PAUSE = '#6E5233';

// Targum Onkelos. A cool slate, deliberately outside the brown ramp the Hebrew
// lives in: in the Aramaic tab it sits directly under the pasuq, and when it was
// another shade of brown it read as a continuation of the verse above rather
// than as a second voice.
const TARGUM_COLOR = '#46617A';

// A pasuq, cued at its own principal pause. The half after the etnachta is set
// a shade lighter, so the verse reads as the two phrases it actually is rather
// than as one undifferentiated run — the division is the text's own, carried by
// the ta'amim, not one we invented. Verses with no etnachta render whole.
function HebrewVerse({ text }: { text: string }) {
  const halves = useMemo(() => splitAtEtnachta(text), [text]);
  return (
    <Text style={styles.hebrewText}>
      {halves ? (
        <>
          {halves[0]}
          <Text style={styles.pasuqAfterPause}>{` ${halves[1]}`}</Text>
        </>
      ) : (
        text
      )}
    </Text>
  );
}

// Swipe a verse: right to copy it, left to open it on Sefaria.
//
// The gesture is claimed only once the drag is clearly horizontal — twice as
// much across as down, and past a few pixels — so the vertical scroll it lives
// inside is never stolen from.
const SWIPE_TRIGGER = 64; // how far to drag before the action takes
const SWIPE_MAX = 96;     // how far the row will travel, so the drag has an end

function VerseSwipe({
  copied,
  onCopy,
  onOpen,
  children,
}: {
  copied: boolean;
  onCopy: () => void;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  const dx = useRef(new Animated.Value(0)).current;
  // The responder is built once, so it must not close over stale handlers.
  const handlers = useRef({ onCopy, onOpen });
  handlers.current = { onCopy, onOpen };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderMove: (_e, g) =>
          dx.setValue(Math.max(Math.min(g.dx, SWIPE_MAX), -SWIPE_MAX)),
        onPanResponderRelease: (_e, g) => {
          if (g.dx >= SWIPE_TRIGGER) handlers.current.onCopy();
          else if (g.dx <= -SWIPE_TRIGGER) handlers.current.onOpen();
          Animated.spring(dx, { toValue: 0, friction: 6, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dx, { toValue: 0, friction: 6, useNativeDriver: true }).start();
        },
      }),
    [dx],
  );

  // Each hint is uncovered by the row sliding off it, so each sits on the side
  // the row moves away from.
  const copyOpacity = dx.interpolate({
    inputRange: [0, SWIPE_TRIGGER],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const openOpacity = dx.interpolate({
    inputRange: [-SWIPE_TRIGGER, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View>
      <View style={styles.swipeHint} pointerEvents="none">
        <Animated.Text style={[styles.swipeHintIcon, { opacity: copyOpacity }]}>
          {copied ? '✓' : '⧉'}
        </Animated.Text>
        <Animated.Text
          style={[styles.swipeHintIcon, styles.swipeHintEnd, { opacity: openOpacity }]}
        >
          ↗
        </Animated.Text>
      </View>
      <Animated.View
        style={[styles.swipeRow, { transform: [{ translateX: dx }] }]}
        {...pan.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// Sefaria addresses a verse as Book.Chapter.Verse, with underscores for the
// spaces in a book name ("I Kings 18:46" -> "I_Kings.18.46"). In the Aramaic
// tab this still opens the pasuq rather than the Onkelos: the verse is what the
// reader is looking at, and Sefaria shows its translations alongside anyway.
function sefariaUrl(book: string, ref: string): string {
  return `https://www.sefaria.org/${book.trim().replace(/\s+/g, '_')}.${ref.replace(':', '.')}`;
}

// Consecutive items sharing a key, in order, as [key, labels] pairs.
function groupBy(
  segments: { nameEn: string; sectionLabel: string }[],
  key: (s: { nameEn: string }) => string,
): [string, string[]][] {
  const out: [string, string[]][] = [];
  for (const seg of segments) {
    const last = out[out.length - 1];
    if (last && last[0] === key(seg)) last[1].push(seg.sectionLabel);
    else out.push([key(seg), [seg.sectionLabel]]);
  }
  return out;
}

// ["Aliyah 6", "Haftarah"] -> "Aliyah 6 and Haftarah"
function joinPhrase(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

// Every version the app serves, with the credit its licence requires.
//
// Sefaria's own guidance is that attribution goes to the source of a text
// rather than to Sefaria, naming the publisher or translator and the licence —
// so crediting the library alone, as this used to, satisfied neither the BY-SA
// on the Hebrew nor the BY-NC on the translation and the Targum. The
// NonCommercial terms are also why the app is free: charging for it, or
// carrying ads, would need public-domain versions of these two instead.
const TEXT_CREDITS: { label: string; title: string; by: string; license: string }[] = [
  {
    label: 'Hebrew',
    title: 'Miqra according to the Masorah',
    by: 'Hebrew Wikisource',
    license: 'CC BY-SA',
  },
  {
    label: 'English',
    title: 'The JPS Tanakh: Gender-Sensitive Edition',
    by: 'The Jewish Publication Society',
    license: 'CC BY-NC',
  },
  {
    label: 'Targum',
    title: 'Metsudah Chumash (with Onkelos)',
    by: 'Metsudah Publications, 2009',
    license: 'CC BY-NC',
  },
];

// "Read on Shabbat" / "Read Thu, Sep 24" — when this chunk will be leined.
function describeLeined(iso: string): string {
  const d = new Date(iso);
  if (d.getDay() === 6) return 'Read on Shabbat';
  return `Read ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
}

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
  const [darkDay, setDarkDay] = useState<DarkDay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [offsetDays, setOffsetDays] = useState(0);
  const [mode, setMode] = useState<DisplayMode>('bilingual');
  const [targumVerses, setTargumVerses] = useState<(Verse | null)[] | null>(null);
  const [targumLoading, setTargumLoading] = useState(false);
  const [targumUnavailable, setTargumUnavailable] = useState(false);
  const [rite, setRite] = useState<Rite>('ashkenazi');
  const [isRead, setIsRead] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showStreakBanner, setShowStreakBanner] = useState(false);
  const [glossaryWord, setGlossaryWord] = useState<{ word: string; definition: string } | null>(null);
  const [showCredits, setShowCredits] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const readPop = useRef(new Animated.Value(0)).current;
  // Reaching the end fires once per reading. Without this the check would try to
  // re-fire on every scroll event while the reader sits at the bottom, and the
  // isRead state lags the first one by a render.
  const autoMarkedRef = useRef<string | null>(null);

  // --- Reading position ---------------------------------------------------
  // A restore is either to a remembered pixel offset (changing day) or to a
  // verse (changing language tab, where the same verses are still on screen but
  // at different heights). Non-null means a restore is outstanding, which also
  // suppresses position saves so a stale offset can't be written onto the
  // incoming day's key.
  type PendingScroll = { kind: 'offset'; y: number } | { kind: 'verse'; index: number };
  const scrollRef = useRef<ScrollView>(null);
  const pendingScrollRef = useRef<PendingScroll | null>(null);
  const viewportRef = useRef(0);
  const contentHeightRef = useRef(0);
  const scrollYRef = useRef(0);
  const verseOffsetsRef = useRef<number[]>([]);
  // Verse to re-anchor to once Onkelos finishes loading: the first switch to
  // Aramaic lays out with Hebrew alone, and the verses shift down when the
  // Aramaic arrives a moment later.
  const reanchorRef = useRef<number | null>(null);
  const shownDateRef = useRef(new Date());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Targum request tracking --------------------------------------------
  const targumReqRef = useRef<string | null>(null); // passage we've requested
  const shownRefRef = useRef<string | null>(null);  // passage currently on screen

  // An outstanding restore suppresses position saves, so it must never be able
  // to outlive the layout it was waiting for — every claim is time-bounded.
  const endRestore = useCallback(() => {
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
    pendingScrollRef.current = null;
  }, []);

  const claimRestore = useCallback(
    (pending: PendingScroll) => {
      pendingScrollRef.current = pending;
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(endRestore, 1500);
    },
    [endRestore],
  );

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
    setTargumVerses(null);
    setTargumUnavailable(false);
    setTargumLoading(false);
    targumReqRef.current = null; // a new day means a new Onkelos passage
    reanchorRef.current = null;
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    shownDateRef.current = target;
    setDarkDay(getDarkDay(target));
    // Claim the restore before any content renders, so the ScrollView can't
    // linger at the outgoing day's offset.
    claimRestore({ kind: 'offset', y: 0 });
    verseOffsetsRef.current = [];
    try {
      const [result, read, savedY] = await Promise.all([
        fetchTodayReading(rite, target),
        isDateRead(target),
        getReadingPosition(target),
      ]);
      claimRestore({ kind: 'offset', y: savedY });
      setReading(result);
      setIsRead(read);
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

  useEffect(() => {
    requestPermissionAndSchedule();
    const sub = AppState.addEventListener('change', (state) => {
      // The window is a fortnight of dated reminders, so returning to the app
      // after time away is exactly when it needs rebuilding — mount alone would
      // not fire for a phone that is only ever backgrounded.
      if (state === 'active') refreshReminders();
    });
    return () => sub.remove();
  }, []);

  // Restore the tab and rite the reader last used.
  useEffect(() => {
    (async () => {
      const [savedMode, savedRite] = await Promise.all([getSavedMode(), getSavedRite()]);
      if (savedMode === 'targum' || savedMode === 'bilingual') setMode(savedMode);
      if (savedRite === 'ashkenazi' || savedRite === 'sephardi') setRite(savedRite);
    })();
  }, []);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  // Haftarah has no Onkelos, so it always displays bilingually — without
  // forcing the reader's saved tab back to English.
  const effectiveMode: DisplayMode = reading?.isHaftarah ? 'bilingual' : mode;

  // The verse currently at the top of the viewport — the anchor we hold on to
  // when the text under it is about to be replaced.
  const topVerseIndex = useCallback(() => {
    const offsets = verseOffsetsRef.current;
    let index = 0;
    for (let i = 0; i < offsets.length; i++) {
      if (offsets[i] === undefined) break;
      if (offsets[i] > scrollYRef.current + 1) break;
      index = i;
    }
    return index;
  }, []);

  // Switching tabs swaps the text under the reader, and the English and the
  // Aramaic are different heights — so hold the verse rather than the pixel
  // offset, and land back on the same verse in the other language.
  const handleModeChange = useCallback(
    (newMode: DisplayMode) => {
      if (newMode === mode) return;
      const index = topVerseIndex();
      claimRestore({ kind: 'verse', index });
      verseOffsetsRef.current = []; // every offset is about to change
      // If the Aramaic still has to be fetched, hold the anchor until it lands.
      reanchorRef.current = newMode === 'targum' && !targumVerses ? index : null;
      setMode(newMode);
      saveMode(newMode);
    },
    [mode, targumVerses, topVerseIndex],
  );

  // Onkelos arrived and pushed every verse down — go back to the anchor.
  useEffect(() => {
    if (!targumVerses || reanchorRef.current === null) return;
    claimRestore({ kind: 'verse', index: reanchorRef.current });
    verseOffsetsRef.current = [];
    reanchorRef.current = null;
  }, [targumVerses]);

  const handleRiteChange = useCallback((newRite: Rite) => {
    setRite(newRite);
    saveRite(newRite);
  }, []);

  // Keeps the ref of the reading actually on screen, so a late Onkelos
  // response for a day we've navigated away from can be dropped.
  useEffect(() => {
    shownRefRef.current = reading?.ref ?? null;
  }, [reading]);

  // Fetch Onkelos whenever the Aramaic tab is showing and we don't have it —
  // covers both tapping the tab and carrying the tab across a day change.
  //
  // The in-flight fetch is tracked on a ref, not in state: putting the loading
  // flag in this effect's deps made it tear itself down the moment it set that
  // flag, cancelling its own request and wedging the tab on a spinner.
  useEffect(() => {
    if (effectiveMode !== 'targum' || !reading) return;
    const ref = reading.ref;
    if (targumReqRef.current === ref) return; // already asked for this passage
    targumReqRef.current = ref;
    setTargumLoading(true);
    fetchTargumForReading(reading)
      .then(verses => {
        if (shownRefRef.current !== ref) return; // stale — the day moved on
        if (verses) setTargumVerses(verses);
        else setTargumUnavailable(true);
      })
      .finally(() => {
        if (shownRefRef.current === ref) setTargumLoading(false);
      });
  }, [effectiveMode, reading]);

  const refreshStreak = useCallback(async () => {
    const newStreak = await refreshWeeklyStreak();
    setStreak(newStreak);
    const lastSeen = await getLastSeenStreak();
    if (newStreak > 0 && newStreak > lastSeen) {
      setShowStreakBanner(true);
      await markStreakBannerSeen(newStreak);
    }
  }, []);

  const markRead = useCallback(async () => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    await markDateRead(target);
    setIsRead(true);
    refreshReminders();
    // The button swells and settles. Short enough to register as acknowledgement
    // rather than as something to wait through.
    readPop.setValue(0);
    Animated.sequence([
      Animated.timing(readPop, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(readPop, { toValue: 0, friction: 4, tension: 90, useNativeDriver: true }),
    ]).start();
    await refreshStreak();
  }, [offsetDays, readPop, refreshStreak]);

  const handleToggleRead = async () => {
    if (!isRead) {
      await markRead();
      return;
    }
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    await unmarkDateRead(target);
    setIsRead(false);
    refreshReminders();
    await refreshStreak();
  };

  // Reaching the end of the day's text marks it read: arriving at the bottom is
  // the same claim the button makes, so making the reader also press it is
  // asking them to say it twice.
  const maybeAutoMarkRead = useCallback(
    (y: number) => {
      if (pendingScrollRef.current !== null) return; // a restore put us here, not the reader
      const viewport = viewportRef.current;
      const content = contentHeightRef.current;
      if (!viewport || !content) return;
      // A reading that fits on one screen is already "at the bottom" the moment
      // it renders, and nothing has been read yet. Those keep the button.
      if (content <= viewport + 24) return;
      if (y + viewport < content - 24) return;
      // Once per passage. This also means that un-marking a day and scrolling
      // again leaves it un-marked, rather than the app arguing with the reader.
      const key = `${shownDateRef.current.toDateString()}|${shownRefRef.current ?? ''}`;
      if (autoMarkedRef.current === key || isRead) return;
      autoMarkedRef.current = key;
      markRead();
    },
    [isRead, markRead],
  );

  // --- Scroll position ----------------------------------------------------
  // A restore must always finish, even when it cannot be honoured. It used to
  // be cleared only on full success, so returning to a day whose aliyah was
  // shorter than the saved offset left it outstanding forever — and because an
  // outstanding restore suppresses saving, no position was recorded again for
  // the rest of the session. Hence endRestore and its settle timer, above.
  const commitPosition = useCallback((y: number) => {
    if (pendingScrollRef.current !== null) return; // restore still in flight
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    saveReadingPosition(shownDateRef.current, y);
  }, []);

  const handleScroll = useCallback(
    (y: number) => {
      scrollYRef.current = y;
      if (pendingScrollRef.current !== null) return;
      // A deliberate scroll wins over a queued re-anchor.
      reanchorRef.current = null;
      const date = shownDateRef.current;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveReadingPosition(date, y), 400);
      maybeAutoMarkRead(y);
    },
    [maybeAutoMarkRead],
  );

  // Write the position now rather than waiting out the debounce — used when
  // leaving the day, where the debounce could otherwise lose the last scroll.
  const flushPosition = useCallback(() => {
    commitPosition(scrollYRef.current);
  }, [commitPosition]);

  // Content lays out in stages, so keep re-applying the target until the page
  // is tall enough to honour it, then stop waiting either way.
  const applyPendingScroll = useCallback(() => {
    const pending = pendingScrollRef.current;
    if (pending === null || !scrollRef.current) return;
    let target: number;
    if (pending.kind === 'offset') {
      target = pending.y;
    } else {
      const y = verseOffsetsRef.current[pending.index];
      if (y === undefined) return; // that verse hasn't been laid out yet
      target = Math.max(0, y - 8); // a little air above the verse number
    }
    const max = Math.max(0, contentHeightRef.current - viewportRef.current);
    scrollRef.current.scrollTo({ y: Math.min(target, max), animated: false });
    if (target <= max) {
      endRestore();
      return;
    }
    // Short of the target: the page may still be growing, so try again on the
    // next layout — but give up shortly so saving resumes regardless.
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(endRestore, 500);
  }, [endRestore]);

  const handleContentSizeChange = useCallback(
    (_w: number, h: number) => {
      contentHeightRef.current = h;
      applyPendingScroll();
    },
    [applyPendingScroll],
  );

  // Each verse reports where it sits, both to anchor on later and to drive the
  // restore: content size alone is not a reliable enough signal to hang it on.
  const handleVerseLayout = useCallback(
    (index: number, y: number) => {
      verseOffsetsRef.current[index] = y;
      applyPendingScroll();
    },
    [applyPendingScroll],
  );

  const handleOpenSefaria = useCallback(async (book: string, verse: Verse) => {
    const url = sefariaUrl(book, verse.ref);
    // canOpenURL rather than a bare openURL: on a device with no browser able
    // to take an https link, openURL rejects and would surface as an unhandled
    // rejection rather than as nothing happening.
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  }, []);

  const handleCopyVerse = useCallback(
    async (book: string, verse: Verse, key: string, targumVerse?: Verse) => {
      await Clipboard.setStringAsync(buildShareText(book, verse, effectiveMode, targumVerse));
      setCopiedKey(key);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopiedKey(null), 1500);
    },
    [effectiveMode],
  );


  // Pre-compute which glossary keys appear for the first time in each verse,
  // so SelectableText highlights only the first occurrence across the whole reading.
  const verseGlossaryKeys = useMemo(() => {
    if (!reading) return [] as Set<string>[];
    const seen = new Set<string>();
    return reading.verses.map(verse => {
      const allowed = new Set<string>();
      for (const key of glossaryKeysIn(verse.en)) {
        if (!seen.has(key)) {
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
  // "Today, Sun Aug 16" — the weekday is built separately rather than asking for
  // it in one call, because en-US puts its own comma after the weekday and the
  // label would read "Today, Sun, Aug 16". This is also where the day of the
  // week now lives: the reading's own day line under the aliyah label was the
  // same information twice, since the schedule keys the day off this date.
  const stamp =
    `${targetDate.toLocaleDateString('en-US', { weekday: 'short' })} ` +
    `${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const navLabel = offsetDays === -1 ? `Yesterday, ${stamp}`
    : offsetDays === 1 ? `Tomorrow, ${stamp}`
    : offsetDays === 0 ? `Today, ${stamp}`
    : stamp;

  const navRow = (
    <View style={styles.navRow}>
      <Pressable
        onPress={() => {
          flushPosition();
          setOffsetDays(o => o - 1);
        }}
        hitSlop={16}
        disabled={loading}
        accessibilityLabel="Previous day"
      >
        <Text style={[styles.navArrow, loading && styles.navArrowDisabled]}>‹</Text>
      </Pressable>
      {offsetDays !== 0 ? (
        <Pressable
          onPress={() => {
            flushPosition();
            setOffsetDays(0);
          }}
          hitSlop={8}
          accessibilityLabel="Return to today"
        >
          <Text style={[styles.navLabel, styles.navLabelTappable]}>{navLabel}</Text>
        </Pressable>
      ) : (
        <Text style={styles.navLabel}>{navLabel}</Text>
      )}
      <Pressable
        onPress={() => {
          flushPosition();
          setOffsetDays(o => o + 1);
        }}
        hitSlop={16}
        disabled={loading}
        accessibilityLabel="Next day"
      >
        <Text style={[styles.navArrow, loading && styles.navArrowDisabled]}>›</Text>
      </Pressable>
    </View>
  );

  if (!reading) {
    // Dark day: the leining happens today — Shabbat or yom tov — so there is
    // nothing to prepare and the app rests with the reader.
    const chag = darkDay && !darkDay.isShabbat ? darkDay : null;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          {navRow}
          <Text style={styles.parashaHe} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {chag ? chag.nameHe : 'שבת שלום'}
          </Text>
          <Text style={styles.parashaEn} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {chag ? chag.nameEn : 'Shabbat Shalom'}
          </Text>
          <Text style={styles.aliyahLabel}>
            {chag ? 'No reading today — Chag Sameach!' : 'No reading on Shabbat'}
          </Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.shabbatText}>
            {chag ? 'The reading was prepared before the chag.' : 'Rest and recharge.'}
          </Text>
        </View>
      </View>
    );
  }

  const totalWords = reading.verses.reduce(
    (s, v) => s + v.en.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  const readingMinutes = Math.max(1, Math.round(totalWords / 200));
  // One leining's portions read as one phrase — "Yom Kippur: Aliyah 6 and
  // Haftarah" — rather than repeating its name for each segment. Different
  // leinings stay separated by the dot.
  const sectionLabel =
    reading.segments.length > 1
      ? groupBy(reading.segments, (s) => s.nameEn)
          .map(([name, labels]) => `${name}: ${joinPhrase(labels)}`)
          .join('  ·  ')
      : reading.segments[0].sectionLabel;


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {navRow}
        <Text style={styles.parashaHe} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {reading.parashaHe}
        </Text>
        {/* A chag is named as itself: "Parshat Rosh Hashana I" is not a thing. */}
        <Text style={styles.parashaEn} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {reading.isHoliday ? '' : 'Parshat '}
          {CUSTOM_TRANSLITERATION_ENABLED ? (PARASHA_TRANSLITERATIONS[reading.parashaEn] ?? reading.parashaEn) : reading.parashaEn}
        </Text>
        <Text style={styles.aliyahLabel}>
          {sectionLabel}
        </Text>
        <Text style={styles.refLabel}>{reading.heRef}</Text>
        <Text style={styles.refLabelEn}>{reading.ref}</Text>

        {/* Friday: Ashkenazi / Sephardi Haftarah toggle — only when the two rites differ */}
        {reading.isHaftarah && SEPHARDI_HAFTARAH[reading.parashaEn] !== undefined && (
          <View style={styles.riteRow}>
            {RITES.map(({ key, label }) => (
              <Pressable
                key={key}
                style={[styles.riteBtn, rite === key && styles.riteBtnActive]}
                onPress={() => handleRiteChange(key)}
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
            style={[styles.toggleBtn, effectiveMode === key && styles.toggleBtnActive]}
            onPress={() => handleModeChange(key)}
          >
            <Text style={[styles.toggleText, effectiveMode === key && styles.toggleTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
        <Text style={styles.readingTime}>~{readingMinutes} min</Text>
      </View>

      {/* Text Content */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={e => handleScroll(e.nativeEvent.contentOffset.y)}
        // End-of-gesture writes, so a position never depends on the debounce
        // getting a chance to fire before the reader navigates away.
        onScrollEndDrag={e => commitPosition(e.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={e => commitPosition(e.nativeEvent.contentOffset.y)}
        onLayout={e => { viewportRef.current = e.nativeEvent.layout.height; }}
        onContentSizeChange={handleContentSizeChange}
      >
        {effectiveMode === 'targum' && targumLoading && (
          <ActivityIndicator color={BROWN} style={{ marginBottom: 16 }} />
        )}
        {effectiveMode === 'targum' && targumUnavailable && (
          <Text style={styles.targumNote}>
            Targum Onkelos is not available for this reading.
          </Text>
        )}
        {reading.verses.map((verse, i) => {
          const targumVerse = targumVerses?.[i] ?? undefined;
          const segIndex = reading.segmentOfVerse[i];
          const segment = reading.segments[segIndex];
          const segmentStarts = i === 0 || reading.segmentOfVerse[i - 1] !== segIndex;
          // Verse numbers restart with each segment, matching its refs.
          const verseNum = i - reading.segmentOfVerse.indexOf(segIndex) + 1;
          return (
            <View
              key={i}
              style={styles.verseBlock}
              onLayout={e => handleVerseLayout(i, e.nativeEvent.layout.y)}
              // The swipe is the only way to copy now, and a swipe is not
              // available to a reader driving the screen with VoiceOver — so the
              // same action is published to the accessibility layer.
              accessibilityActions={[
                { name: 'copy', label: 'Copy verse' },
                { name: 'sefaria', label: 'Open on Sefaria' },
              ]}
              onAccessibilityAction={e => {
                if (e.nativeEvent.actionName === 'copy') {
                  handleCopyVerse(segment.book, verse, `${i}`, targumVerse);
                } else if (e.nativeEvent.actionName === 'sefaria') {
                  handleOpenSefaria(segment.book, verse);
                }
              }}
            >
              {/* Multi-reading days label each portion with what it is and when
                  it's leined, so a borrowed chunk explains itself. */}
              {segmentStarts && reading.segments.length > 1 && (
                <View style={styles.segmentHeader}>
                  <Text style={styles.segmentTitle}>
                    {segment.isHoliday ? segment.nameEn : `Parshat ${segment.nameEn}`}
                    {' — '}
                    {segment.sectionLabel}
                  </Text>
                  <Text style={styles.segmentFor}>{describeLeined(segment.leinedOn)}</Text>
                </View>
              )}
              <VerseSwipe
                copied={copiedKey === `${i}`}
                onCopy={() => handleCopyVerse(segment.book, verse, `${i}`, targumVerse)}
                onOpen={() => handleOpenSefaria(segment.book, verse)}
              >
                <View style={styles.verseNumberRow}>
                  <Text style={styles.verseNumber}>{verseNum}</Text>
                  <View style={styles.verseRefRow}>
                    {copiedKey === `${i}` && <Text style={styles.copiedFlag}>copied</Text>}
                    <Text style={styles.verseRef}>{verse.ref}</Text>
                  </View>
                </View>
                <HebrewVerse text={verse.he} />
                {effectiveMode === 'bilingual' && (
                  <SelectableText
                    text={verse.en}
                    style={styles.englishText}
                    allowedKeys={verseGlossaryKeys[i]}
                    onWordPress={(word, definition) => setGlossaryWord({ word, definition })}
                  />
                )}
                {effectiveMode === 'targum' && targumVerse && (
                  <SelectableText text={targumVerse.he} style={styles.targumText} />
                )}
              </VerseSwipe>
              {i < reading.verses.length - 1 && <View style={styles.verseDivider} />}
            </View>
          );
        })}
        {/* Attribution. Sefaria's terms ask for credit where their texts are
            shown, and the end of the reading is where a reader arrives anyway. */}
        <Pressable
          onPress={() => setShowCredits(true)}
          accessibilityRole="button"
          accessibilityLabel="Texts from Sefaria. Show sources and licences."
        >
          <Text style={styles.attribution}>
            Hebrew, translation and Targum from{' '}
            <Text style={styles.attributionLink}>Sefaria</Text>
            {'  ·  '}
            <Text style={styles.attributionLink}>sources &amp; licences</Text>
          </Text>
        </Pressable>
      </ScrollView>

      {/* Sources and licences */}
      <Modal
        visible={showCredits}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCredits(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCredits(false)}>
          <View style={[styles.modalContent, styles.creditsContent]}>
            <Text style={styles.modalWord}>Texts &amp; licences</Text>
            {TEXT_CREDITS.map((c) => (
              <View key={c.label} style={styles.creditRow}>
                <Text style={styles.creditLabel}>{c.label}</Text>
                <Text style={styles.creditTitle}>{c.title}</Text>
                <Text style={styles.creditMeta}>
                  {c.by} · {c.license}
                </Text>
              </View>
            ))}
            <Text style={styles.creditFooter}>
              Retrieved through{' '}
              <Text
                style={styles.attributionLink}
                onPress={() => Linking.openURL('https://www.sefaria.org')}
              >
                Sefaria
              </Text>
              . This app is not affiliated with Sefaria, the Jewish Publication Society or
              Metsudah Publications.
            </Text>
          </View>
        </Pressable>
      </Modal>

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

      {/* Mark as Read — also set automatically on reaching the bottom */}
      <View style={styles.footer}>
        <Animated.View
          style={{
            transform: [
              { scale: readPop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
            ],
          }}
        >
          <TouchableOpacity
            style={[styles.readBtn, isRead && styles.readBtnDone]}
            onPress={handleToggleRead}
          >
            <Text style={styles.readBtnText}>
              {isRead ? `✓ Read${offsetDays === 0 ? ' Today' : ''}` : 'Mark as Read'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
    marginBottom: 2,
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
    textAlign: 'center',
  },
  navLabelTappable: {
    color: '#F5DEB3',
    textDecorationLine: 'underline',
  },
  parashaHe: {
    fontSize: 32,
    color: '#FDF6E3',
    fontFamily: 'TaameyFrank_Bold',
    marginBottom: 0,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  parashaEn: {
    fontSize: 18,
    color: '#F5DEB3',
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  aliyahLabel: {
    fontSize: 15,
    color: '#F5DEB3',
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.2,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  refLabel: {
    fontSize: 14,
    color: '#C4A882',
    marginTop: 2,
    fontFamily: 'TaameyFrank_Regular',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  refLabelEn: {
    fontSize: 12,
    color: '#C4A882',
    marginTop: 1,
    letterSpacing: 0.2,
    textAlign: 'center',
    alignSelf: 'stretch',
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
  // Sits behind the verse and is uncovered as the row slides off it.
  swipeHint: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  swipeHintIcon: {
    fontSize: 18,
    color: BROWN,
    fontWeight: '600',
  },
  swipeHintEnd: {
    textAlign: 'right',
  },
  // Portion header inside a multi-reading day.
  segmentHeader: {
    marginTop: 10,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F5EDD8',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: BROWN,
  },
  segmentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: BROWN,
  },
  segmentFor: {
    fontSize: 11,
    color: MID,
    marginTop: 1,
  },
  creditsContent: {
    maxWidth: 340,
  },
  creditRow: {
    marginBottom: 12,
  },
  creditLabel: {
    fontSize: 11,
    color: MID,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creditTitle: {
    fontSize: 15,
    color: DARK,
    marginTop: 1,
  },
  creditMeta: {
    fontSize: 12,
    color: MID,
    marginTop: 1,
  },
  creditFooter: {
    fontSize: 12,
    lineHeight: 18,
    color: MID,
    marginTop: 4,
  },
  attribution: {
    fontSize: 12,
    color: MID,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  attributionLink: {
    color: BROWN,
    textDecorationLine: 'underline',
  },
  swipeRow: {
    backgroundColor: PARCHMENT,
  },
  verseRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copiedFlag: {
    fontSize: 10,
    color: BROWN,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  hebrewText: {
    fontFamily: 'TaameyFrank_Regular',
    // Frank-Ruehl runs small per em (letter height 0.552em vs Noto's 0.647), so
    // 26 here matches the original 22 optically. Its ink spans 1.221em once
    // ta'amim stack below the niqud — 31.7px at this size — which is the hard
    // floor for lineHeight: below it accents reach the row above. 34 sits ~2px
    // over that floor. There is nothing left to give here: 32 and below has the
    // deep accents touching the letters of the line above.
    fontSize: 26,
    lineHeight: 34,
    color: DARK,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  pasuqAfterPause: {
    color: PASUQ_AFTER_PAUSE,
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
    fontFamily: 'TaameyFrank_Regular',
    // Set at the Hebrew's size, and given the Hebrew's line height with it —
    // raising the size without the leading would have put the niqud into the row
    // above. It reads with more air than the Hebrew does at the same 34, because
    // Onkelos is pointed but carries no ta'amim: nothing stacks below the
    // vowels, so the ink spans well under the Hebrew's 1.221em.
    fontSize: 26,
    lineHeight: 34,
    // Set off from the Hebrew above it. The pasuq's last line has ta'amim
    // hanging below its line box, so the 6px the Hebrew already carries is not
    // the gap it looks like — this adds 8 for a clear start of its own.
    marginTop: 8,
    // The old 0.85 opacity is gone with the sepia: fading a colour toward the
    // parchment shifts its hue as well as its weight. This one carries its
    // final value.
    color: TARGUM_COLOR,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
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
