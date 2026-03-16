/**
 * app/(tabs)/index.tsx — Ana Oyun Ekranı
 * ───────────────────────────────────────
 * Ekran 1: Karakter Oluşturma (slot machine animasyonu)
 * Ekran 2: Ana Oyun (aksiyonlar, animasyonlar, görevler, rozetler)
 *
 * Context'ten state ve dispatch alınır; AsyncStorage yönetimi PetContext'te.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import {
  usePet,
  PET_TIPLERI,
  DURUM_ARKAPLAN,
  DurumTuru,
  sinirla,
  seviyelHesapla,
  seviyeBilgisi,
  rozetEtiketAl,
  bugunTarihi,
  rastgeleGorevlerUret,
  PetTip,
  GOREV_TANIMLARI,
} from '../../context/PetContext';

// ─── SLOT MACHINE ZAMANLAMA ───────────────────────────────────────────────────
const SLOT_HIZLI_MS   = 80;
const SLOT_YAVAS      = [150, 300, 500];
const SLOT_SURE_MS    = 2000;

// ─── OYUN DELTA DEĞERLERİ ────────────────────────────────────────────────────
const DELTA: Record<string, { aclik?: number; mutluluk?: number; enerji?: number; puan: number; altin: number }> = {
  besle: { aclik: 2,    enerji:  1,  puan: 10, altin:  5 },
  oyna:  { mutluluk: 2, enerji: -1,  puan: 15, altin:  8 },
  uyut:  { enerji:   3, mutluluk: -1, puan:  5, altin:  3 },
  yika:  { mutluluk: 1,              puan:  8, altin:  4 },
};

// ─── YARDIMCI FONKSİYONLAR ───────────────────────────────────────────────────

/** State'ten durum türünü hesaplar */
const durumHesapla = (aclik: number, mutluluk: number, enerji: number): DurumTuru => {
  if (aclik < 3)    return 'ac';
  if (mutluluk < 3) return 'uzgun';
  if (enerji < 3)   return 'yorgun';
  if (aclik >= 7 && mutluluk >= 7 && enerji >= 7) return 'harika';
  return 'normal';
};

/** Stat değerine göre bar rengini döndürür */
const barRenk = (v: number): string => {
  if (v < 3)  return '#f44336';
  if (v <= 6) return '#ffc107';
  return '#4caf50';
};

/** PET_TIPLERI'nden mevcut hariç rasgele seçer */
const rastgeleTip = (mevcutTip?: string): PetTip => {
  const havuz = mevcutTip ? PET_TIPLERI.filter(p => p.tip !== mevcutTip) : PET_TIPLERI;
  return havuz[Math.floor(Math.random() * havuz.length)];
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ALT BİLEŞENLER                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/** Animasyonlu stat barı */
const StatBari = ({ etiket, deger, tema }: { etiket: string; deger: number; tema: any }) => {
  const animVal = useRef(new Animated.Value(deger)).current;
  useEffect(() => {
    Animated.timing(animVal, { toValue: deger, duration: 400, useNativeDriver: false }).start();
  }, [deger]);
  const renk = barRenk(deger);
  return (
    <View style={statBarStil.satir}>
      <Text style={[statBarStil.etiket, { color: tema.yaziSecondary }]}>{etiket}</Text>
      <View style={[statBarStil.arkaplan, { backgroundColor: tema.border }]}>
        <Animated.View
          style={[
            statBarStil.dolgu,
            {
              width: animVal.interpolate({ inputRange: [0, 10], outputRange: ['0%', '100%'] }),
              backgroundColor: renk,
            },
          ]}
        />
      </View>
      <Text style={[statBarStil.deger, { color: renk }]}>{deger}/10</Text>
    </View>
  );
};

const statBarStil = StyleSheet.create({
  satir:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  etiket:   { fontSize: 13, width: 100 },
  arkaplan: { flex: 1, height: 10, borderRadius: 99, overflow: 'hidden' },
  dolgu:    { height: '100%', borderRadius: 99 },
  deger:    { width: 36, textAlign: 'right', fontSize: 13, fontWeight: '700' },
});

/** Uçan animasyon metni ('+10 puan' gibi) */
interface UcanMetinProps { metin: string; tetikle: boolean }
const UcanMetin = ({ metin, tetikle }: UcanMetinProps) => {
  const opak   = useRef(new Animated.Value(0)).current;
  const transY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!tetikle) return;
    opak.setValue(1);
    transY.setValue(0);
    Animated.parallel([
      Animated.timing(opak,   { toValue: 0, duration: 900, useNativeDriver: true }),
      Animated.timing(transY, { toValue: -60, duration: 900, useNativeDriver: true }),
    ]).start();
  }, [tetikle]);
  return (
    <Animated.Text
      style={[ucanStil.metin, { opacity: opak, transform: [{ translateY: transY }] }]}
      pointerEvents="none"
    >
      {metin}
    </Animated.Text>
  );
};

