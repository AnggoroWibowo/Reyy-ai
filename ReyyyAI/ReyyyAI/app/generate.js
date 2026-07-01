import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../utils/colors';
import apiService from '../services/apiService';
import storageService from '../services/storageService';

export default function GenerateScreen() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [activeTab, setActiveTab] = useState('image');
  const [style, setStyle] = useState('realistic');

  const styles_list = ['Realistic', 'Anime', '3D', 'Pixel', 'Sketch'];

  const generateImage = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const result = await apiService.smartChat([
        { role: 'user', content: `Generate a detailed image description for: ${prompt}. Style: ${style}. Describe it in English for image generation.` }
      ]);
      const saved = await storageService.savePhoto('Generated', '', null);
      setGeneratedImages(prev => [{ id: saved.id, prompt, style, file_path: saved.file_path, text: result.text }, ...prev]);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Generate</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'image' && styles.tabActive]} onPress={() => setActiveTab('image')}>
          <Feather name="image" size={16} color={activeTab === 'image' ? '#fff' : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'image' && styles.tabActiveText]}>Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'video' && styles.tabActive]} onPress={() => setActiveTab('video')}>
          <Feather name="film" size={16} color={activeTab === 'video' ? '#fff' : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'video' && styles.tabActiveText]}>Video</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputSection}>
        <TextInput
          style={styles.promptInput}
          placeholder="Deskripsikan gambar yang kamu inginkan..."
          placeholderTextColor={COLORS.textPlaceholder}
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />
        <View style={styles.styleRow}>
          {styles_list.map(s => (
            <TouchableOpacity key={s} style={[styles.stylePill, style === s.toLowerCase() && styles.styleActive]} onPress={() => setStyle(s.toLowerCase())}>
              <Text style={[styles.styleText, style === s.toLowerCase() && styles.styleActiveText]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.generateBtn} onPress={generateImage} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateText}>Generate Gambar</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={generatedImages}
        renderItem={({ item }) => (
          <View style={styles.genCard}>
            <View style={styles.genPlaceholder}>
              <Feather name="image" size={40} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.genPrompt} numberOfLines={2}>{item.prompt}</Text>
            <Text style={styles.genStyle}>{item.style}</Text>
          </View>
        )}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.genGrid}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="cpu" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Generate gambar pertama kamu!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.surface },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  tabActiveText: { color: '#fff' },
  inputSection: { paddingHorizontal: 16, gap: 12 },
  promptInput: { backgroundColor: COLORS.surface, borderRadius: 8, padding: 12, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, minHeight: 80, textAlignVertical: 'top' },
  styleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stylePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  styleActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  styleText: { fontSize: 12, color: COLORS.textSecondary },
  styleActiveText: { color: '#fff' },
  generateBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  generateText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  genGrid: { padding: 12, gap: 12 },
  genCard: { flex: 1, margin: 6, backgroundColor: COLORS.surface, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  genPlaceholder: { height: 120, backgroundColor: COLORS.background, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  genPrompt: { fontSize: 12, color: COLORS.text, marginBottom: 4 },
  genStyle: { fontSize: 10, color: COLORS.accent, fontWeight: '500' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 12 },
});