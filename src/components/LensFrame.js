import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

/**
 * LensFrame — magnifying glass shape widget.
 * Mirrors Flutter's LensFrame widget.
 */
export default function LensFrame({
  size = 100,
  borderColor = Colors.primary,
  borderWidth = 3,
  showHandle = false,
  glowColor = null,
  children,
}) {
  const handleHeight = size * 0.32;
  const handleWidth = size * 0.14;

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Circular lens */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor,
          },
          glowColor && {
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 8,
          },
        ]}
      >
        {children}
      </View>

      {/* Handle */}
      {showHandle && (
        <View
          style={[
            styles.handle,
            {
              width: handleWidth,
              height: handleHeight,
              borderRadius: handleWidth / 2,
              backgroundColor: borderColor,
              marginTop: -borderWidth,
              transform: [{ rotate: '30deg' }],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  handle: {
    alignSelf: 'flex-end',
    marginRight: '18%',
  },
});
