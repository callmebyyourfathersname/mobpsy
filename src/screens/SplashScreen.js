import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { AppConstants } from '../data/constants';
import LensFrame from '../components/LensFrame';

export default function SplashScreen({ navigation }) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const slideTitle = useRef(new Animated.Value(20)).current;
  const fadeTagline = useRef(new Animated.Value(0)).current;
  const fadeSpinner = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo scale-in
    Animated.spring(scaleAnim, {
      toValue: 1, friction: 4, tension: 60, useNativeDriver: true,
    }).start();

    // Title fade + slide
    Animated.parallel([
      Animated.timing(fadeTitle, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
      Animated.timing(slideTitle, { toValue: 0, duration: 600, delay: 300, useNativeDriver: true }),
    ]).start();

    // Tagline fade
    Animated.timing(fadeTagline, { toValue: 1, duration: 600, delay: 600, useNativeDriver: true }).start();

    // Spinner fade
    Animated.timing(fadeSpinner, { toValue: 1, duration: 400, delay: 900, useNativeDriver: true }).start();

    // Spinner rotate
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Navigate after splash duration
    const timer = setTimeout(() => {
      navigation.replace('RoleSelect');
    }, AppConstants.splashDuration);

    return () => clearTimeout(timer);
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <LinearGradient colors={['#FFF8F0', '#F0E6FF']} style={styles.container}>
      {/* Subtle scan lines */}
      {[0,1,2,3,4,5].map(i => (
        <View key={i} style={[styles.scanLine, { top: 100 + i * 120 }]} />
      ))}

      {/* Logo */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LensFrame size={130} borderColor={Colors.primary} borderWidth={4} showHandle>
          <LinearGradient
            colors={[Colors.primaryLight + '66', Colors.primary + '26']}
            style={styles.logoInner}
          >
            <Text style={styles.logoIcon}>🔍</Text>
          </LinearGradient>
        </LensFrame>
      </Animated.View>

      <View style={{ height: 32 }} />

      {/* Title */}
      <Animated.Text style={[styles.title, { opacity: fadeTitle, transform: [{ translateY: slideTitle }] }]}>
        iSpy World
      </Animated.Text>

      <View style={{ height: 8 }} />

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: fadeTagline }]}>
        {AppConstants.appTagline}
      </Animated.Text>

      <View style={{ height: 48 }} />

      {/* Spinner */}
      <Animated.View style={[styles.spinnerWrap, { opacity: fadeSpinner, transform: [{ rotate: spin }] }]}>
        <View style={styles.spinner} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Colors.hudBorder + '0A' },
  logoInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoIcon: { fontSize: 52 },
  title: {
    fontSize: 36, fontWeight: '900', color: Colors.primaryDark,
    letterSpacing: 1, fontFamily: 'System',
  },
  tagline: {
    fontSize: 18, fontWeight: '600', color: Colors.secondary,
  },
  spinnerWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  spinner: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2.5, borderColor: Colors.primary + '80',
    borderTopColor: Colors.primary,
  },
});
