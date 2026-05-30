import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated, Easing, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { allWords } from '../data/vocabularyData';
import { useProgressStore } from '../store/store';
import { TtsHelper } from '../utils/ttsHelper';
import LensFrame from '../components/LensFrame';
import HudBracket from '../components/HudBracket';

// ── Claude Vision ─────────────────────────────────────────────────────────────
// Replace this value with your Anthropic API key.
// Get one at https://console.anthropic.com/settings/keys
const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';

async function identifyImageWithClaude(base64Image) {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'YOUR_ANTHROPIC_API_KEY_HERE') {
    throw new Error('Add your Anthropic API key to ScanScreen.js (ANTHROPIC_API_KEY constant).');
  }

  const wordList = allWords
    .map(w => w.id + ': ' + w.englishName + ' (' + w.filipinoName + ') — ' + w.category)
    .join('\n');

  const prompt =
    'You are helping a children\'s vocabulary learning app identify objects in photos.\n\n' +
    'Here is the complete list of vocabulary words the app knows:\n' +
    wordList + '\n\n' +
    'Look at this photo carefully. Identify the most prominent object visible.\n' +
    'If it matches one of the vocabulary words above, respond with ONLY the word\'s id (e.g. "cat" or "book").\n' +
    'If nothing matches, respond with ONLY "none".\n' +
    'Do not add any explanation, punctuation, or extra text. Just the id or "none".';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 20,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('Claude API ' + response.status + ': ' + err);
  }

  const data = await response.json();
  const rawId = (data.content && data.content[0] && data.content[0].text)
    ? data.content[0].text.trim().toLowerCase()
    : 'none';
  if (rawId === 'none') return null;
  return allWords.find(function(w) { return w.id === rawId; }) || null;
}

// ── Scan line ─────────────────────────────────────────────────────────────────
function ScanLine() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(function() {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-110, 110] });
  return <Animated.View style={[styles.scanLine, { transform: [{ translateY: translateY }] }]} />;
}

// ── Pulse ring ────────────────────────────────────────────────────────────────
function PulseRing() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(function() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] });
  return <Animated.View style={[styles.pulseRing, { opacity: opacity }]} />;
}

