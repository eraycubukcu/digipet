/**
 * app/(tabs)/settings.tsx — Ayarlar Ekranı
 * ──────────────────────────────────────────
 * Karanlık mod, dil seçimi (TR/EN), veri sıfırlama,
 * versiyon ve geliştirici bilgisi.
 */

import React from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { usePet } from '../../context/PetContext';

export default function AyarlarEkrani() {
  const { state, dispatch, tema, metin, sifirla } = usePet();

  /** Veri sıfırlama onay diyalogu */
  const veriSifirlaOnay = () => {
    Alert.alert(
      metin.sifirlaOnay,
      metin.sifirlaOnayMesaj,
      [
        { text: metin.iptal, style: 'cancel' },
        {
          text: metin.evet,
          style: 'destructive',
          onPress: async () => {
            await sifirla();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const SatirBolucusu = () => (
    <View style={[styles.bolucuCizgi, { backgroundColor: tema.border }]} />
  );

  return (
    <SafeAreaView style={[styles.guvenliAlan, { backgroundColor: tema.arkaplan }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.kapsayici}>

        {/* Başlık */}
        <Text style={[styles.baslik, { color: tema.yazi }]}>⚙️ {metin.ayarlar}</Text>

        {/* ── Görünüm Grubu ── */}
        <Text style={[styles.grupEtiketi, { color: tema.yaziSecondary }]}>
          {state.dil === 'tr' ? 'GÖRÜNÜM' : 'APPEARANCE'}
        </Text>
        <View style={[styles.grup, { backgroundColor: tema.kart, borderColor: tema.border }]}>

          {/* Karanlık Mod */}
          <View style={styles.satir}>
            <View style={styles.satirSol}>
              <Text style={styles.satirEmoji}>🌙</Text>
              <Text style={[styles.satirEtiket, { color: tema.yazi }]}>{metin.karanlikMod}</Text>
            </View>
            <Switch
              value={state.karanlikMod}
              onValueChange={() => dispatch({ type: 'KARANLIK_MOD_TOGGL' })}
              trackColor={{ false: '#e2e8f0', true: '#667eea' }}
              thumbColor="#fff"
            />
          </View>

          <SatirBolucusu />

          {/* Dil Seçimi */}
          <View style={styles.satir}>
            <View style={styles.satirSol}>
              <Text style={styles.satirEmoji}>🌍</Text>
              <Text style={[styles.satirEtiket, { color: tema.yazi }]}>{metin.dil}</Text>
            </View>
            <View style={styles.dilToggle}>
              {(['tr', 'en'] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dilButon,
                    state.dil === d && styles.dilButonAktif,
                  ]}
                  onPress={() => dispatch({ type: 'DIL_DEGISTIR', payload: d })}
                >
                  <Text style={[styles.dilButonMetin, state.dil === d && styles.dilButonMetinAktif]}>
                    {d.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Oyun Bilgisi Grubu ── */}
        <Text style={[styles.grupEtiketi, { color: tema.yaziSecondary }]}>
          {state.dil === 'tr' ? 'OYUN BİLGİSİ' : 'GAME INFO'}
        </Text>
        <View style={[styles.grup, { backgroundColor: tema.kart, borderColor: tema.border }]}>
          <BilgiSatiri
            emoji="🐾"
            etiket={state.dil === 'tr' ? 'Pet' : 'Pet'}
            deger={state.isim ?? (state.dil === 'tr' ? 'Henüz oluşturulmadı' : 'Not created yet')}
            tema={tema}
          />
          <SatirBolucusu />
          <BilgiSatiri
            emoji="🏆"
            etiket={state.dil === 'tr' ? 'Toplam Puan' : 'Total Score'}
            deger={String(state.puan)}
            tema={tema}
          />
          <SatirBolucusu />
          <BilgiSatiri
            emoji="💰"
            etiket={state.dil === 'tr' ? 'Altın' : 'Gold'}
            deger={String(state.altin)}
            tema={tema}
          />
          <SatirBolucusu />
          <BilgiSatiri
            emoji="🏅"
            etiket={state.dil === 'tr' ? 'Rozetler' : 'Badges'}
            deger={String(state.rozetler.length)}
            tema={tema}
          />
        </View>

        {/* ── Uygulama Grubu ── */}
        <Text style={[styles.grupEtiketi, { color: tema.yaziSecondary }]}>
          {state.dil === 'tr' ? 'UYGULAMA' : 'APP'}
        </Text>
        <View style={[styles.grup, { backgroundColor: tema.kart, borderColor: tema.border }]}>
          <BilgiSatiri emoji="📱" etiket={metin.versiyon} deger="1.0.0" tema={tema} />
          <SatirBolucusu />
          <BilgiSatiri
            emoji="👨‍💻"
            etiket={metin.gelistirici}
            deger="DigiPet Team"
            tema={tema}
          />
        </View>

        {/* ── Tehlikeli Bölge ── */}
        <Text style={[styles.grupEtiketi, { color: '#ef4444' }]}>
          {state.dil === 'tr' ? 'TEHLİKELİ BÖLGE' : 'DANGER ZONE'}
        </Text>
        <TouchableOpacity
          style={styles.sifirlaButon}
          onPress={veriSifirlaOnay}
        >
          <Text style={styles.sifirlaButonMetin}>🗑️ {metin.veriSifirla}</Text>
        </TouchableOpacity>

        <Text style={[styles.altBilgi, { color: tema.yaziSecondary }]}>
          DigiPet v1.0.0 — {state.dil === 'tr' ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

/** Bilgi satırı alt bileşeni */
const BilgiSatiri = ({
  emoji, etiket, deger, tema,
}: { emoji: string; etiket: string; deger: string; tema: any }) => (
  <View style={bsStil.satir}>
    <View style={bsStil.sol}>
      <Text style={bsStil.emoji}>{emoji}</Text>
      <Text style={[bsStil.etiket, { color: tema.yazi }]}>{etiket}</Text>
    </View>
    <Text style={[bsStil.deger, { color: tema.yaziSecondary }]}>{deger}</Text>
  </View>
);

const bsStil = StyleSheet.create({
  satir:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  sol:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji:  { fontSize: 20 },
  etiket: { fontSize: 15 },
  deger:  { fontSize: 14 },
});

// ─── STİLLER ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  guvenliAlan:       { flex: 1 },
  kapsayici:         { padding: 20, gap: 8, paddingBottom: 40 },
  baslik:            { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  grupEtiketi:       { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 8, marginBottom: 4, paddingLeft: 4 },
  grup:              { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4, borderWidth: 1, gap: 4 },
  satir:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  satirSol:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  satirEmoji:        { fontSize: 20 },
  satirEtiket:       { fontSize: 15 },
  bolucuCizgi:       { height: StyleSheet.hairlineWidth },
  dilToggle:         { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#667eea' },
  dilButon:          { paddingHorizontal: 16, paddingVertical: 7, backgroundColor: 'transparent' },
  dilButonAktif:     { backgroundColor: '#667eea' },
  dilButonMetin:     { fontSize: 13, fontWeight: '700', color: '#667eea' },
  dilButonMetinAktif:{ color: '#fff' },
  sifirlaButon:      { backgroundColor: '#fee2e2', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444', marginTop: 4 },
  sifirlaButonMetin: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
  altBilgi:          { textAlign: 'center', fontSize: 12, marginTop: 12 },
});
