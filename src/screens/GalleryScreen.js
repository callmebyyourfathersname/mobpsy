import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  SafeAreaView, Modal, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { allWords } from '../data/vocabularyData';
import { useProgressStore } from '../store/store';
import { TtsHelper } from '../utils/ttsHelper';
import LensFrame from '../components/LensFrame';
import DiscoveryCard from '../components/DiscoveryCard';

export default function GalleryScreen({ navigation }) {
  const getWordProgress = useProgressStore(s => s.getWordProgress);
  const [selected, setSelected] = useState(null);

  const discoveredCount = allWords.filter(w => getWordProgress(w.id)?.isDiscovered).length;
  const percent = Math.round((discoveredCount / allWords.length) * 100);

  const handleTap = (word) => {
    const wp = getWordProgress(word.id);
    if (wp?.isDiscovered) {
      TtsHelper.speakEnglish(word.englishName);
      setSelected(word);
    }
  };

  const renderItem = ({ item, index }) => {
    const wp = getWordProgress(item.id);
    const isDiscovered = wp?.isDiscovered ?? false;
    const isMastered = wp?.isMastered ?? false;
    const stars = wp?.bestStars ?? 0;
    const state = isMastered ? 'mastered' : isDiscovered ? 'discovered' : 'undiscovered';

    return (
      <View style={{ flex: 1, margin: 7 }}>
        <DiscoveryCard
          word={item}
          state={state}
          stars={stars}
          onTap={() => handleTap(item)}
        />
      </View>
    );
  };

  const selWp = selected ? getWordProgress(selected.id) : null;
  const selStars = selWp?.bestStars ?? 0;
  const selMastered = selWp?.isMastered ?? false;

  return (
    <LinearGradient colors={['#FFF8F0', '#F0E6FF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Field Journal</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress bar */}
          <View style={styles.progressCard}>
            <Text style={{ fontSize: 18 }}>📖</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{discoveredCount}/{allWords.length} Discovered</Text>
                <Text style={styles.progressPercent}>{percent}%</Text>
              </View>
              <View style={{ height: 4 }} />
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
              </View>
            </View>
          </View>

          {/* Grid */}
          <FlatList
            data={allWords}
            numColumns={2}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelected(null)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={{ height: 20 }} />

            {selected && (
              <>
                <View style={{ alignItems: 'center' }}>
                  <LensFrame
                    size={100}
                    borderColor={selMastered ? Colors.masteryGold : Colors.primary}
                    borderWidth={3}
                    showHandle
                  >
                    <View style={[styles.detailInner, { backgroundColor: Colors.primaryLight + '4D' }]}>
                      <Text style={{ fontSize: 44 }}>{selected.emoji}</Text>
                    </View>
                  </LensFrame>
                </View>

                <View style={{ height: 16 }} />
                <Text style={styles.detailEnglish}>{selected.englishName}</Text>
                <Text style={styles.detailFilipino}>{selected.filipinoName}</Text>
                <View style={{ height: 4 }} />
                <View style={[styles.catBadge, { alignSelf: 'center' }]}>
                  <Text style={styles.catText}>{selected.category}</Text>
                </View>

                <View style={{ height: 16 }} />
                <View style={styles.ttsRow}>
                  <TouchableOpacity style={[styles.ttsBtn, { backgroundColor: Colors.primary }]}
                    onPress={() => TtsHelper.speakEnglish(selected.englishName)}>
                    <Text style={styles.ttsBtnText}>🔊 English</Text>
                  </TouchableOpacity>
                  <View style={{ width: 12 }} />
                  <TouchableOpacity style={[styles.ttsBtn, { backgroundColor: Colors.secondary }]}
                    onPress={() => TtsHelper.speakFilipino(selected.filipinoName)}>
                    <Text style={styles.ttsBtnText}>🔊 Filipino</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 16 }} />
                <View style={styles.starsRow}>
                  {[0, 1, 2].map(i => (
                    <Text key={i} style={{ fontSize: 32, opacity: i < selStars ? 1 : 0.2 }}>⭐</Text>
                  ))}
                </View>

                {selMastered && (
                  <View style={styles.masteredBadge}>
                    <Text style={styles.masteredText}>🏆 Mastered!</Text>
                  </View>
                )}

                <View style={{ height: 8 }} />
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 26, color: Colors.textPrimary },
  title: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  progressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.hudBorder + '26' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  progressPercent: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  progressBg: { height: 6, backgroundColor: Colors.divider, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: 'center' },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.divider, borderRadius: 2 },
  detailInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  detailEnglish: { fontSize: 28, fontWeight: '800', color: Colors.primaryDark, textAlign: 'center' },
  detailFilipino: { fontSize: 20, fontWeight: '600', color: Colors.secondary, textAlign: 'center' },
  catBadge: { backgroundColor: Colors.primary + '1A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  catText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  ttsRow: { flexDirection: 'row' },
  ttsBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ttsBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  starsRow: { flexDirection: 'row', gap: 4 },
  masteredBadge: { backgroundColor: Colors.masteryGold + '26', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: Colors.masteryGold + '4D', marginTop: 12 },
  masteredText: { color: Colors.masteryGold, fontWeight: '700', fontSize: 14 },
});