// ── Main ScanScreen ───────────────────────────────────────────────────────────
export default function ScanScreen({ navigation }) {
  const discoverWord = useProgressStore(function(s) { return s.discoverWord; });
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef(null);
  const [facing, setFacing]         = useState('back');
  const [flashMode, setFlashMode]   = useState('off');
  const [zoom, setZoom]             = useState(0);
  const [phase, setPhase]           = useState('ready');
  const [detectedWord, setDetectedWord] = useState(null);

  const fadeResult  = useRef(new Animated.Value(0)).current;
  const scaleResult = useRef(new Animated.Value(0.7)).current;

  function animateResult() {
    Animated.parallel([
      Animated.spring(scaleResult, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(fadeResult, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }

  function resetScan() {
    setPhase('ready');
    setDetectedWord(null);
    fadeResult.setValue(0);
    scaleResult.setValue(0.7);
  }

  const handleCapture = useCallback(async function() {
    if (!cameraRef.current || phase !== 'ready') return;
    setPhase('scanning');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        exif: false,
        skipProcessing: true,
      });

      setPhase('analysing');

      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 512 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const word = await identifyImageWithClaude(resized.base64);

      if (word) {
        setDetectedWord(word);
        setPhase('result');
        TtsHelper.speakEnglish(word.englishName);
        await discoverWord(word.id);
        animateResult();
      } else {
        setPhase('no_match');
      }
    } catch (e) {
      console.error('Scan error:', e.message);
      Alert.alert('Scan Failed', e.message);
      setPhase('ready');
    }
  }, [phase]);

  const isProcessing = phase === 'scanning' || phase === 'analysing';

  const shutterEmoji = phase === 'ready' ? '📷'
    : phase === 'scanning' ? '⏳'
    : phase === 'analysing' ? '🔍'
    : '🔄';

  // ── Permission: still loading ─────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.permCenter}>
        <ActivityIndicator size="large" color={Colors.hudGreen} />
      </View>
    );
  }

  // ── Permission: not granted ───────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={styles.permCenter}>
        <Text style={{ fontSize: 52, marginBottom: 16 }}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permSub}>
          iSpy World uses your camera to scan and identify objects around you for vocabulary learning.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: Colors.hudBg }}>

      {/* Live camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flashMode}
        zoom={zoom}
      />

      {/* HUD grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 18 }).map(function(_, i) {
          return <View key={'h' + i} style={[styles.gridLine, styles.hLine, { top: i * 44 }]} />;
        })}
        {Array.from({ length: 10 }).map(function(_, i) {
          return <View key={'v' + i} style={[styles.gridLine, styles.vLine, { left: i * 44 }]} />;
        })}
      </View>

      {/* Top HUD bar */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.hudBtn}
            onPress={function() { navigation.goBack(); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.hudBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.statusBadge}>
            <View style={[
              styles.statusDot,
              { backgroundColor: phase === 'result' ? Colors.success : isProcessing ? Colors.warning : Colors.hudGreen },
            ]} />
            <Text style={[
              styles.statusText,
              { color: phase === 'result' ? Colors.success : isProcessing ? Colors.warning : Colors.hudGreen },
            ]}>
              {phase === 'ready' ? 'READY'
                : phase === 'scanning' ? 'CAPTURING'
                : phase === 'analysing' ? 'ANALYSING'
                : phase === 'result' ? 'DETECTED'
                : 'NO MATCH'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={styles.hudBtn}
              onPress={function() { setFlashMode(function(f) { return f === 'off' ? 'on' : 'off'; }); }}
            >
              <Text style={styles.hudBtnText}>{flashMode === 'off' ? '⚡' : '💡'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.hudBtn}
              onPress={function() { setFacing(function(f) { return f === 'back' ? 'front' : 'back'; }); }}
            >
              <Text style={styles.hudBtnText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Viewfinder — ready / scanning */}
      {(phase === 'ready' || phase === 'scanning') && (
        <View style={styles.viewfinderWrap} pointerEvents="none">
          <PulseRing />
          <HudBracket size={220} color={Colors.hudGreen} thickness={3}>
            {phase === 'scanning' && <ScanLine />}
            {phase === 'ready' && <Text style={styles.crosshair}>⊕</Text>}
          </HudBracket>
        </View>
      )}

      {/* Analysing spinner */}
      {phase === 'analysing' && (
        <View style={styles.viewfinderWrap} pointerEvents="none">
          <View style={styles.analysingCard}>
            <ActivityIndicator size="large" color={Colors.hudGreen} />
            <Text style={styles.analysingText}>Identifying object...</Text>
            <Text style={styles.analysingSubText}>AI analysis in progress</Text>
          </View>
        </View>
      )}

      {/* No match */}
      {phase === 'no_match' && (
        <View style={styles.viewfinderWrap} pointerEvents="none">
          <View style={[styles.analysingCard, { borderColor: Colors.warning + '66' }]}>
            <Text style={{ fontSize: 44 }}>🔎</Text>
            <Text style={[styles.analysingText, { color: Colors.warning }]}>No Match Found</Text>
            <Text style={styles.analysingSubText}>
              Try pointing at: cat, dog, book, chair, cup…
            </Text>
          </View>
        </View>
      )}

      {/* Result overlay */}
      {phase === 'result' && detectedWord && (
        <View style={styles.viewfinderWrap} pointerEvents="none">
          <Animated.View style={{ transform: [{ scale: scaleResult }], opacity: fadeResult }}>
            <LensFrame
              size={160}
              borderColor={Colors.hudGreen}
              borderWidth={3}
              showHandle
              glowColor={Colors.hudGreen}
            >
              <View style={styles.detectedInner}>
                <Text style={styles.detectedEmoji}>{detectedWord.emoji}</Text>
              </View>
            </LensFrame>
          </Animated.View>
          <Text style={[styles.statusText, { color: Colors.hudGreen, marginTop: 10, fontSize: 13 }]}>
            Object Locked 🔒
          </Text>
        </View>
      )}

      {/* Bottom area */}
      <View style={styles.bottomArea}>

        {/* Detected word card */}
        {phase === 'result' && detectedWord && (
          <View style={styles.resultCard}>
            <View style={styles.detectionRow}>
              <View style={styles.detectedDot} />
              <Text style={styles.detectedLabel}>Object Detected!</Text>
              <View style={{ flex: 1 }} />
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{detectedWord.category}</Text>
              </View>
            </View>

            <View style={{ height: 10 }} />

            <View style={styles.wordRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.wordEnglish}>{detectedWord.englishName}</Text>
                <Text style={styles.wordFilipino}>{detectedWord.filipinoName}</Text>
              </View>
              <View>
                <TouchableOpacity
                  style={styles.ttsBtn}
                  onPress={function() { TtsHelper.speakEnglish(detectedWord.englishName); }}
                >
                  <Text style={styles.ttsBtnText}>🔊 EN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ttsBtn}
                  onPress={function() { TtsHelper.speakFilipino(detectedWord.filipinoName); }}
                >
                  <Text style={styles.ttsBtnText}>🔊 FIL</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 14 }} />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                onPress={function() { navigation.navigate('Identification', { word: detectedWord }); }}
              >
                <Text style={styles.actionBtnText}>✅ Identify</Text>
              </TouchableOpacity>
              <View style={{ width: 10 }} />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.secondary }]}
                onPress={function() { navigation.navigate('Spelling', { word: detectedWord }); }}
              >
                <Text style={styles.actionBtnText}>✏️ Spell It</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* No match hint card */}
        {phase === 'no_match' && (
          <View style={[styles.resultCard, { alignItems: 'center' }]}>
            <Text style={styles.noMatchTitle}>Object not in vocabulary list</Text>
            <Text style={styles.noMatchSub}>
              Try scanning: a cat, dog, book, chair, cup, apple, ball…
            </Text>
          </View>
        )}

        {/* Shutter row */}
        <View style={styles.shutterRow}>

          <View style={styles.zoomGroup}>
            {[0, 0.1, 0.2].map(function(z) {
              return (
                <TouchableOpacity
                  key={String(z)}
                  style={[styles.zoomBtn, zoom === z && styles.zoomBtnActive]}
                  onPress={function() { setZoom(z); }}
                >
                  <Text style={[styles.zoomText, zoom === z && { color: Colors.hudGreen }]}>
                    {z === 0 ? '1×' : z === 0.1 ? '2×' : '3×'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.shutter, isProcessing && { opacity: 0.5 }]}
            onPress={phase === 'ready' ? handleCapture : resetScan}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <View style={styles.shutterInner}>
              <Text style={{ fontSize: 28 }}>{shutterEmoji}</Text>
            </View>
          </TouchableOpacity>

          <View style={{ width: 88 }} />
        </View>

        {phase === 'ready' && (
          <Text style={styles.hintText}>Tap the button to scan an object</Text>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  permCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, backgroundColor: Colors.hudBg,
  },
  permTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 10 },
  permSub: { fontSize: 14, color: Colors.hudGreen, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  permBtn: { backgroundColor: Colors.hudGreen, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  permBtnText: { color: Colors.hudBg, fontWeight: '800', fontSize: 16 },

  gridLine: { position: 'absolute', backgroundColor: Colors.hudGreen + '08' },
  hLine: { left: 0, right: 0, height: 1 },
  vLine: { top: 0, bottom: 0, width: 1 },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  hudBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: Colors.hudGreen + '44', minWidth: 42, alignItems: 'center',
  },
  hudBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.hudGreen + '44',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: Colors.hudGreen },

  viewfinderWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 200,
    alignItems: 'center', justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute', width: 270, height: 270, borderRadius: 135,
    borderWidth: 1.5, borderColor: Colors.hudGreen,
  },
  scanLine: {
    position: 'absolute', width: 180, height: 2.5,
    backgroundColor: Colors.hudGreen, opacity: 0.7,
  },
  crosshair: { color: Colors.hudGreen, fontSize: 38, opacity: 0.6 },

  analysingCard: {
    backgroundColor: 'rgba(10,22,40,0.88)', borderRadius: 20,
    padding: 28, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.hudGreen + '55', minWidth: 220,
  },
  analysingText: { color: Colors.hudGreen, fontWeight: '800', fontSize: 16, marginTop: 4 },
  analysingSubText: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 18 },

  detectedInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  detectedEmoji: { fontSize: 64 },

  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 36 },

  resultCard: {
    backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 24,
    padding: 20, marginBottom: 14,
    elevation: 20, shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20,
  },
  detectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  detectedLabel: { color: Colors.success, fontWeight: '700', fontSize: 14 },
  categoryBadge: { backgroundColor: Colors.primary + '1A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  categoryBadgeText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  wordRow: { flexDirection: 'row', alignItems: 'flex-end' },
  wordEnglish: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  wordFilipino: { fontSize: 18, fontWeight: '600', color: Colors.secondary },
  ttsBtn: { padding: 4, marginBottom: 2 },
  ttsBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  actionRow: { flexDirection: 'row' },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  noMatchTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  noMatchSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  shutterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, marginBottom: 8,
  },
  zoomGroup: { flexDirection: 'row', gap: 6 },
  zoomBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  zoomBtnActive: { borderColor: Colors.hudGreen, backgroundColor: 'rgba(0,230,118,0.15)' },
  zoomText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  shutter: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600',
    textAlign: 'center', letterSpacing: 0.3,
  },
});