/**
 * PetContext.tsx — Oyunun tüm global state'ini yönetir.
 * AsyncStorage kalıcılığı, tema sistemi, dil desteği,
 * pet verisi ve mağaza işlemleri burada merkezileştirilmiştir.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── STORAGE ANAHTARLARI ──────────────────────────────────────────────────────
export const STORAGE_KAYIT_KEY      = 'digiPetKayit';
export const STORAGE_ONBOARDING_KEY = 'onboardingTamamlandi';

// ─── SABİT OYUN DEĞERLERİ ────────────────────────────────────────────────────
export const MAX_STAT = 10;
export const MIN_STAT = 0;
export const BASLANGIC_ALTIN = 100;

// ─── PET TİPLERİ ─────────────────────────────────────────────────────────────
export interface PetTip {
  tip: string;
  emoji: string;
}

export const PET_TIPLERI: PetTip[] = [
  { tip: 'Kedi',       emoji: '🐱' },
  { tip: 'Köpek',      emoji: '🐶' },
  { tip: 'Tavşan',     emoji: '🐰' },
  { tip: 'Ejderha',    emoji: '🐲' },
  { tip: 'Robot',      emoji: '🤖' },
  { tip: 'Panda',      emoji: '🐼' },
  { tip: 'Tilki',      emoji: '🦊' },
  { tip: 'Uzaylı',     emoji: '👾' },
  { tip: 'Aslan',      emoji: '🦁' },
  { tip: 'Kurt',       emoji: '🐺' },
  { tip: 'Dinozor',    emoji: '🦕' },
  { tip: 'Anka Kuşu',  emoji: '🦅' },
  { tip: 'Unicorn',    emoji: '🦄' },
  { tip: 'Timsah',     emoji: '🐊' },
  { tip: 'Penguen',    emoji: '🐧' },
];

// ─── SEVİYE SİSTEMİ ──────────────────────────────────────────────────────────
export interface SeviyeTanim {
  minPuan: number;
  ad: string;
  emoji: string;
  numara: number;
}

export const SEVIYELER: SeviyeTanim[] = [
  { minPuan: 0,    ad: 'Yumurta', emoji: '🥚', numara: 1 },
  { minPuan: 101,  ad: 'Yavru',   emoji: '🐣', numara: 2 },
  { minPuan: 301,  ad: 'Genç',    emoji: '⭐', numara: 3 },
  { minPuan: 601,  ad: 'Güçlü',   emoji: '💪', numara: 4 },
  { minPuan: 1001, ad: 'Efsane',  emoji: '👑', numara: 5 },
];

// ─── ROZET SİSTEMİ ───────────────────────────────────────────────────────────
export interface RozetTanim {
  id: string;
  etiket: string;
  etiketEN: string;
  kontrol: (s: PetState) => boolean;
}

export const ROZETLER: RozetTanim[] = [
  { id: 'ilk_adim',    etiket: 'İlk Adım 🌱',   etiketEN: 'First Step 🌱',    kontrol: (s) => s.puan > 0             },
  { id: 'tok_karin',   etiket: 'Tok Karın 🍽️',  etiketEN: 'Full Belly 🍽️',   kontrol: (s) => s.aclik >= MAX_STAT    },
  { id: 'mutlu_ruh',   etiket: 'Mutlu Ruh 😄',   etiketEN: 'Happy Soul 😄',    kontrol: (s) => s.mutluluk >= MAX_STAT },
  { id: 'enerjik',     etiket: 'Enerjik ⚡',      etiketEN: 'Energetic ⚡',     kontrol: (s) => s.enerji >= MAX_STAT   },
  { id: 'zengin',      etiket: 'Zengin 💰',       etiketEN: 'Rich 💰',          kontrol: (s) => s.altin >= 500         },
  { id: 'puan_avcisi', etiket: 'Puan Avcısı 🎯', etiketEN: 'Score Hunter 🎯',  kontrol: (s) => s.puan >= 500          },
  { id: 'efsane',      etiket: 'Efsane 👑',       etiketEN: 'Legend 👑',        kontrol: (s) => s.seviye >= 5          },
];

// ─── MAĞAZA İTEMLERİ ─────────────────────────────────────────────────────────
export interface MagazaItem {
  id: string;
  adTR: string;
  adEN: string;
  emoji: string;
  fiyat: number;
  etki: Partial<Pick<PetState, 'aclik' | 'mutluluk' | 'enerji'>>;
  aksesuar: boolean; // görsel aksesuar mı?
}

export const MAGAZA_ITEMLERI: MagazaItem[] = [
  { id: 'mama',    adTR: 'Özel Mama',  adEN: 'Premium Food', emoji: '🥩', fiyat: 30,  etki: { aclik:    5 }, aksesuar: false },
  { id: 'oyuncak', adTR: 'Oyuncak',    adEN: 'Toy',          emoji: '🎾', fiyat: 40,  etki: { mutluluk: 5 }, aksesuar: false },
  { id: 'vitamin', adTR: 'Vitamin',    adEN: 'Vitamin',      emoji: '💊', fiyat: 25,  etki: { enerji:   5 }, aksesuar: false },
  { id: 'sapka',   adTR: 'Şapka',      adEN: 'Hat',          emoji: '🎩', fiyat: 80,  etki: {}, aksesuar: true  },
  { id: 'gozluk',  adTR: 'Gözlük',     adEN: 'Glasses',      emoji: '🕶️', fiyat: 80,  etki: {}, aksesuar: true  },
  { id: 'pelerin', adTR: 'Pelerin',    adEN: 'Cape',         emoji: '🦸', fiyat: 100, etki: {}, aksesuar: true  },
];

// ─── GÜNLÜK GÖREVLER ─────────────────────────────────────────────────────────
export interface GorevTanim {
  id: string;
  metinTR: string;
  metinEN: string;
  hedef: number;
  odul: number;          // altın ödülü
  aksiyonTuru: 'besle' | 'oyna' | 'uyut' | 'yika' | 'puan';
}

export const GOREV_TANIMLARI: GorevTanim[] = [
  { id: 'g_besle',  metinTR: 'Bugün 3 kez besle 🍖',  metinEN: 'Feed 3 times today 🍖',   hedef: 3,   odul: 50, aksiyonTuru: 'besle' },
  { id: 'g_oyna',   metinTR: 'Bugün 3 kez oyna 🎮',   metinEN: 'Play 3 times today 🎮',    hedef: 3,   odul: 60, aksiyonTuru: 'oyna'  },
  { id: 'g_uyut',   metinTR: 'Bugün 2 kez uyut 😴',   metinEN: 'Sleep 2 times today 😴',   hedef: 2,   odul: 40, aksiyonTuru: 'uyut'  },
  { id: 'g_yika',   metinTR: 'Bugün 2 kez yıka 🛁',   metinEN: 'Wash 2 times today 🛁',    hedef: 2,   odul: 45, aksiyonTuru: 'yika'  },
  { id: 'g_puan',   metinTR: '100 puan kazan 🎯',      metinEN: 'Earn 100 points 🎯',       hedef: 100, odul: 80, aksiyonTuru: 'puan'  },
];

export interface AktifGorev {
  tanim: GorevTanim;
  ilerleme: number;
  tamamlandi: boolean;
  odalAlindi: boolean;
}

// ─── TEMA SİSTEMİ ────────────────────────────────────────────────────────────
export interface Tema {
  arkaplan: string;
  kart: string;
  yazi: string;
  yaziSecondary: string;
  border: string;
  tabBar: string;
  tabBarBorder: string;
  input: string;
}

export const TEMA: Record<'light' | 'dark', Tema> = {
  light: {
    arkaplan:      '#f8fafc',
    kart:          '#ffffff',
    yazi:          '#1e293b',
    yaziSecondary: '#64748b',
    border:        '#e2e8f0',
    tabBar:        '#ffffff',
    tabBarBorder:  '#e2e8f0',
    input:         '#f1f5f9',
  },
  dark: {
    arkaplan:      '#0f172a',
    kart:          '#1e293b',
    yazi:          '#f1f5f9',
    yaziSecondary: '#94a3b8',
    border:        '#334155',
    tabBar:        '#1e293b',
    tabBarBorder:  '#334155',
    input:         '#0f172a',
  },
};

// ─── DİL METINLERI ───────────────────────────────────────────────────────────
type Dil = 'tr' | 'en';

export interface MetinSeti {
  // Genel
  anaOyun: string;
  magaza: string;
  ayarlar: string;
  // Onboarding
  ob_s1_baslik: string;
  ob_s1_aciklama: string;
  ob_s2_baslik: string;
  ob_s2_aciklama: string;
  ob_s3_baslik: string;
  ob_s3_aciklama: string;
  hadiBaslayalim: string;
  // Karakter Oluşturma
  isimEtiketi: string;
  isimPlaceholder: string;
  tipUret: string;
  doniyor: string;
  begenmedim: string;
  hayvanOlustur: string;
  isimBos: string;
  tipBos: string;
  // Oyun
  besle: string;
  oyna: string;
  uyut: string;
  yika: string;
  aclik: string;
  mutluluk: string;
  enerji: string;
  puan: string;
  altin: string;
  seviye: string;
  rozetlerim: string;
  gunlukGorevler: string;
  oduluAl: string;
  tamamlandi: string;
  // Durum metinleri
  d_harika: string;
  d_ac: string;
  d_uzgun: string;
  d_yorgun: string;
  d_normal: string;
  // Seviye kutlaması
  seviyeAtladi: string;
  // Mağaza
  yeterliAltinYok: string;
  satin: string;
  aksesuarlar: string;
  // Ayarlar
  karanlikMod: string;
  dil: string;
  versiyon: string;
  veriSifirla: string;
  sifirlaOnay: string;
  sifirlaOnayMesaj: string;
  evet: string;
  iptal: string;
  gelistirici: string;
  // Rozet
  rozetKazandin: string;
}

export const METINLER: Record<Dil, MetinSeti> = {
  tr: {
    anaOyun: 'Ana Oyun',
    magaza: 'Mağaza',
    ayarlar: 'Ayarlar',
    ob_s1_baslik: 'DigiPet\'e Hoş Geldin! 🐾',
    ob_s1_aciklama: 'Dijital evcil hayvanına sahip ol, besle, büyüt ve eğlen!',
    ob_s2_baslik: 'Evcil Hayvanını Oluştur 🎰',
    ob_s2_aciklama: 'Slot makinesiyle 15 farklı tip arasından rastgele seç. Beğenmezsen tekrarla!',
    ob_s3_baslik: 'Besle, Oyna, Büyüt! 🏆',
    ob_s3_aciklama: 'Görevleri tamamla, rozet kazan, mağazadan item al ve efsane ol!',
    hadiBaslayalim: 'Hadi Başlayalım! 🚀',
    isimEtiketi: 'Evcil Hayvanının Adı',
    isimPlaceholder: 'örn. Pamuk, Şimşek, Nova...',
    tipUret: '🎲 Tip Üret',
    doniyor: '🎰 Dönüyor...',
    begenmedim: '🔄 Beğenmedim',
    hayvanOlustur: '🐾 Hayvanımı Oluştur',
    isimBos: 'Lütfen evcil hayvanına bir isim ver!',
    tipBos: 'Lütfen önce tip üret!',
    besle: '🍖 Besle',
    oyna: '🎮 Oyna',
    uyut: '😴 Uyut',
    yika: '🛁 Yıka',
    aclik: '🍖 Açlık',
    mutluluk: '😊 Mutluluk',
    enerji: '⚡ Enerji',
    puan: 'puan',
    altin: 'altın',
    seviye: 'Sv.',
    rozetlerim: '🏅 Rozetlerim',
    gunlukGorevler: '📋 Günlük Görevler',
    oduluAl: 'Ödülü Al ✨',
    tamamlandi: '✅ Tamamlandı',
    d_harika: 'Harikayım! 🤩',
    d_ac: 'Çok Açım! 😫',
    d_uzgun: 'Üzgünüm... 😢',
    d_yorgun: 'Çok Yorgunum 😴',
    d_normal: 'İyiyim 😊',
    seviyeAtladi: '🎉 Seviye Atladın!',
    yeterliAltinYok: 'Yetersiz Altın',
    satin: 'Satın Al',
    aksesuarlar: 'Aksesuarlar',
    karanlikMod: 'Karanlık Mod',
    dil: 'Dil',
    versiyon: 'Versiyon',
    veriSifirla: 'Veriyi Sıfırla',
    sifirlaOnay: 'Emin misin?',
    sifirlaOnayMesaj: 'Tüm oyun verisi silinecek. Bu işlem geri alınamaz!',
    evet: 'Evet, Sıfırla',
    iptal: 'İptal',
    gelistirici: 'Geliştirici',
    rozetKazandin: '🏆 Rozet Kazandın!',
  },
  en: {
    anaOyun: 'Home',
    magaza: 'Shop',
    ayarlar: 'Settings',
    ob_s1_baslik: 'Welcome to DigiPet! 🐾',
    ob_s1_aciklama: 'Own a digital pet, feed it, grow it and have fun!',
    ob_s2_baslik: 'Create Your Pet 🎰',
    ob_s2_aciklama: 'Use the slot machine to randomly pick from 15 types. Not happy? Spin again!',
    ob_s3_baslik: 'Feed, Play, Grow! 🏆',
    ob_s3_aciklama: 'Complete daily quests, earn badges, buy items from the shop and become a legend!',
    hadiBaslayalim: "Let's Go! 🚀",
    isimEtiketi: "Your Pet's Name",
    isimPlaceholder: 'e.g. Cotton, Thunder, Nova...',
    tipUret: '🎲 Spin Type',
    doniyor: '🎰 Spinning...',
    begenmedim: '🔄 Respin',
    hayvanOlustur: '🐾 Create My Pet',
    isimBos: 'Please give your pet a name!',
    tipBos: 'Please spin a type first!',
    besle: '🍖 Feed',
    oyna: '🎮 Play',
    uyut: '😴 Sleep',
    yika: '🛁 Wash',
    aclik: '🍖 Hunger',
    mutluluk: '😊 Happiness',
    enerji: '⚡ Energy',
    puan: 'pts',
    altin: 'gold',
    seviye: 'Lv.',
    rozetlerim: '🏅 My Badges',
    gunlukGorevler: '📋 Daily Quests',
    oduluAl: 'Claim ✨',
    tamamlandi: '✅ Done',
    d_harika: "I'm Amazing! 🤩",
    d_ac: "I'm Starving! 😫",
    d_uzgun: "I'm Sad... 😢",
    d_yorgun: "I'm Exhausted 😴",
    d_normal: "I'm Fine 😊",
    seviyeAtladi: '🎉 Level Up!',
    yeterliAltinYok: 'Not Enough Gold',
    satin: 'Buy',
    aksesuarlar: 'Accessories',
    karanlikMod: 'Dark Mode',
    dil: 'Language',
    versiyon: 'Version',
    veriSifirla: 'Reset Data',
    sifirlaOnay: 'Are you sure?',
    sifirlaOnayMesaj: 'All game data will be deleted. This cannot be undone!',
    evet: 'Yes, Reset',
    iptal: 'Cancel',
    gelistirici: 'Developer',
    rozetKazandin: '🏆 Badge Earned!',
  },
};

// ─── DURUM SİSTEMİ ───────────────────────────────────────────────────────────
export type DurumTuru = 'harika' | 'ac' | 'uzgun' | 'yorgun' | 'normal';

export const DURUM_ARKAPLAN: Record<DurumTuru, { light: string; dark: string }> = {
  harika: { light: '#e8f5e9', dark: '#0d2b18' },
  ac:     { light: '#fff3e0', dark: '#2b1a00' },
  uzgun:  { light: '#e3f2fd', dark: '#0a1f2b' },
  yorgun: { light: '#f3e5f5', dark: '#1a0d2b' },
  normal: { light: '#f8fafc', dark: '#0f172a' },
};

// ─── GLOBAL STATE TİPİ ───────────────────────────────────────────────────────
export interface PetState {
  // Karakter bilgisi (null → henüz oluşturulmadı)
  isim: string | null;
  tip: string | null;
  emoji: string | null;
  // Oyun istatistikleri
  aclik: number;
  mutluluk: number;
  enerji: number;
  puan: number;
  altin: number;
  seviye: number;
  rozetler: string[];
  aksesuarlar: string[];
  // Günlük görevler
  gunlukGorevler: AktifGorev[];
  sonGorevTarihi: string | null; // ISO tarih string'i
  // Ayarlar
  dil: Dil;
  karanlikMod: boolean;
}

// ─── ACTION TİPLERİ ──────────────────────────────────────────────────────────
export type PetAction =
  | { type: 'KARAKTER_OLUSTUR'; payload: { isim: string; tip: string; emoji: string } }
  | { type: 'AKSIYON_YAP'; payload: { aclik?: number; mutluluk?: number; enerji?: number; puan: number; altin: number; tur: GorevTanim['aksiyonTuru'] } }
  | { type: 'MAGAZA_SATIN'; payload: { item: MagazaItem } }
  | { type: 'GOREV_ODUL_AL'; payload: { gorevId: string } }
  | { type: 'GUNLUK_GOREV_YENILE' }
  | { type: 'DIL_DEGISTIR'; payload: Dil }
  | { type: 'KARANLIK_MOD_TOGGL' }
  | { type: 'YUKLE'; payload: Partial<PetState> }
  | { type: 'SIFIRLA' };

// ─── BAŞLANGIÇ STATE ─────────────────────────────────────────────────────────
const baslangicState: PetState = {
  isim:            null,
  tip:             null,
  emoji:           null,
  aclik:           5,
  mutluluk:        5,
  enerji:          8,
  puan:            0,
  altin:           BASLANGIC_ALTIN,
  seviye:          1,
  rozetler:        [],
  aksesuarlar:     [],
  gunlukGorevler:  [],
  sonGorevTarihi:  null,
  dil:             'tr',
  karanlikMod:     false,
};

// ─── YARDIMCI FONKSİYONLAR ───────────────────────────────────────────────────

/** Değeri sınırlar içinde tutar */
export const sinirla = (v: number, min = MIN_STAT, max = MAX_STAT): number =>
  Math.min(max, Math.max(min, v));

