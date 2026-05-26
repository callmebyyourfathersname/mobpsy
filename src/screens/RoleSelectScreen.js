import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

function RoleCard({ emoji, title, subtitle, gradient, onPress, delay = 0 }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 50, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={{ flex: 1 }}>
        <LinearGradient colors={gradient} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Decorative circles */}
          <View style={[styles.decCircle, { width: 120, height: 120, top: -30, right: -30, opacity: 0.12 }]} />
          <View style={[styles.decCircle, { width: 70, height: 70, bottom: 20, left: -20, opacity: 0.08 }]} />

          <View style={styles.cardInner}>
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{emoji}</Text>
            </View>
            <View style={{ height: 14 }} />
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </View>

          {/* Bottom arrow hint */}
          <View style={styles.arrowWrap}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RoleSelectScreen({ navigation }) {
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#FFF8F0', '#EAF6FF', '#F0E6FF']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>

        {/* Logo */}
        <Animated.View style={{
          transform: [{ scale: logoAnim }],
          alignItems: 'center',
        }}>
          <View style={styles.logoRing}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.logoBg}>
              <Text style={{ fontSize: 32 }}>🔍</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        <View style={{ height: 20 }} />

        {/* Title */}
        <Animated.View style={{ opacity: titleAnim, alignItems: 'center' }}>
          <Text style={styles.appName}>iSpy World</Text>
          <Text style={styles.tagline}>Discover • Learn • Explore</Text>
        </Animated.View>

        <View style={{ height: 36 }} />

        {/* Divider label */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>I am a...</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={{ height: 20 }} />

        {/* Cards row */}
        <View style={styles.cardsRow}>
          <RoleCard
            emoji="🎒"
            title="Student"
            subtitle="Join with class PIN"
            gradient={[Colors.primary, Colors.primaryDark]}
            onPress={() => navigation.navigate('StudentLogin')}
            delay={100}
          />
          <View style={{ width: 16 }} />
          <RoleCard
            emoji="👨‍👩‍👧"
            title="Parent"
            subtitle="View your child's progress"
            gradient={[Colors.secondary, Colors.secondaryDark]}
            onPress={() => navigation.navigate('ParentLogin')}
            delay={200}
          />
        </View>

        <View style={{ height: 28 }} />

        {/* Footer */}
        <Text style={styles.footer}>iSpy World © 2025</Text>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 24 },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: Colors.primaryLight,
    padding: 4,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  logoBg: { flex: 1, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 30, fontWeight: '900', color: Colors.primaryDark, letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginTop: 4, letterSpacing: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { marginHorizontal: 12, fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  cardsRow: { flexDirection: 'row', alignSelf: 'stretch', height: 220 },
  card: {
    flex: 1, borderRadius: 24, padding: 20,
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14,
    overflow: 'hidden', justifyContent: 'space-between',
  },
  decCircle: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  cardInner: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  emojiWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  cardSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 4, fontWeight: '600' },
  arrowWrap: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  arrow: { color: '#fff', fontWeight: '800', fontSize: 14 },
  footer: { fontSize: 11, color: Colors.textSecondary, opacity: 0.6 },
});