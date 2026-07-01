import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

const DEFAULT_PLAYLISTS = [
  { id: 'lofi', name: 'Lofi Study Beats', icon: 'headphones', songs: 12, duration: '45 min', color: '#6C63FF' },
  { id: 'classical', name: 'Classical Focus', icon: 'music', songs: 8, duration: '60 min', color: '#10B981' },
  { id: 'nature', name: 'Nature Sounds', icon: 'cloud', songs: 6, duration: '30 min', color: '#3B82F6' },
  { id: 'ambient', name: 'Deep Focus Ambient', icon: 'moon', songs: 10, duration: '50 min', color: '#F59E0B' },
];

const DEFAULT_SONGS = {
  lofi: [
    { id: 'l1', title: 'Calm Study', duration: '3:45', artist: 'Lofi Dreams' },
    { id: 'l2', title: 'Coffee Shop', duration: '4:12', artist: 'JazzHop' },
    { id: 'l3', title: 'Rainy Day', duration: '5:01', artist: 'Chill Beats' },
    { id: 'l4', title: 'Midnight Focus', duration: '3:30', artist: 'Night Owl' },
    { id: 'l5', title: 'Sunset Vibes', duration: '4:20', artist: 'Golden Hour' },
  ],
  classical: [
    { id: 'c1', title: 'Moonlight Sonata', duration: '6:15', artist: 'Beethoven' },
    { id: 'c2', title: 'Clair de Lune', duration: '5:30', artist: 'Debussy' },
    { id: 'c3', title: 'Four Seasons', duration: '4:45', artist: 'Vivaldi' },
    { id: 'c4', title: 'Nocturne', duration: '5:00', artist: 'Chopin' },
  ],
  nature: [
    { id: 'n1', title: 'Forest Rain', duration: '5:00', artist: 'Nature Sounds' },
    { id: 'n2', title: 'Ocean Waves', duration: '6:00', artist: 'Coastal' },
    { id: 'n3', title: 'Bird Songs', duration: '4:30', artist: 'Forest' },
  ],
  ambient: [
    { id: 'a1', title: 'Deep Space', duration: '8:00', artist: 'Cosmos' },
    { id: 'a2', title: 'Zen Garden', duration: '6:30', artist: 'Tranquil' },
    { id: 'a3', title: 'Ethereal', duration: '7:00', artist: 'Drift' },
  ],
};

export default function MusicScreen() {
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [sleepTimer, setSleepTimer] = useState(null);
  const [showSleepTimer, setShowSleepTimer] = useState(false);

  const selectPlaylist = (id) => {
    setActivePlaylist(id);
    const songs = DEFAULT_SONGS[id] || [];
    setCurrentSong(songs[0] || null);
    setPlaying(true);
  };

  const togglePlay = () => setPlaying(!playing);

  const nextSong = () => {
    if (!activePlaylist) return;
    const songs = DEFAULT_SONGS[activePlaylist] || [];
    const idx = songs.findIndex(s => s.id === currentSong?.id);
    setCurrentSong(songs[(idx + 1) % songs.length] || songs[0]);
    setPlaying(true);
  };

  const setSleep = (minutes) => {
    setSleepTimer(minutes);
    setShowSleepTimer(false);
    Alert.alert('Sleep Timer', `Musik akan berhenti setelah ${minutes} menit`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Music</Text>
        <TouchableOpacity onPress={() => setShowSleepTimer(!showSleepTimer)}>
          <Feather name="moon" size={20} color={sleepTimer ? COLORS.accent : COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {showSleepTimer && (
        <View style={styles.sleepPanel}>
          <Text style={styles.sleepTitle}>Sleep Timer</Text>
          <View style={styles.sleepOptions}>
            {[15, 30, 60, 90].map(m => (
              <TouchableOpacity key={m} style={styles.sleepBtn} onPress={() => setSleep(m)}>
                <Text style={styles.sleepBtnText}>{m} min</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sleepBtn} onPress={() => { setSleepTimer(null); setShowSleepTimer(false); }}>
              <Text style={styles.sleepBtnText}>Off</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {currentSong && (
        <View style={styles.nowPlaying}>
          <View style={styles.albumArt}>
            <Feather name="disc" size={80} color={activePlaylist ? DEFAULT_PLAYLISTS.find(p => p.id === activePlaylist)?.color || COLORS.accent : COLORS.textSecondary} />
          </View>
          <Text style={styles.songTitle}>{currentSong.title}</Text>
          <Text style={styles.songArtist}>{currentSong.artist} · {currentSong.duration}</Text>
          <View style={styles.controls}>
            <TouchableOpacity><Feather name="skip-back" size={24} color={COLORS.text} /></TouchableOpacity>
            <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
              <Feather name={playing ? 'pause' : 'play'} size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={nextSong}><Feather name="skip-forward" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>
          <View style={styles.extraControls}>
            <TouchableOpacity><Feather name="shuffle" size={18} color={COLORS.textSecondary} /></TouchableOpacity>
            <TouchableOpacity><Feather name="repeat" size={18} color={COLORS.textSecondary} /></TouchableOpacity>
            <TouchableOpacity><Feather name="volume-2" size={18} color={COLORS.textSecondary} /></TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={DEFAULT_PLAYLISTS}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.playlistCard, activePlaylist === item.id && { borderColor: item.color }]} onPress={() => selectPlaylist(item.id)}>
            <View style={[styles.playlistIcon, { backgroundColor: item.color + '20' }]}>
              <Feather name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistName}>{item.name}</Text>
              <Text style={styles.playlistMeta}>{item.songs} lagu · {item.duration}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Playlists</Text>
        }
      />

      {activePlaylist && (
        <View style={styles.songList}>
          <Text style={styles.sectionTitle}>Songs</Text>
          {(DEFAULT_SONGS[activePlaylist] || []).map(s => (
            <TouchableOpacity key={s.id} style={[styles.songItem, currentSong?.id === s.id && styles.songActive]} onPress={() => { setCurrentSong(s); setPlaying(true); }}>
              <Text style={[styles.songItemTitle, currentSong?.id === s.id && { color: COLORS.accent }]}>{s.title}</Text>
              <Text style={styles.songItemMeta}>{s.artist} · {s.duration}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  sleepPanel: { backgroundColor: COLORS.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sleepTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  sleepOptions: { flexDirection: 'row', gap: 8 },
  sleepBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.surfaceHover },
  sleepBtnText: { fontSize: 13, color: COLORS.text },
  nowPlaying: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  albumArt: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  songTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  songArtist: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 32, marginTop: 20 },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  extraControls: { flexDirection: 'row', gap: 24, marginTop: 16 },
  list: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 10, marginTop: 8 },
  playlistCard: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: COLORS.surface, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  playlistIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  playlistInfo: { flex: 1 },
  playlistName: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  playlistMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  songList: { paddingHorizontal: 16, paddingBottom: 20 },
  songItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  songActive: { backgroundColor: COLORS.accent + '10', marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 6 },
  songItemTitle: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  songItemMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});