import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AliyahData, fetchAliyah } from '../services/sefaria';
import { getTodayAliyahIndices, getAliyahLabel, DAY_NAMES_EN } from '../utils/aliyah';
import { isTodayRead, markTodayRead, unmarkTodayRead } from '../utils/storage';

type DisplayMode = 'hebrew' | 'english' | 'both';

const MODES: { key: DisplayMode; label: string }[] = [
  { key: 'hebrew', label: 'עברית' },
  { key: 'english', label: 'English' },
  { key: 'both', label: 'Both' },
];

export default function HomeScreen() {
  const [dataList, setDataList] = useState<AliyahData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<DisplayMode>('both');
  const [isRead, setIsRead] = useState(false);

  const aliyahIndices = getTodayAliyahIndices();
  const dayIndex = new Date().getDay();
  const dayName = DAY_NAMES_EN[dayIndex];
  const isShabbat = aliyahIndices.length === 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [results, read] = await Promise.all([
        Promise.all(aliyahIndices.map((i) => fetchAliyah(i))),
        isTodayRead(),
      ]);
      setDataList(results);
      setIsRead(read);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [aliyahIndices.join(',')]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleRead = async () => {
    if (isRead) {
      await unmarkTodayRead();
      setIsRead(false);
    } else {
      await markTodayRead();
      setIsRead(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading today's aliyah…</Text>
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

  if (isShabbat) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.parashaHe}>שבת שלום</Text>
          <Text style={styles.parashaEn}>Shabbat Shalom</Text>
          <Text style={styles.aliyahLabel}>No aliyah today — enjoy your Shabbat!</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.shabbatText}>Rest and recharge. Your next aliyah is on Sunday.</Text>
        </View>
      </View>
    );
  }

  if (dataList.length === 0) return null;

  const totalWords = dataList.reduce(
    (sum, d) => sum + d.verses.reduce((s, v) => s + v.en.trim().split(/\s+/).filter(Boolean).length, 0),
    0
  );
  const readingMinutes = Math.max(1, Math.round(totalWords / 200));

  const headerData = dataList[0];
  const aliyahLabels = dataList.map((d) => getAliyahLabel(d.aliyahIndex)).join('  +  ');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.parashaHe}>{headerData.parashaHe}</Text>
        <Text style={styles.parashaEn}>Parshat {headerData.parashaEn}</Text>
        <Text style={styles.aliyahLabel}>
          {aliyahLabels} · {dayName}
        </Text>
        <Text style={styles.refLabel}>
          {dataList.map((d) => d.heRef).join(' · ')}
        </Text>
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
        {dataList.map((data, aliyahIdx) => (
          <View key={aliyahIdx}>
            {dataList.length > 1 && (
              <View style={styles.aliyahDivider}>
                <Text style={styles.aliyahDividerText}>
                  {getAliyahLabel(data.aliyahIndex)}
                </Text>
              </View>
            )}
            {data.verses.map((verse, i) => (
              <View key={`${aliyahIdx}-${i}`} style={styles.verseBlock}>
                <Text style={styles.verseNumber}>{i + 1}</Text>
                {(mode === 'hebrew' || mode === 'both') && (
                  <Text style={styles.hebrewText}>{verse.he}</Text>
                )}
                {(mode === 'english' || mode === 'both') && (
                  <Text style={styles.englishText}>{verse.en}</Text>
                )}
                {i < data.verses.length - 1 && <View style={styles.verseDivider} />}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Mark as Read */}
      <View style={styles.footer}>
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
  verseNumber: {
    fontSize: 11,
    color: '#B0926A',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
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
  aliyahDivider: {
    borderTopWidth: 2,
    borderTopColor: BROWN,
    marginTop: 16,
    marginBottom: 12,
    paddingTop: 8,
  },
  aliyahDividerText: {
    fontSize: 14,
    color: BROWN,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
});
