import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

/**
 * HudBracket — AR-style corner bracket frame.
 * Mirrors Flutter's HudBracket widget.
 */
export default function HudBracket({
  size = 220,
  color = Colors.hudGreen,
  thickness = 3,
  cornerLength = 28,
  children,
}) {
  const corner = (top, right, bottom, left) => ({
    position: 'absolute',
    width: cornerLength,
    height: cornerLength,
    borderColor: color,
    borderTopWidth: top ? thickness : 0,
    borderRightWidth: right ? thickness : 0,
    borderBottomWidth: bottom ? thickness : 0,
    borderLeftWidth: left ? thickness : 0,
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Top-left */}
      <View style={[corner(true, false, false, true), { top: 0, left: 0 }]} />
      {/* Top-right */}
      <View style={[corner(true, true, false, false), { top: 0, right: 0 }]} />
      {/* Bottom-left */}
      <View style={[corner(false, false, true, true), { bottom: 0, left: 0 }]} />
      {/* Bottom-right */}
      <View style={[corner(false, true, true, false), { bottom: 0, right: 0 }]} />

      {children}
    </View>
  );
}