const ucanStil = StyleSheet.create({
  metin: {
    position:   'absolute',
    top:        0,
    alignSelf:  'center',
    fontSize:   18,
    fontWeight: '800',
    color:      '#fbbf24',
    zIndex:     99,
  },
});

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  EKRAN 1 — KARAKTER OLUŞTURMA                                            ║
// ╚══════════════════════════════════════════════════════════════════════════╝
const KarakterOlusturmaEkrani = ({ onOlustur }: { onOlustur: (isim: string, tip: string, emoji: string) => void }) => {
  const { tema, metin } = usePet();
  const [isim,    setIsim]    = useState('');
  const [goster,  setGoster]  = useState<PetTip | null>(null);
  const [secilen, setSecilen] = useState<PetTip | null>(null);
  const [doniyor, setDoniyor] = useState(false);

  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const pulseCal = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.25, duration: 55, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 55, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim]);

  const bounceCal = useCallback((final: PetTip) => {
    setGoster(final); setSecilen(final);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.5,  duration: 110, useNativeDriver: true }),
      Animated.spring( scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 18 }),
    ]).start(() => setDoniyor(false));
  }, [scaleAnim]);

  const temizle = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

  const slotBaslat = () => {
    temizle(); setDoniyor(true); setSecilen(null);
    const final = rastgeleTip(secilen?.tip);

    intervalRef.current = setInterval(() => { setGoster(rastgeleTip()); pulseCal(); }, SLOT_HIZLI_MS);
    SLOT_YAVAS.forEach((ms, i) => setTimeout(() => { temizle(); intervalRef.current = setInterval(() => { setGoster(rastgeleTip()); pulseCal(); }, ms); }, SLOT_SURE_MS + i * 400));
    setTimeout(() => { temizle(); bounceCal(final); }, SLOT_SURE_MS + SLOT_YAVAS.length * 400 + 500);
  };

  const olustur = () => {
    if (!isim.trim()) { Alert.alert('⚠️', metin.isimBos); return; }
    if (!secilen)     { Alert.alert('⚠️', metin.tipBos);  return; }
    onOlustur(isim.trim(), secilen.tip, secilen.emoji);
  };

  return (
    <SafeAreaView style={[styles.guvenliAlan, { backgroundColor: tema.arkaplan }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.olusturmaKapsayici} keyboardShouldPersistTaps="handled">

        <Text style={[styles.baslik, { color: tema.yazi }]}>🐾 DigiPet</Text>
        <Text style={[styles.altBaslik, { color: tema.yaziSecondary }]}>
          {metin.dil === 'tr' ? 'Evcil hayvanını oluştur' : 'Create your pet'}
        </Text>

        {/* İsim girişi */}
        <View style={styles.inputKutusu}>
          <Text style={[styles.inputEtiket, { color: tema.yaziSecondary }]}>{metin.isimEtiketi}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: tema.input, color: tema.yazi, borderColor: tema.border }]}
            placeholder={metin.isimPlaceholder}
            placeholderTextColor={tema.yaziSecondary}
            value={isim} onChangeText={setIsim} maxLength={20}
          />
        </View>

        {/* Slot ekranı */}
        <View style={[styles.slotKutusu, { backgroundColor: tema.kart, borderColor: tema.border }]}>
          {goster ? (
            <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
              <Text style={styles.slotEmoji}>{goster.emoji}</Text>
              {!doniyor && secilen && <Text style={[styles.slotTipAd, { color: tema.yazi }]}>{secilen.tip}</Text>}
            </Animated.View>
          ) : (
            <Text style={[styles.slotBosMetin, { color: tema.yaziSecondary }]}>
              {metin.tipUret} {'\n'}butonuna bas! 🎰
            </Text>
          )}
        </View>

        {/* Tip üret butonu */}
        <TouchableOpacity style={[styles.rastgeleButon, doniyor && styles.devreDisi]} onPress={slotBaslat} disabled={doniyor}>
          <Text style={styles.butonMetin}>{doniyor ? metin.doniyor : secilen ? metin.begenmedim : metin.tipUret}</Text>
        </TouchableOpacity>

        {/* Hayvanımı oluştur (sadece tip seçilince) */}
        {secilen && !doniyor && (
          <TouchableOpacity style={styles.olusturButon} onPress={olustur}>
            <Text style={styles.butonMetin}>{metin.hayvanOlustur}</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.altBilgi, { color: tema.yaziSecondary }]}>15 farklı tip</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  EKRAN 2 — ANA OYUN EKRANI                                               ║
