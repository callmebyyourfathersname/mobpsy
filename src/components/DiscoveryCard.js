import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

/**
 * DiscoveryCard — Pokédex-style vocabulary word card.
 * state: 'undiscovered' | 'discovered' | 'mastered'
 * Mirrors Flutter's DiscoveryCard widget.
 */
export default function DiscoveryCard({ word, state, stars = 0, onTap }) {
  const isDiscovered = state === 'discovered' || state === 'mastered';
  const isMastered = state === 'mastered';

  const borderColor = isMastered
    ? Colors.masteryGold
    : isDiscovered
    ? Colors.primary
    : Colors.divider;

  const bgColor = isMastered
    ? Colors.masteryGold + '15'
    : isDiscovered
    ? Colors.primary + '0D'
    : Colors.silhouetteBg;

  return (
    <TouchableOpacity
      onPress={onTap}
      activeOpacity={0.8}
      style={[styles.card, { borderColor, backgroundColor: bgColor }]}
    >
      {/* Mastery glow rim */}
      {isMastered && <View style={styles.masteryRim} />}

      {/* Emoji / silhouette */}
      <View style={styles.iconArea}>
        {isDiscovered ? (
          <Text style={styles.emoji}>{word.emoji}</Text>
        ) : (
          <Text style={styles.silhouette}>❓</Text>
        )}
      </View>

      {/* Word name */}
      {isDiscovered ? (
        <>
          <Text style={styles.englishName}>{word.englishName}</Text>
          <Text style={styles.filipinoName}>{word.filipinoName}</Text>
        </>
      ) : (
        <Text style={styles.unknownName}>???</Text>
      )}

      {/* Category badge */}
      <View style={[styles.catBadge, { backgroundColor: isDiscovered ? Colors.primary + '1A' : Colors.divider + '80' }]}>
        <Text style={[styles.catText, { color: isDiscovered ? Colors.primary : Colors.textSecondary }]}>
          {word.category}
        </Text>
      </View>

      {/* Stars (discovered only) */}
      {isDiscovered && (
        <View style={styles.starsRow}>
          {[0, 1, 2].map(i => (
            <Text key={i} style={{ fontSize: 12, opacity: i < stars ? 1 : 0.2 }}>⭐</Text>
          ))}
        </View>
      )}

      {/* Mastered badge */}
      {isMastered && (
        <View style={styles.masteredBadge}>
          <Text style={styles.masteredText}>🏆</Text>
        </View>
      )}

      {/* Fog overlay for undiscovered */}
      {!isDiscovered && <View style={styles.fogOverlay} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    minHeight: 160,
  },
  masteryRim: {
    position: 'absolute', inset: 0,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.masteryGold + '60',
  },
  iconArea: {
    width: 64, height: 64,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: { fontSize: 48 },
  silhouette: { fontSize: 40, opacity: 0.3 },
  englishName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  filipinoName: { fontSize: 12, fontWeight: '600', color: Colors.secondary, textAlign: 'center', marginBottom: 4 },
  unknownName: { fontSize: 15, fontWeight: '800', color: Colors.textSecondary, marginBottom: 4 },
  catBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  catText: { fontSize: 10, fontWeight: '700' },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 6 },
  masteredBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  masteredText: { fontSize: 16 },
  fogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.fogOverlay + '33',
    borderRadius: 18,
  },
});
