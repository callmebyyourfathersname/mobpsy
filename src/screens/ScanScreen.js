import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { allWords } from '../data/vocabularyData';
import { useProgressStore } from '../store/store';
import { TtsHelper } from '../utils/ttsHelper';
import LensFrame from '../components/LensFrame';
import HudBracket from '../components/HudBracket';

export default function ScanScreen({ navigation }) {
  const [scanning, setScanning] = useState(true);
  const [detectedWord, setDetectedWord] = useState(null);
  const discoverWord = useProgressStore(s => s.discoverWord);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const fadeResult = useRef(new Animated.Value(0)).current;
  const scaleResult = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    startPulse();
    startScanLine();
    startMockScan();
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  };

  const startScanLine = () => {
    Animated.loop(
      Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  };

  const startMockScan = () => {
    setScanning(true);
    setDetectedWord(null);
    setTimeout(async () => {
      const shuffled = [...allWords].sort(() => Math.random() - 0.5);
      const word = shuffled[0];
      setScanning(false);
      setDetectedWord(word);
      TtsHelper.speakEnglish(word.englishName);
      await discoverWord(word.id);
      Animated.parallel([
        Animated.spring(scaleResult, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(fadeResult, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 3000);
  };

  const scanLineTranslate = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[Colors.hudBg, '#0F1D32', '#0A1628']} style={StyleSheet.absoluteFill} />

      {/* Grid overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLine, styles.hLine, { top: i * 40 }]} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLine, styles.vLine, { left: i * 40 }]} />
        ))}
      </View>

      {/* Top HUD bar */}
      <SafeAreaView>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.hudBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.hudBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: scanning ? Colors.hudGreen : Colors.success }]} />
            <Text style={[styles.statusText, { color: scanning ? Colors.hudGreen : Colors.success }]}>
              {scanning ? 'SCANNING' : 'DETECTED'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Scanning state */}
      {scanning && (
        <View style={styles.center}>
          <Animated.View style={[styles.glowRing, { borderColor: Colors.hudGreen, opacity: pulseOpacity }]} />
          <HudBracket size={220} color={Colors.hudGreen} thickness={3}>
            <Text style={styles.focusIcon}>⊕</Text>
          </HudBracket>
          {/* Scan line */}
          <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]} />
          <View style={{ height: 24 }} />
          <Text style={styles.scanningLabel}>Scanning Environment</Text>
        </View>
      )}

      {/* Detection result */}
      {!scanning && detectedWord && (
        <View style={styles.center}>
          <Animated.View style={{ transform: [{ scale: scaleResult }], opacity: fadeResult }}>
            <LensFrame size={160} borderColor={Colors.hudGreen} borderWidth={3} showHandle glowColor={Colors.hudGreen}>
              <View style={[styles.detectedInner, { backgroundColor: Colors.primaryLight + '26' }]}>
                <Text style={styles.detectedEmoji}>{detectedWord.emoji}</Text>
              </View>
            </LensFrame>
          </Animated.View>
          <Text style={[styles.scanningLabel, { marginTop: 8 }]}>Object Locked 🔒</Text>
        </View>
      )}

      {/* Bottom sheet */}
      {!scanning && detectedWord && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={{ height: 16 }} />

          <View style={styles.detectionRow}>
            <View style={styles.detectedDot} />
            <Text style={styles.detectedLabel}>Object Detected!</Text>
            <View style={{ flex: 1 }} />
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{detectedWord.category}</Text>
            </View>
          </View>

          <View style={{ height: 12 }} />
          <View style={styles.wordRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.wordEnglish}>{detectedWord.englishName}</Text>
              <Text style={styles.wordFilipino}>{detectedWord.filipinoName}</Text>
            </View>
            <View>
              <TouchableOpacity onPress={() => TtsHelper.speakEnglish(detectedWord.englishName)} style={styles.ttsBtn}>
                <Text style={{ fontSize: 22 }}>🔊</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => TtsHelper.speakFilipino(detectedWord.filipinoName)} style={styles.ttsBtn}>
                <Text style={{ fontSize: 22 }}>🔊</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 20 }} />
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
              onPress={() => navigation.navigate('Identification')}>
              <Text style={styles.actionBtnText}>✅ Identify</Text>
            </TouchableOpacity>
            <View style={{ width: 12 }} />
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.secondary }]}
              onPress={() => navigation.navigate('Spelling')}>
              <Text style={styles.actionBtnText}>✏️ Spell It</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 12 }} />
          <TouchableOpacity style={styles.rescanBtn} onPress={startMockScan}>
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>🔍 Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  hudBtn: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: Colors.hudGreen + '33' },
  hudBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.hudGreen + '33' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glowRing: { position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 1.5 },
  focusIcon: { color: Colors.hudGreen, fontSize: 40, opacity: 0.7 },
  scanLine: { position: 'absolute', width: 180, height: 2, backgroundColor: Colors.hudGreen, opacity: 0.6 },
  scanningLabel: { color: Colors.hudGreen, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  detectedInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  detectedEmoji: { fontSize: 64 },
  gridLine: { position: 'absolute', backgroundColor: Colors.hudGreen + '08' },
  hLine: { left: 0, right: 0, height: 1 },
  vLine: { top: 0, bottom: 0, width: 1 },
  bottomSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.divider, borderRadius: 2, alignSelf: 'center' },
  detectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  detectedLabel: { color: Colors.success, fontWeight: '700', fontSize: 14 },
  categoryBadge: { backgroundColor: Colors.primary + '1A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  categoryBadgeText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  wordRow: { flexDirection: 'row', alignItems: 'flex-end' },
  wordEnglish: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  wordFilipino: { fontSize: 20, fontWeight: '600', color: Colors.secondary },
  ttsBtn: { padding: 6 },
  actionRow: { flexDirection: 'row' },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  rescanBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary + '33' },
});
