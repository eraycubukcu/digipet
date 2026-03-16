/**
 * onboarding.tsx — İlk açılışta gösterilen 3 slaytlı tanıtım ekranı.
 * AsyncStorage'da flag yoksa görünür, "Hadi Başlayalım!" ile kapanır.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { usePet, STORAGE_ONBOARDING_KEY } from '../context/PetContext';

const { width: EKRAN_GENISLIK } = Dimensions.get('window');

// ─── SLAYT VERİSİ ────────────────────────────────────────────────────────────
interface Slayt {
  arka: string;
  emoji: string;
  baslikTR: string;
  baslikEN: string;
  aciklamaTR: string;
  aciklamaEN: string;
}

const SLAYTLAR: Slayt[] = [
  {
    arka:        '#667eea',
    emoji:       '🐾',
    baslikTR:    'DigiPet\'e Hoş Geldin!',
    baslikEN:    'Welcome to DigiPet!',
    aciklamaTR:  'Dijital evcil hayvanına sahip ol, besle, büyüt ve eğlen!',
    aciklamaEN:  'Own a digital pet, feed it, grow it and have fun!',
  },
  {
    arka:        '#f093fb',
    emoji:       '🎰',
    baslikTR:    'Evcil Hayvanını Oluştur',
    baslikEN:    'Create Your Pet',
    aciklamaTR:  'Slot makinesiyle 15 farklı tip arasından rastgele seç. Beğenmezsen tekrarla!',
    aciklamaEN:  'Use the slot machine to randomly pick from 15 types. Not happy? Spin again!',
  },
  {
    arka:        '#4facfe',
    emoji:       '🏆',
    baslikTR:    'Besle, Oyna, Büyüt!',
    baslikEN:    'Feed, Play, Grow!',
    aciklamaTR:  'Görevleri tamamla, rozet kazan, mağazadan item al ve efsane ol!',
    aciklamaEN:  'Complete daily quests, earn badges, buy items and become a legend!',
  },
];

// ─── NOKTA İNDİKATÖRÜ ────────────────────────────────────────────────────────
const NoktaIndikatoru = ({ aktif, toplam }: { aktif: number; toplam: number }) => (
  <View style={noktaStil.satir}>
    {Array.from({ length: toplam }).map((_, i) => (
      <View
        key={i}
        style={[noktaStil.nokta, i === aktif && noktaStil.aktifNokta]}
      />
    ))}
  </View>
);

const noktaStil = StyleSheet.create({
  satir:      { flexDirection: 'row', gap: 8, marginBottom: 32 },
  nokta:      { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  aktifNokta: { width: 24, backgroundColor: '#ffffff' },
});

// ─── ANA BİLEŞEN ─────────────────────────────────────────────────────────────
export default function OnboardingEkrani() {
  const { state } = usePet();
  const [aktifIndex, setAktifIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const dil = state.dil;

  /** Onboarding flag'ini yazar ve Ana Oyun'a geçer */
  const tamam = async () => {
    await AsyncStorage.setItem(STORAGE_ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  const renderSlayt = ({ item }: { item: Slayt }) => (
    <View style={[styles.slayt, { width: EKRAN_GENISLIK, backgroundColor: item.arka }]}>
      <Text style={styles.slaytEmoji}>{item.emoji}</Text>
      <Text style={styles.slaytBaslik}>
        {dil === 'tr' ? item.baslikTR : item.baslikEN}
      </Text>
      <Text style={styles.slaytAciklama}>
        {dil === 'tr' ? item.aciklamaTR : item.aciklamaEN}
      </Text>
    </View>
  );

  const sonSlaytMi = aktifIndex === SLAYTLAR.length - 1;

  return (
    <SafeAreaView style={styles.guvenliAlan}>
      <StatusBar barStyle="light-content" />

      {/* Yatay slayt listesi */}
      <FlatList
        ref={listRef}
        data={SLAYTLAR}
        renderItem={renderSlayt}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / EKRAN_GENISLIK);
          setAktifIndex(index);
        }}
        style={styles.liste}
      />

      {/* Alt alan: nokta + buton */}
      <View style={styles.altAlan}>
        <NoktaIndikatoru aktif={aktifIndex} toplam={SLAYTLAR.length} />

        {sonSlaytMi ? (
          <TouchableOpacity style={styles.baslatButon} onPress={tamam}>
            <Text style={styles.baslatButonMetin}>
              {dil === 'tr' ? 'Hadi Başlayalım! 🚀' : "Let's Go! 🚀"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.ileriButon}
            onPress={() => {
              listRef.current?.scrollToIndex({ index: aktifIndex + 1, animated: true });
              setAktifIndex((p) => p + 1);
            }}
          >
            <Text style={styles.ileriButonMetin}>
              {dil === 'tr' ? 'İleri →' : 'Next →'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={tamam} style={styles.atlaButon}>
          <Text style={styles.atlaMetin}>
            {dil === 'tr' ? 'Atla' : 'Skip'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── STİLLER ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  guvenliAlan: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  liste: {
    flex: 1,
  },
  slayt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  slaytEmoji: {
    fontSize: 100,
    marginBottom: 24,
  },
  slaytBaslik: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  slaytAciklama: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  altAlan: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  baslatButon: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  baslatButonMetin: {
    fontSize: 17,
    fontWeight: '800',
    color: '#667eea',
  },
  ileriButon: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  ileriButonMetin: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  atlaButon: {
    padding: 8,
  },
  atlaMetin: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});