/** Puana göre seviye numarasını döndürür */
export const seviyelHesapla = (puan: number): number =>
  [...SEVIYELER].reverse().find((s) => puan >= s.minPuan)?.numara ?? 1;

/** Seviye numarasından SeviyeTanim döndürür */
export const seviyeBilgisi = (n: number): SeviyeTanim =>
  SEVIYELER.find((s) => s.numara === n) ?? SEVIYELER[0];

/** Yeni kazanılacak rozet id listesini döndürür */
export const yeniRozetleriHesapla = (mevcut: string[], state: PetState): string[] =>
  ROZETLER.filter((r) => !mevcut.includes(r.id) && r.kontrol(state)).map((r) => r.id);

/** Rozet id → etiket (dile göre) */
export const rozetEtiketAl = (id: string, dil: Dil): string => {
  const r = ROZETLER.find((x) => x.id === id);
  return r ? (dil === 'tr' ? r.etiket : r.etiketEN) : id;
};

/** Bugünün tarih string'ini döndürür (YYYY-MM-DD) */
export const bugunTarihi = (): string =>
  new Date().toISOString().slice(0, 10);

/** 3 rastgele görev seçer (tüm GOREV_TANIMLARI'ndan) */
export const rastgeleGorevlerUret = (): AktifGorev[] => {
  const karisik = [...GOREV_TANIMLARI].sort(() => Math.random() - 0.5);
  return karisik.slice(0, 3).map((t) => ({
    tanim:       t,
    ilerleme:    0,
    tamamlandi:  false,
    odalAlindi:  false,
  }));
};

