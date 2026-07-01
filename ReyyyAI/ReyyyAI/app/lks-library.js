import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import storageService from '../services/storageService';
import apiService from '../services/apiService';

export default function LKSLibrary() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [ocrResult, setOcrResult] = useState('');

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    const p = await storageService.getPhotos();
    setPhotos(p || []);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const saved = await storageService.savePhoto('Umum', asset.uri);
      if (asset.base64) {
        try {
          const ocr = await apiService.analyzeImage(asset.base64, 'Baca semua teks di gambar ini. Sebutkan halaman berapa jika ada.');
          await storageService.updatePhotoOCR(saved.id, ocr.text);
        } catch (e) {}
      }
      await loadPhotos();
    }
  };

  const deletePhoto = (id) => {
    Alert.alert('Hapus Foto', 'Yakin hapus foto ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        await storageService.deletePhoto(id);
        await loadPhotos();
        if (selectedPhoto?.id === id) setSelectedPhoto(null);
      }},
    ]);
  };

  const renderPhoto = ({ item }) => (
    <TouchableOpacity style={styles.photoCard} onPress={() => setSelectedPhoto(item)} onLongPress={() => deletePhoto(item.id)}>
      <Image source={{ uri: item.file_path }} style={styles.photoImage} />
      {item.page_number && (
        <View style={styles.pageBadge}>
          <Text style={styles.pageText}>Hal {item.page_number}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (selectedPhoto) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Preview</Text>
          <TouchableOpacity onPress={() => deletePhoto(selectedPhoto.id)}>
            <Feather name="trash-2" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
        <Image source={{ uri: selectedPhoto.file_path }} style={styles.fullImage} resizeMode="contain" />
        {selectedPhoto.ocr_text && (
          <View style={styles.ocrBox}>
            <Text style={styles.ocrText}>{selectedPhoto.ocr_text}</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>LKS Library</Text>
        <Text style={styles.count}>{photos.length} foto</Text>
      </View>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="book-open" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>Belum ada foto LKS</Text>
            <Text style={styles.emptyText}>Upload foto soal dari buku tulis kamu</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={pickImage}>
        <Feather name="camera" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  count: { fontSize: 13, color: COLORS.textSecondary },
  grid: { padding: 8, gap: 8 },
  photoCard: { flex: 1, margin: 4, borderRadius: 8, overflow: 'hidden', backgroundColor: COLORS.surface, aspectRatio: 0.75 },
  photoImage: { width: '100%', height: '100%' },
  pageBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pageText: { fontSize: 10, color: '#fff', fontWeight: '500' },
  fullImage: { flex: 1, width: '100%' },
  ocrBox: { padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  ocrText: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', elevation: 4 },
});