// ╚══════════════════════════════════════════════════════════════════════════╝
const AnaOyunEkrani = () => {
  const { state, dispatch, tema, metin } = usePet();

  // Animasyon değerleri
  const petScale   = useRef(new Animated.Value(1)).current;
  const petRotate  = useRef(new Animated.Value(0)).current;
  const petTransY  = useRef(new Animated.Value(0)).current;
  const ekranOpak  = useRef(new Animated.Value(1)).current;

  // Uçan metin tetikleme state'i
  const [ucanMetin,  setUcanMetin]  = useState('');
  const [ucanSayac,  setUcanSayac]  = useState(0);

  // Seviye kutlama banner'ı
  const [kutlamaBanner, setKutlamaBanner] = useState('');
  const kutlamaOpak = useRef(new Animated.Value(0)).current;

  // Durumu hesapla
  const durum = durumHesapla(state.aclik, state.mutluluk, state.enerji);
  const arkaplanRenk = DURUM_ARKAPLAN[durum][tema.arkaplan === '#0f172a' ? 'dark' : 'light'];
  const sv = seviyeBilgisi(state.seviye);

  // Aksesuar emojileri
  const aksEmojiMap: Record<string, string> = { sapka: '🎩', gozluk: '🕶️', pelerin: '🦸' };
  const aksesuarStr = state.aksesuarlar.map(k => aksEmojiMap[k] ?? '').join('');

  /** Seviye atlama efekti */
  const seviyeAtlamaEfekti = useCallback((ad: string) => {
    setKutlamaBanner(`🎉 ${ad} Seviyesi!`);
    Animated.sequence([
      Animated.timing(kutlamaOpak, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(kutlamaOpak, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
    // Ekran parlaması
    Animated.sequence([
      Animated.timing(ekranOpak, { toValue: 0.6, duration: 120, useNativeDriver: true }),
      Animated.timing(ekranOpak, { toValue: 1,   duration: 200, useNativeDriver: true }),
    ]).start();
  }, [kutlamaOpak, ekranOpak]);

  /** Shake animasyonu (besle) */
  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(petTransY, { toValue: -8, duration: 60,  useNativeDriver: true }),
      Animated.timing(petTransY, { toValue:  8, duration: 60,  useNativeDriver: true }),
      Animated.timing(petTransY, { toValue: -8, duration: 60,  useNativeDriver: true }),
      Animated.timing(petTransY, { toValue:  0, duration: 60,  useNativeDriver: true }),
    ]).start();
  }, [petTransY]);

  /** Bounce animasyonu (oyna) */
  const bounce = useCallback(() => {
    Animated.sequence([
      Animated.timing(petTransY, { toValue: -30, duration: 200, useNativeDriver: true }),
      Animated.spring(petTransY, { toValue: 0, useNativeDriver: true, bounciness: 14 }),
    ]).start();
  }, [petTransY]);

  /** Pulse animasyonu (uyut) */
  const pulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(petScale, { toValue: 0.7, duration: 350, useNativeDriver: true }),
      Animated.timing(petScale, { toValue: 1,   duration: 350, useNativeDriver: true }),
    ]).start();
  }, [petScale]);

  /** Rotate animasyonu (yıka) */
  const rotate = useCallback(() => {
    petRotate.setValue(0);
    Animated.timing(petRotate, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [petRotate]);

  const rotateStr = petRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  /** Aksiyonu dispatch eder, animasyon çalar, uçan metin gösterir */
  const aksiyonYap = useCallback((tur: 'besle' | 'oyna' | 'uyut' | 'yika') => {
    const eskiSeviye = state.seviye;
    const d = DELTA[tur];

    // Animasyon
    if (tur === 'besle') shake();
    if (tur === 'oyna')  bounce();
    if (tur === 'uyut')  pulse();
    if (tur === 'yika')  rotate();

    // Uçan metin
    setUcanMetin(`+${d.puan} ${metin.puan}  +${d.altin} 💰`);
    setUcanSayac(c => c + 1);

    dispatch({
      type: 'AKSIYON_YAP',
      payload: {
        aclik:    d.aclik,
        mutluluk: d.mutluluk,
        enerji:   d.enerji,
        puan:     d.puan,
        altin:    d.altin,
        tur,
      },
    });

    // Seviye atlama kontrolü
    const yeniPuan   = state.puan + d.puan;
    const yeniSeviye = seviyelHesapla(yeniPuan);
    if (yeniSeviye > eskiSeviye) {
      const svBilgi = seviyeBilgisi(yeniSeviye);
      seviyeAtlamaEfekti(svBilgi.ad);
    }

    // Rozet bildirimi — kısa gecikmeyle (state henüz güncellenmedi)
    setTimeout(() => {}, 150);
  }, [state, dispatch, metin, shake, bounce, pulse, rotate, seviyeAtlamaEfekti]);

  // Günlük görev tarihi kontrolü
  useEffect(() => {
    if (state.sonGorevTarihi !== bugunTarihi()) {
      dispatch({ type: 'GUNLUK_GOREV_YENILE' });
    }
  }, []);

  return (
    <SafeAreaView style={[styles.guvenliAlan, { backgroundColor: arkaplanRenk }]}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={{ flex: 1, opacity: ekranOpak }}>
        <ScrollView contentContainerStyle={styles.oyunKapsayici}>

          {/* ── Üst bilgi: Seviye & Puan & Altın ── */}
          <View style={styles.ustSatir}>
            <View style={[styles.rozetPil, { backgroundColor: tema.kart, borderColor: tema.border }]}>
              <Text style={[styles.pilMetin, { color: tema.yazi }]}>
                {sv.emoji} {sv.ad} ({metin.seviye}{state.seviye})
              </Text>
            </View>
            <View style={styles.ustSagKume}>
              <Text style={styles.puanMetin}>🏆 {state.puan}</Text>
              <Text style={styles.altinMetin}>💰 {state.altin}</Text>
            </View>
          </View>

          {/* ── Seviye kutlama banner'ı ── */}
          <Animated.View
            style={[styles.kutlamaBanner, { opacity: kutlamaOpak }]}
            pointerEvents="none"
          >
            <Text style={styles.kutlamaMetin}>{kutlamaBanner}</Text>
          </Animated.View>

          {/* ── Karakter + uçan animasyon ── */}
          <View style={styles.petKutusu}>
            <UcanMetin metin={ucanMetin} tetikle={ucanSayac > 0} key={ucanSayac} />
            <Animated.Text
              style={[styles.petEmoji, {
                transform: [
                  { scale: petScale },
                  { translateY: petTransY },
                  { rotate: rotateStr },
                ],
              }]}
            >
              {state.emoji}
            </Animated.Text>
            {aksesuarStr ? <Text style={styles.aksesuarStr}>{aksesuarStr}</Text> : null}
          </View>

          <Text style={[styles.petIsim, { color: tema.yazi }]}>{state.isim}</Text>
          <Text style={[styles.petTip,  { color: tema.yaziSecondary }]}>{state.tip}</Text>

          {/* ── Durum badge ── */}
          <View style={[styles.durumBadge, { backgroundColor: tema.kart, borderColor: tema.border }]}>
            <Text style={[styles.durumMetin, { color: tema.yazi }]}>
              {metin[`d_${durum}` as keyof typeof metin]}
            </Text>
          </View>

          {/* ── Stat barları ── */}
          <View style={[styles.statKutusu, { backgroundColor: tema.kart, borderColor: tema.border }]}>
            <StatBari etiket={metin.aclik}    deger={state.aclik}    tema={tema} />
            <StatBari etiket={metin.mutluluk} deger={state.mutluluk} tema={tema} />
            <StatBari etiket={metin.enerji}   deger={state.enerji}   tema={tema} />
          </View>

          {/* ── Aksiyon butonları ── */}
          <View style={styles.aksiyonIzgara}>
            {([
              { tur: 'besle', renk: '#16a34a' },
              { tur: 'oyna',  renk: '#2563eb' },
              { tur: 'uyut',  renk: '#7c3aed' },
              { tur: 'yika',  renk: '#0891b2' },
            ] as const).map(({ tur, renk }) => (
              <TouchableOpacity
                key={tur}
                style={[styles.aksiyonButon, { backgroundColor: renk }]}
                onPress={() => aksiyonYap(tur)}
                activeOpacity={0.75}
              >
                <Text style={styles.aksiyonButonMetin}>{metin[tur]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Günlük Görevler ── */}
          <View style={[styles.gorevKutusu, { backgroundColor: tema.kart, borderColor: tema.border }]}>
            <Text style={[styles.bolumBaslik, { color: tema.yazi }]}>{metin.gunlukGorevler}</Text>
            {state.gunlukGorevler.map((g) => {
              const oran = Math.min(g.ilerleme / g.tanim.hedef, 1);
              return (
                <View key={g.tanim.id} style={[styles.gorevSatir, { borderColor: tema.border }]}>
                  <View style={styles.gorevUst}>
                    <Text style={[styles.gorevMetin, { color: tema.yazi }]}>
                      {state.dil === 'tr' ? g.tanim.metinTR : g.tanim.metinEN}
                    </Text>
                    <Text style={[styles.gorevOdul, { color: '#fbbf24' }]}>+{g.tanim.odul} 💰</Text>
                  </View>
                  <View style={[styles.gorevBarArk, { backgroundColor: tema.border }]}>
                    <View style={[styles.gorevBarDol, { width: `${oran * 100}%` as any, backgroundColor: g.tamamlandi ? '#22c55e' : '#667eea' }]} />
                  </View>
                  <View style={styles.gorevAlt}>
                    <Text style={[styles.gorevIlerleme, { color: tema.yaziSecondary }]}>
                      {g.tanim.aksiyonTuru === 'puan'
                        ? `${Math.min(g.ilerleme, g.tanim.hedef)}/${g.tanim.hedef}`
                        : `${g.ilerleme}/${g.tanim.hedef}`}
                    </Text>
                    {g.tamamlandi && !g.odalAlindi && (
                      <TouchableOpacity
                        style={styles.odalButon}
                        onPress={() => dispatch({ type: 'GOREV_ODUL_AL', payload: { gorevId: g.tanim.id } })}
                      >
                        <Text style={styles.odalButonMetin}>{metin.oduluAl}</Text>
                      </TouchableOpacity>
                    )}
                    {g.odalAlindi && <Text style={[styles.tamam, { color: '#22c55e' }]}>{metin.tamamlandi}</Text>}
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── Rozetler ── */}
          {state.rozetler.length > 0 && (
            <View style={styles.rozetBolumu}>
              <Text style={[styles.bolumBaslik, { color: tema.yazi }]}>{metin.rozetlerim}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {state.rozetler.map((id) => (
                  <View key={id} style={[styles.rozetKutusu, { backgroundColor: tema.kart, borderColor: '#667eea' }]}>
                    <Text style={[styles.rozetMetin, { color: tema.yazi }]}>{rozetEtiketAl(id, state.dil)}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ANA BİLEŞEN — EKRAN YÖNETİCİSİ                                         ║
// ╚══════════════════════════════════════════════════════════════════════════╝
export default function App() {
  const { state, dispatch } = usePet();
  const [ekran, setEkran] = useState<'olusturma' | 'oyun'>('olusturma');

  // AsyncStorage'dan yüklenen kayıtlı pet varsa direkt oyun ekranına geç
  useEffect(() => {
    if (state.isim) setEkran('oyun');
  }, [state.isim]);

  const karakterOlustur = (isim: string, tip: string, emoji: string) => {
    dispatch({ type: 'KARAKTER_OLUSTUR', payload: { isim, tip, emoji } });
    setEkran('oyun');
  };

  if (ekran === 'oyun' && state.isim) {
    return <AnaOyunEkrani />;
  }
  return <KarakterOlusturmaEkrani onOlustur={karakterOlustur} />;
}

// ─── STİLLER ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  guvenliAlan:      { flex: 1 },

  // ── Ekran 1
  olusturmaKapsayici: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  baslik:             { fontSize: 38, fontWeight: '800', letterSpacing: 1 },
  altBaslik:          { fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 },
  inputKutusu:        { width: '100%', gap: 8 },
  inputEtiket:        { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  input:              { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, width: '100%' },
  slotKutusu:         { width: '100%', borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', minHeight: 140, paddingVertical: 16 },
  slotEmoji:          { fontSize: 80, lineHeight: 96 },
  slotTipAd:          { fontSize: 18, fontWeight: '700', marginTop: 4 },
  slotBosMetin:       { fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  rastgeleButon:      { width: '100%', backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14, alignItems: 'center', elevation: 6 },
  devreDisi:          { opacity: 0.5 },
  olusturButon:       { width: '100%', backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 14, alignItems: 'center', elevation: 6 },
  butonMetin:         { color: '#fff', fontWeight: '700', fontSize: 16 },
  altBilgi:           { fontSize: 12, textAlign: 'center' },

  // ── Ekran 2
  oyunKapsayici:      { flexGrow: 1, alignItems: 'center', padding: 20, gap: 14, paddingBottom: 32 },
  ustSatir:           { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  rozetPil:           { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1 },
  pilMetin:           { fontWeight: '700', fontSize: 13 },
  ustSagKume:         { flexDirection: 'row', gap: 12 },
  puanMetin:          { color: '#ef4444', fontWeight: '800', fontSize: 14 },
  altinMetin:         { color: '#fbbf24', fontWeight: '800', fontSize: 14 },
  kutlamaBanner:      { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: '#667eea', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, zIndex: 50 },
  kutlamaMetin:       { color: '#fff', fontWeight: '800', fontSize: 16 },
  petKutusu:          { position: 'relative', alignItems: 'center' },
  petEmoji:           { fontSize: 80 },
  aksesuarStr:        { fontSize: 28, marginTop: -8 },
  petIsim:            { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  petTip:             { fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  durumBadge:         { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6, borderWidth: 1 },
  durumMetin:         { fontWeight: '600', fontSize: 14 },
  statKutusu:         { width: '100%', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1 },
  aksiyonIzgara:      { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  aksiyonButon:       { width: '46%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', elevation: 6 },
  aksiyonButonMetin:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  gorevKutusu:        { width: '100%', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1 },
  bolumBaslik:        { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  gorevSatir:         { gap: 6, paddingBottom: 10, borderBottomWidth: 1 },
  gorevUst:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gorevMetin:         { fontSize: 13, flex: 1 },
  gorevOdul:          { fontSize: 12, fontWeight: '700' },
  gorevBarArk:        { height: 6, borderRadius: 99, overflow: 'hidden' },
  gorevBarDol:        { height: '100%', borderRadius: 99 },
  gorevAlt:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gorevIlerleme:      { fontSize: 12 },
  odalButon:          { backgroundColor: '#22c55e', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  odalButonMetin:     { color: '#fff', fontWeight: '700', fontSize: 12 },
  tamam:              { fontSize: 13, fontWeight: '700' },
  rozetBolumu:        { width: '100%', gap: 8 },
  rozetKutusu:        { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1 },
  rozetMetin:         { fontSize: 13, fontWeight: '600' },
});

/*
 * ─── YAPILAN DEĞİŞİKLİKLER ───────────────────────────────────────────────────
 *
 * 1. CONTEXT ENTEGRASYONU: usePet() hook'u ile tüm state ve dispatch PetContext'ten alınır.
 *    Local useState kullanımı minimize edildi; kalıcı veriler context üzerinden yönetilir.
 *
 * 2. DELTA TABLOSU: DELTA nesnesi her aksiyonun değişikliklerini tanımlar.
 *    Hem puan hem altını barındırır; fonksiyon basit bir lookup yapar.
 *
 * 3. AKSİYON ANİMASYONLARI:
 *    - Besle: petTransY ile yatay sallama (shake)
 *    - Oyna: petTransY ile zıplama + spring bounce
 *    - Uyut: petScale ile küçülüp büyüme (pulse)
 *    - Yıka: petRotate ile 360° dönme
 *    Tümü useNativeDriver: true → JS thread bloke edilmez.
 *
 * 4. UÇAN METİN: Kendi Animated bileşeni (UcanMetin). Aksiyonda key sayacı
 *    artırılarak re-mount tetiklenir → çok hızlı tıklamada bile her tetikleme ayrı anim.
 *
 * 5. ANİMASYONLU STAT BARI: StatBari, deger prop'u değiştiğinde Animated.timing ile
 *    bar genişliğini smooth interpoler.
 *
 * 6. SEVIYE KUTLAMA: Banner Animated fade-in/out, ekran opasite parlaması.
 *
 * 7. GÜNLÜK GÖREVLER: Progress bar, "Ödülü Al" butonu, tamamlandı işareti.
 *    Gün değişimi kontrolü useEffect'te yapılır.
 *
 * 8. ROZETLER: rozetEtiketAl() dil parametresiyle çağrılır → TR/EN otomatik.
 *
 * 9. AKSESUARLAR: state.aksesuarlar dizisindeki id'ler emoji'ye çevrilip
 *    karakter altında gösterilir.
 *
 * 10. DURUM + ARKA PLAN RENGİ: DURUM_ARKAPLAN sabitinden light/dark moda göre alınır.
 */