// ─── REDUCER ─────────────────────────────────────────────────────────────────
function petReducer(state: PetState, action: PetAction): PetState {
  switch (action.type) {

    case 'KARAKTER_OLUSTUR': {
      return {
        ...state,
        isim:  action.payload.isim,
        tip:   action.payload.tip,
        emoji: action.payload.emoji,
        gunlukGorevler: rastgeleGorevlerUret(),
        sonGorevTarihi: bugunTarihi(),
      };
    }

    case 'AKSIYON_YAP': {
      const { aclik, mutluluk, enerji, puan, altin, tur } = action.payload;
      const yeniAclik    = aclik    !== undefined ? sinirla(state.aclik    + aclik)    : state.aclik;
      const yeniMutluluk = mutluluk !== undefined ? sinirla(state.mutluluk + mutluluk) : state.mutluluk;
      const yeniEnerji   = enerji   !== undefined ? sinirla(state.enerji   + enerji)   : state.enerji;
      const yeniPuan     = state.puan + puan;
      const yeniAltin    = sinirla(state.altin + altin, 0, 999999);
      const yeniSeviye   = seviyelHesapla(yeniPuan);

      // Görev ilerlemesini güncelle
      const yeniGorevler = state.gunlukGorevler.map((g) => {
        if (g.tamamlandi) return g;
        const hedefMi =
          (g.tanim.aksiyonTuru === tur) ||
          (g.tanim.aksiyonTuru === 'puan' && yeniPuan >= g.tanim.hedef);
        if (!hedefMi) return g;
        const yeniIlerleme = g.tanim.aksiyonTuru === 'puan'
          ? yeniPuan
          : g.ilerleme + 1;
        const tamamlandi = yeniIlerleme >= g.tanim.hedef;
        return { ...g, ilerleme: yeniIlerleme, tamamlandi };
      });

      const araState: PetState = {
        ...state,
        aclik: yeniAclik, mutluluk: yeniMutluluk, enerji: yeniEnerji,
        puan: yeniPuan, altin: yeniAltin, seviye: yeniSeviye,
        gunlukGorevler: yeniGorevler,
      };

      // Rozet kontrolü
      const kazanilanlar = yeniRozetleriHesapla(state.rozetler, araState);
      return { ...araState, rozetler: [...state.rozetler, ...kazanilanlar] };
    }

    case 'MAGAZA_SATIN': {
      const { item } = action.payload;
      if (state.altin < item.fiyat) return state;
      const yeniAksesuarlar = item.aksesuar && !state.aksesuarlar.includes(item.id)
        ? [...state.aksesuarlar, item.id]
        : state.aksesuarlar;
      const yeniAclik    = item.etki.aclik    ? sinirla(state.aclik    + item.etki.aclik)    : state.aclik;
      const yeniMutluluk = item.etki.mutluluk ? sinirla(state.mutluluk + item.etki.mutluluk) : state.mutluluk;
      const yeniEnerji   = item.etki.enerji   ? sinirla(state.enerji   + item.etki.enerji)   : state.enerji;
      const araState: PetState = {
        ...state,
        altin:       sinirla(state.altin - item.fiyat, 0, 999999),
        aksesuarlar: yeniAksesuarlar,
        aclik:       yeniAclik,
        mutluluk:    yeniMutluluk,
        enerji:      yeniEnerji,
      };
      const kazanilanlar = yeniRozetleriHesapla(state.rozetler, araState);
      return { ...araState, rozetler: [...state.rozetler, ...kazanilanlar] };
    }

    case 'GOREV_ODUL_AL': {
      const { gorevId } = action.payload;
      let odul = 0;
      const yeniGorevler = state.gunlukGorevler.map((g) => {
        if (g.tanim.id === gorevId && g.tamamlandi && !g.odalAlindi) {
          odul = g.tanim.odul;
          return { ...g, odalAlindi: true };
        }
        return g;
      });
      return {
        ...state,
        gunlukGorevler: yeniGorevler,
        altin: sinirla(state.altin + odul, 0, 999999),
      };
    }

    case 'GUNLUK_GOREV_YENILE': {
      return {
        ...state,
        gunlukGorevler: rastgeleGorevlerUret(),
        sonGorevTarihi: bugunTarihi(),
      };
    }

    case 'DIL_DEGISTIR':
      return { ...state, dil: action.payload };

    case 'KARANLIK_MOD_TOGGL':
      return { ...state, karanlikMod: !state.karanlikMod };

    case 'YUKLE':
      return { ...baslangicState, ...action.payload };

    case 'SIFIRLA':
      return { ...baslangicState };

    default:
      return state;
  }
}

