/**
 * onboarding.tsx — İlk açılışta gösterilen 3 slaytlı tanıtım ekranı.
 * AsyncStorage'da flag yoksa görünür, "Hadi Başlayalım!" ile kapanır.
 * Slayt değişimlerinde SafeAreaView ve alt alan rengi 400ms smooth geçişle değişir.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

// ─── RENK GEÇİŞ HESAPLAYICI ──────────────────────────────────────────────────
/**
 * İki hex rengi interpolate ederek son rengi döndürür (0 = renk1, 1 = renk2).
 * Animated API, backgroundColor animasyonunu native'de yapamazken bu yaklaşım
 * JS'de Animated.Value değişimini yakalar ve rengi hesaplar.
 * Alternatif: tüm ekranı Animated.View ile sarmak.
 */
function hexToRgb(hex: string): [number, number, number] {
  const temiz = hex.replace('#', '');
  return [
    parseInt(temiz.slice(0, 2), 16),
    parseInt(temiz.slice(2, 4), 16),
    parseInt(temiz.slice(4, 6), 16),
  ];
}

function renkInterpolat(renk1: string, renk2: string, oran: number): string {
  const [r1, g1, b1] = hexToRgb(renk1);
  const [r2, g2, b2] = hexToRgb(renk2);
  const r = Math.round(r1 + (r2 - r1) * oran);
  const g = Math.round(g1 + (g2 - g1) * oran);
  const b = Math.round(b1 + (b2 - b1) * oran);
  return `rgb(${r},${g},${b})`;
}

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
  const [gecisRenk, setGecisRenk]   = useState(SLAYTLAR[0].arka);
  const listRef   = useRef<FlatList>(null);
  const animOran  = useRef(new Animated.Value(0)).current;
  const oncekiRef = useRef(SLAYTLAR[0].arka);
  const dil = state.dil;

  /**
   * Slayt değişince Animated.Value 0 → 1 arasında geçiş yapar.
   * Her tick'te oncekiRenk → yeniRenk arası interpolasyon hesaplanır
   * ve state güncellenerek SafeAreaView + altAlan rengi değişir.
   */
  useEffect(() => {
    const hedef    = SLAYTLAR[aktifIndex].arka;
    const baslangic = oncekiRef.current;

    animOran.setValue(0);
    const listener = animOran.addListener(({ value }) => {
      setGecisRenk(renkInterpolat(baslangic, hedef, value));
    });

    Animated.timing(animOran, {
      toValue:         1,
      duration:        400,
      useNativeDriver: false, // backgroundColor JS tarafında; native false zorunlu
    }).start(() => {
      oncekiRef.current = hedef;
      animOran.removeListener(listener);
    });

    return () => animOran.removeListener(listener);
  }, [aktifIndex]);

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
    // SafeAreaView'e dinamik renk — geçiş rengi her animasyon tick'inde güncellenir
    <SafeAreaView style={[styles.guvenliAlan, { backgroundColor: gecisRenk }]}>
      {/* StatusBar arka planı da aynı dinamik renge eşitlenir */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={gecisRenk}   // Android için gerekli
        translucent={false}
      />

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

      {/* Alt alan — dinamik arka plan rengi slaytla uyumlu */}
      <View style={[styles.altAlan, { backgroundColor: gecisRenk }]}>
        <NoktaIndikatoru aktif={aktifIndex} toplam={SLAYTLAR.length} />

        {sonSlaytMi ? (
          <TouchableOpacity style={styles.baslatButon} onPress={tamam}>
            <Text style={[styles.baslatButonMetin, { color: gecisRenk }]}>
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
    // backgroundColor dinamik olarak verilir, burada yok
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
    // backgroundColor dinamik olarak verilir
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
    // color dinamik olarak verilir (gecisRenk)
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
