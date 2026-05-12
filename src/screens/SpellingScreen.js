import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { allWords } from '../data/vocabularyData';
import { useProgressStore } from '../store/store';
import { TtsHelper } from '../utils/ttsHelper';
import LensFrame from '../components/LensFrame';

export default function SpellingScreen({ navigation, route }) {
  const specificWord = route?.params?.word ?? null;
  const recordSpelling = useProgressStore(s => s.recordSpelling);

  const [word] = useState(() => specificWord ?? [...allWords].sort(() => Math.random() - 0.5)[0]);
  const [scrambled] = useState(() => {
    const letters = word.englishName.toUpperCase().split('');
    const decoys = Array.from({ length: 2 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)));
    return [...letters, ...decoys].sort(() => Math.random() - 0.5);
  });
  const [slots, setSlots] = useState(() => Array(word.englishName.length).fill(null));
  const [usedIndices, setUsedIndices] = useState(() => Array(scrambled.length).fill(false));
  const [attempts, setAttempts] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [stars, setStars] = useState(0);

  React.useEffect(() => {
    setTimeout(() => TtsHelper.speakEnglish(word.englishName), 500);
  }, []);

  const tapLetter = (i) => {
    if (usedIndices[i] || completed) return;
    const nextSlot = slots.indexOf(null);
    if (nextSlot === -1) return;
    const newSlots = [...slots];
    const newUsed = [...usedIndices];
    newSlots[nextSlot] = scrambled[i];
    newUsed[i] = true;
    TtsHelper.speakLetter(scrambled[i]);
    setSlots(newSlots);
    setUsedIndices(newUsed);
    if (!newSlots.includes(null)) checkAnswer(newSlots, attempts + 1);
  };

  const tapSlot = (i) => {
    if (slots[i] === null || completed) return;
    const letter = slots[i];
    const newSlots = [...slots];
    const newUsed = [...usedIndices];
    for (let j = 0; j < scrambled.length; j++) {
      if (scrambled[j] === letter && newUsed[j]) { newUsed[j] = false; break; }
    }
    newSlots[i] = null;
    setSlots(newSlots);
    setUsedIndices(newUsed);
  };

  const checkAnswer = (currentSlots, att) => {
    const answer = currentSlots.join('');
    const correct = answer === word.englishName.toUpperCase();
    setAttempts(att);
    if (correct) {
      setCompleted(true);
      TtsHelper.speakCelebration();
      const s = att === 1 ? 3 : att === 2 ? 2 : 1;
      setStars(s);
      recordSpelling({ wordId: word.id, correct: true, stars: s });
      setTimeout(() => setShowResult(true), 1500);
    } else {
      TtsHelper.speakEncouragement();
      recordSpelling({ wordId: word.id, correct: false, stars: 0 });
      if (att >= 2) setShowHint(true);
      setTimeout(() => {
        setSlots(Array(word.englishName.length).fill(null));
        setUsedIndices(Array(scrambled.length).fill(false));
      }, 800);
    }
  };

  return (
    <LinearGradient colors={['#FFF8F0', '#F0E6FF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <View style={styles.badge}><Text style={styles.badgeText}>Spell Challenge ✏️</Text></View>
            <View style={{ flex: 1 }} />
            <View style={{ width: 32 }} />
          </View>

          <View style={{ height: 12 }} />
          <View style={{ alignItems: 'center' }}>
            <LensFrame size={100} borderColor={Colors.secondary} borderWidth={2.5} showHandle>
              <View style={styles.wordInner}>
                <Text style={{ fontSize: 44 }}>{word.emoji}</Text>
              </View>
            </LensFrame>
          </View>

          <View style={{ height: 12 }} />
          <TouchableOpacity style={styles.listenBtn} onPress={() => TtsHelper.speakEnglish(word.englishName)}>
            <Text style={styles.listenText}>🔊 Listen</Text>
          </TouchableOpacity>

          {showHint && (
            <View style={[styles.hintBox, { marginTop: 12 }]}>
              <Text style={styles.hintText}>💡 Starts with "{word.englishName[0].toUpperCase()}"</Text>
            </View>
          )}

          <View style={{ height: 16 }} />
          <View style={styles.slotsRow}>
            {slots.map((letter, i) => (
              <TouchableOpacity key={i} style={[styles.slot, letter && { backgroundColor: Colors.primaryLight + '4D', borderColor: Colors.primary }, completed && letter && { backgroundColor: Colors.successLight, borderColor: Colors.success }]} onPress={() => tapSlot(i)}>
                <Text style={[styles.slotText, completed && { color: Colors.success }, !letter && { color: Colors.divider }]}>{letter ?? '_'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flex: 1 }} />

          <View style={styles.lettersWrap}>
            {scrambled.map((letter, i) =>
              usedIndices[i] ? (
                <View key={i} style={styles.letterPlaceholder} />
              ) : (
                <TouchableOpacity key={i} style={styles.letterBtn} onPress={() => tapLetter(i)}>
                  <Text style={styles.letterText}>{letter}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
          <View style={{ height: 24 }} />
        </View>
      </SafeAreaView>

      <Modal visible={showResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultBadge}>Word Decoded! 🎉</Text>
            <Text style={styles.resultWord}>{word.englishName}</Text>
            <Text style={styles.resultFilipino}>{word.filipinoName}</Text>
            <View style={styles.starsRow}>
              {[0,1,2].map(i => <Text key={i} style={{ fontSize: 36, opacity: i < stars ? 1 : 0.25 }}>⭐</Text>)}
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
  header: { flexDirection: 'row', alignItems: 'center' },
  closeBtn: { fontSize: 22, color: Colors.textSecondary },
  badge: { backgroundColor: Colors.secondary + '1A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 6 },
  badgeText: { color: Colors.secondary, fontWeight: '700', fontSize: 15 },
  wordInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listenBtn: { alignSelf: 'center', backgroundColor: Colors.primaryLight + '4D', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: Colors.primary + '33' },
  listenText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 15 },
  hintBox: { alignSelf: 'center', backgroundColor: Colors.warning + '1A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.warning + '4D' },
  hintText: { color: Colors.secondaryDark, fontWeight: '600', fontSize: 14 },
  slotsRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6 },
  slot: { width: 44, height: 52, borderRadius: 10, borderWidth: 2, borderColor: Colors.divider, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  slotText: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  lettersWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  letterBtn: { width: 48, height: 52, backgroundColor: Colors.secondary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  letterText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  letterPlaceholder: { width: 48, height: 52 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  resultCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', marginHorizontal: 24 },
  resultBadge: { color: Colors.success, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  resultWord: { fontSize: 26, fontWeight: '800', color: Colors.primary, marginTop: 8 },
  resultFilipino: { fontSize: 18, fontWeight: '600', color: Colors.secondary },
  starsRow: { flexDirection: 'row', gap: 4, marginVertical: 16 },
  returnBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  returnBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