// ─── CONTEXT TANIMI ──────────────────────────────────────────────────────────
interface PetContextDeger {
  state: PetState;
  dispatch: React.Dispatch<PetAction>;
  tema: Tema;
  metin: MetinSeti;
  kaydet: () => Promise<void>;
  sifirla: () => Promise<void>;
}

const PetContext = createContext<PetContextDeger | null>(null);

// ─── PROVIDER ────────────────────────────────────────────────────────────────
export function PetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(petReducer, baslangicState);

  const tema  = TEMA[state.karanlikMod ? 'dark' : 'light'];
  const metin = METINLER[state.dil];

  /** AsyncStorage'dan veri yükler — uygulama ilk açılışında çağrılır */
  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KAYIT_KEY);
        if (!json) return;
        const yuklenen: Partial<PetState> = JSON.parse(json);

        // Gün değişmişse görevleri yenile
        if (yuklenen.sonGorevTarihi !== bugunTarihi()) {
          yuklenen.gunlukGorevler = rastgeleGorevlerUret();
          yuklenen.sonGorevTarihi = bugunTarihi();
        }

        dispatch({ type: 'YUKLE', payload: yuklenen });
      } catch (_) {
        // Hatalı kayıt → varsayılan state ile devam
      }
    })();
  }, []);

  /** State'i AsyncStorage'a yazar */
  const kaydet = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KAYIT_KEY, JSON.stringify(state));
    } catch (_) {}
  }, [state]);

  /** Tüm veriyi siler, state'i sıfırlar */
  const sifirla = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_KAYIT_KEY, STORAGE_ONBOARDING_KEY]);
    dispatch({ type: 'SIFIRLA' });
  }, []);

  // Her state değişiminde otomatik kaydet
  useEffect(() => { kaydet(); }, [state]);

  return (
    <PetContext.Provider value={{ state, dispatch, tema, metin, kaydet, sifirla }}>
      {children}
    </PetContext.Provider>
  );
}

// ─── HOOK ────────────────────────────────────────────────────────────────────
export function usePet(): PetContextDeger {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error('usePet(), PetProvider dışında kullanılamaz');
  return ctx;
}
