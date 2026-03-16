/**
 * app/(tabs)/explore.tsx — Mağaza Ekranı
 * ─────────────────────────────────────────
 * 6 ürün: Mama, Oyuncak, Vitamin (stat +5) ve
 * Şapka, Gözlük, Pelerin (görsel aksesuar).
 * Altınla satın alınır; yetersiz altın → kırmızı/disabled buton.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { usePet, MAGAZA_ITEMLERI, MagazaItem } from '../../context/PetContext';

export default function MagazaEkrani() {
  const { state, dispatch, tema, metin } = usePet();

  /** Satın alma işlemi */
  const satinAl = (item: MagazaItem) => {
    if (state.altin < item.fiyat) {
      Alert.alert('❌', metin.yeterliAltinYok);
      return;
    }
    // Aksesuar zaten sahipse uyarı ver
    if (item.aksesuar && state.aksesuarlar.includes(item.id)) {
      Alert.alert('ℹ️', state.dil === 'tr' ? 'Bu aksesuar zaten sende var!' : 'You already own this accessory!');
      return;
    }
    dispatch({ type: 'MAGAZA_SATIN', payload: { item } });
    Alert.alert('✅', state.dil === 'tr' ? `${item.adTR} satın alındı!` : `${item.adEN} purchased!`);
  };

  /** İtem adını dile göre döndürür */
  const itemAd = (item: MagazaItem) => state.dil === 'tr' ? item.adTR : item.adEN;

  /** İtem açıklamasını oluşturur */
  const itemAciklama = (item: MagazaItem): string => {
    if (state.dil === 'tr') {
      if (item.etki.aclik)    return `Açlık +${item.etki.aclik}`;
      if (item.etki.mutluluk) return `Mutluluk +${item.etki.mutluluk}`;
      if (item.etki.enerji)   return `Enerji +${item.etki.enerji}`;
      return 'Görsel aksesuar';
    } else {
      if (item.etki.aclik)    return `Hunger +${item.etki.aclik}`;
      if (item.etki.mutluluk) return `Happiness +${item.etki.mutluluk}`;
      if (item.etki.enerji)   return `Energy +${item.etki.enerji}`;
      return 'Visual accessory';
    }
  };

  const sahip = (item: MagazaItem) => item.aksesuar && state.aksesuarlar.includes(item.id);
  const yeterliAltin = (item: MagazaItem) => state.altin >= item.fiyat;

  // İtem kategorileri
  const statItemler  = MAGAZA_ITEMLERI.filter(i => !i.aksesuar);
  const aksesuarlar  = MAGAZA_ITEMLERI.filter(i => i.aksesuar);

  const renderItem = (item: MagazaItem) => {
    const yeterli = yeterliAltin(item);
    const zatenSahip = sahip(item);
    const butonRenk = zatenSahip ? '#64748b' : yeterli ? '#667eea' : '#ef4444';

    return (
      <View key={item.id} style={[styles.kart, { backgroundColor: tema.kart, borderColor: tema.border }]}>
        <Text style={styles.kartEmoji}>{item.emoji}</Text>
        <View style={styles.kartBilgi}>
          <Text style={[styles.kartAd, { color: tema.yazi }]}>{itemAd(item)}</Text>
          <Text style={[styles.kartAciklama, { color: tema.yaziSecondary }]}>{itemAciklama(item)}</Text>
        </View>
        <View style={styles.kartSag}>
          <Text style={styles.fiyatMetin}>💰 {item.fiyat}</Text>
          <TouchableOpacity
            style={[styles.satinButon, { backgroundColor: butonRenk }]}
            onPress={() => satinAl(item)}
            disabled={zatenSahip}
          >
            <Text style={styles.satinButonMetin}>
              {zatenSahip ? '✓' : metin.satin}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.guvenliAlan, { backgroundColor: tema.arkaplan }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.kapsayici}>

        {/* Başlık */}
        <Text style={[styles.baslik, { color: tema.yazi }]}>🛒 {metin.magaza}</Text>

        {/* Altın göstergesi */}
        <View style={[styles.altinKutu, { backgroundColor: tema.kart, borderColor: tema.border }]}>
          <Text style={[styles.altinLabel, { color: tema.yaziSecondary }]}>
            {state.dil === 'tr' ? 'Mevcut Altın' : 'Current Gold'}
          </Text>
          <Text style={styles.altinDeger}>💰 {state.altin}</Text>
        </View>

        {/* Stat artırıcılar */}
        <Text style={[styles.kategoriBaslik, { color: tema.yaziSecondary }]}>
          {state.dil === 'tr' ? '— Stat Artırıcılar —' : '— Stat Boosters —'}
        </Text>
        {statItemler.map(renderItem)}

        {/* Aksesuarlar */}
        <Text style={[styles.kategoriBaslik, { color: tema.yaziSecondary }]}>
          — {metin.aksesuarlar} —
        </Text>
        {aksesuarlar.map(renderItem)}

        {/* Sahip olunan aksesuarlar özeti */}
        {state.aksesuarlar.length > 0 && (
          <View style={[styles.ozet, { backgroundColor: tema.kart, borderColor: tema.border }]}>
            <Text style={[styles.ozetBaslik, { color: tema.yazi }]}>
              {state.dil === 'tr' ? '✨ Aktif Aksesuarlar' : '✨ Active Accessories'}
            </Text>
            <Text style={styles.ozetEmojiler}>
              {state.aksesuarlar.map(id => MAGAZA_ITEMLERI.find(i => i.id === id)?.emoji ?? '').join('  ')}
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STİLLER ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  guvenliAlan:      { flex: 1 },
  kapsayici:        { padding: 20, gap: 12, paddingBottom: 32 },
  baslik:           { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  altinKutu:        { borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, marginBottom: 4 },
  altinLabel:       { fontSize: 14 },
  altinDeger:       { fontSize: 22, fontWeight: '800', color: '#fbbf24' },
  kategoriBaslik:   { fontSize: 12, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2, marginVertical: 4 },
  kart:             { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, gap: 12 },
  kartEmoji:        { fontSize: 36 },
  kartBilgi:        { flex: 1, gap: 2 },
  kartAd:           { fontSize: 15, fontWeight: '700' },
  kartAciklama:     { fontSize: 12 },
  kartSag:          { alignItems: 'flex-end', gap: 8 },
  fiyatMetin:       { color: '#fbbf24', fontWeight: '700', fontSize: 14 },
  satinButon:       { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  satinButonMetin:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  ozet:             { borderRadius: 14, padding: 16, borderWidth: 1, gap: 8, alignItems: 'center', marginTop: 4 },
  ozetBaslik:       { fontSize: 14, fontWeight: '700' },
  ozetEmojiler:     { fontSize: 32 },
});
