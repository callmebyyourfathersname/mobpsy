import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { allWords, getWrongOptions } from '../data/vocabularyData';
import { useProgressStore } from '../store/store';
import { TtsHelper } from '../utils/ttsHelper';
import LensFrame from '../components/LensFrame';

export default function IdentificationScreen({ navigation }) {
  const recordIdentification = useProgressStore(s => s.recordIdentification);
  const [queue] = useState(() => {
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentWord = queue[currentIndex];

  useEffect(() => {
    const wrong = getWrongOptions(currentWord, 3);
    const opts = [currentWord, ...wrong].sort(() => Math.random() - 0.5);
    setOptions(opts);
    setSelectedId(null);
  }, [currentIndex]);

  const selectOption = async (word) => {
    if (selectedId) return;
    const correct = word.id === currentWord.id;
    setSelectedId(word.id);

    if (correct) {
      setScore(s => s + 1);
      TtsHelper.speakCelebration();
      await recordIdentification({ wordId: currentWord.id, correct: true });
    } else {
      TtsHelper.speakEncouragement();
      await recordIdentification({ wordId: currentWord.id, correct: false });
    }

    setTimeout(() => {
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  const finalScore = showResult ? score : 0;
  const stars = finalScore >= 4 ? 3 : finalScore >= 2 ? 2 : 1;

  const getOptionStyle = (word) => {
    if (!selectedId) return {};
    const isCorrect = word.id === currentWord.id;
    const isSelected = word.id === selectedId;
    if (isCorrect) return { backgroundColor: Colors.successLight, borderColor: Colors.success };
    if (isSelected) return { backgroundColor: Colors.errorLight, borderColor: Colors.error };
    return {};
  };

  return (
    <LinearGradient colors={['#FFF8F0', '#F0E6FF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header + progress */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / queue.length) * 100}%` }]} />
            </View>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{currentIndex + 1}/{queue.length}</Text>
            </View>
          </View>

          <View style={{ height: 20 }} />

          <View style={styles.promptBadge}>
            <Text style={styles.promptText}>Identify This Object</Text>
          </View>

          <View style={{ height: 20 }} />

          {/* Object in lens frame */}
          <View style={{ alignItems: 'center' }}>
            <LensFrame size={140} borderColor={Colors.primary} borderWidth={3} showHandle>
              <View style={[styles.wordIconInner, { backgroundColor: Colors.primaryLight + '33' }]}>
                <Text style={styles.wordEmoji}>{currentWord.emoji}</Text>
              </View>
            </LensFrame>
          </View>

          <View style={{ height: 28 }} />

          {/* Options grid */}
          <View style={styles.optionsGrid}>
            {options.map((word) => (
              <TouchableOpacity
                key={word.id}
                style={[styles.optionBtn, getOptionStyle(word)]}
                onPress={() => selectOption(word)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionEmoji}>{word.emoji}</Text>
                <Text style={styles.optionText}>{word.englishName}</Text>
                {selectedId && word.id === currentWord.id && <Text style={{ fontSize: 16 }}>✅</Text>}
                {selectedId && word.id === selectedId && word.id !== currentWord.id && <Text style={{ fontSize: 16 }}>❌</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* Result Modal */}
      <Modal visible={showResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultBadge}>Mission Complete! 🎉</Text>
            <Text style={styles.resultScore}>{finalScore} / {queue.length}</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>words identified</Text>
            <View style={styles.starsRow}>
              {[0,1,2].map(i => (
                <Text key={i} style={{ fontSize: 36, opacity: i < stars ? 1 : 0.25 }}>⭐</Text>
              ))}
            </View>
            <TouchableOpacity style={styles.returnBtn} onPress={() => { setShowResult(false); navigation.goBack(); }}>
              <Text style={styles.returnBtnText}>🏠 Return to Base</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 22, color: Colors.textSecondary },
  progressBarBg: { flex: 1, height: 8, backgroundColor: Colors.divider, borderRadius: 10, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 10 },
  counterBadge: { backgroundColor: Colors.primary + '1A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  counterText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  promptBadge: { alignSelf: 'center', backgroundColor: Colors.primary + '1A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 6 },
  promptText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  wordIconInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wordEmoji: { fontSize: 56 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  optionBtn: {
    width: '47%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14, borderWidth: 2, borderColor: Colors.divider,
    backgroundColor: Colors.surface, elevation: 2,
  },
  optionEmoji: { fontSize: 20 },
  optionText: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  resultCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', marginHorizontal: 24 },
  resultBadge: { color: Colors.success, fontWeight: '700', fontSize: 16, marginBottom: 12 },
  resultScore: { fontSize: 52, fontWeight: '900', color: Colors.primary },
  starsRow: { flexDirection: 'row', gap: 4, marginVertical: 16 },
  returnBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  returnBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
