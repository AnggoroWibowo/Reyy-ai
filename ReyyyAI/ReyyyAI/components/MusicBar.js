import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, PanResponder } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

export default function MusicBar({ song, playing, onTogglePlay, onNext, onClose, onPress }) {
  const [progress, setProgress] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressInterval = useRef(null);

  useEffect(() => {
    if (playing) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.01, 1));
      }, 1000);
    } else {
      clearInterval(progressInterval.current);
    }
    return () => clearInterval(progressInterval.current);
  }, [playing]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
    onPanResponderMove: (_, gesture) => {
      if (gesture.dy < -20) {
        slideAnim.setValue(Math.min(-gesture.dy / 100, 1));
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -40) {
        Animated.timing(slideAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => onClose?.());
      } else {
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }
    },
  });

  if (!song) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) }], opacity: slideAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.5, 0] }) }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.8}>
        <Feather name="music" size={16} color={COLORS.accent} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <TouchableOpacity onPress={onTogglePlay} style={styles.controlBtn}>
          <Feather name={playing ? 'pause' : 'play'} size={18} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={styles.controlBtn}>
          <Feather name="skip-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.controlBtn}>
          <Feather name="x" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
      <Text style={styles.swipeHint}>Swipe up to dismiss</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#050508', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  content: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  artist: { fontSize: 11, color: COLORS.textSecondary },
  progressBar: { width: 60, height: 2, backgroundColor: COLORS.surfaceHover, borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.accent },
  controlBtn: { padding: 6 },
  swipeHint: { fontSize: 9, color: COLORS.textPlaceholder, textAlign: 'center', paddingBottom: 4 },
});