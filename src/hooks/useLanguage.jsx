import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext(null);

const TRANSLATIONS = {
  en: {
    // Navbar
    navPlay: 'Play',
    navHome: 'Home',
    navSearch: 'Search',
    navRank: 'Leaderboard',
    navFriends: 'Friends',
    navStore: 'Store',
    navPost: 'Post',
    navSaved: 'Saved Songs',
    navProfile: 'Profile',
    navLogin: 'Login',
    navLogout: 'Logout',
    navNotifications: 'Notifications',

    // Dashboard
    dashHello: 'Hello',
    dashSubtitle: 'Choose a mode and category to test how fast your ears are!',
    dashStep1: '1. Choose Game Mode',
    dashSoloTitle: 'Solo Mode',
    dashSoloDesc: 'Play solo and set a high score',
    dashMultiTitle: 'Multiplayer',
    dashMultiDesc: 'Play together with friends via room',
    dashMultiAction: 'Choose Multiplayer Action',
    dashCreateRoom: 'Create Room',
    dashCreateRoomDesc: 'Host a room & invite friends',
    dashJoinRoom: 'Join Room',
    dashJoinRoomDesc: 'Join using a room code',
    dashEnterCode: 'Enter Room Code:',
    dashCodePlaceholder: 'Enter 6-digit code (e.g. SPOT42)',
    dashStep2: '2. Choose Music Category',
    dashPickCategory: 'Choose Music Category',
    dashPickCategoryDesc: 'Click to browse music categories...',
    dashStep3: '3. Number of Songs (Rounds)',
    dashPlaySolo: 'Play Now',
    dashPreparing: 'Preparing Game...',
    dashCreateRoomBtn: 'Create Multiplayer Room',
    dashCreatingRoom: 'Creating Room...',

    // Game & Settings
    gameAttempts: 'Attempts',
    gameGuessBtn: 'Guess Song Title',
    gameSkipBtn: 'Skip This Song (Score: 0)',
    gameSettingsTitle: 'Game Settings',
    gameVolume: 'Music Volume',
    gameQuitBtn: 'Quit Game',
    gameQuitConfirm: 'Are you sure you want to quit? Current round progress will not be saved.',
    gameCancel: 'Cancel',
    gameYesQuit: 'Yes, Quit'
  },
  id: {
    // Navbar
    navPlay: 'Main',
    navHome: 'Home',
    navSearch: 'Cari',
    navRank: 'Leaderboard',
    navFriends: 'Friends',
    navStore: 'Store',
    navPost: 'Post',
    navSaved: 'Lagu Tersimpan',
    navProfile: 'Profil',
    navLogin: 'Login',
    navLogout: 'Keluar',
    navNotifications: 'Notifikasi',

    // Dashboard
    dashHello: 'Halo',
    dashSubtitle: 'Pilih mode dan kategori buat uji seberapa peka telinga lo!',
    dashStep1: '1. Pilih Mode Game',
    dashSoloTitle: 'Solo Mode',
    dashSoloDesc: 'Main sendiri, cetak skor tinggi',
    dashMultiTitle: 'Multiplayer',
    dashMultiDesc: 'Mabar bareng teman via room',
    dashMultiAction: 'Pilih Aksi Multiplayer',
    dashCreateRoom: 'Buat Room',
    dashCreateRoomDesc: 'Jadi host & undang teman',
    dashJoinRoom: 'Join Room',
    dashJoinRoomDesc: 'Gabung pakai kode room',
    dashEnterCode: 'Masukkan Kode Room:',
    dashCodePlaceholder: 'Masukkan 6 digit kode (e.g. SPOT42)',
    dashStep2: '2. Pilih Kategori Musik',
    dashPickCategory: 'Pilih Kategori Musik',
    dashPickCategoryDesc: 'Klik untuk memilih kategori lagu...',
    dashStep3: '3. Jumlah Lagu (Rounds)',
    dashPlaySolo: 'Ayo Main',
    dashPreparing: 'Menyiapkan Game...',
    dashCreateRoomBtn: 'Buat Room Multiplayer',
    dashCreatingRoom: 'Membuat Room...',

    // Game & Settings
    gameAttempts: 'Kesempatan',
    gameGuessBtn: 'Tebak Judul Lagu',
    gameSkipBtn: 'Skip Lagu Ini (Skor: 0)',
    gameSettingsTitle: 'Pengaturan Game',
    gameVolume: 'Volume Musik',
    gameQuitBtn: 'Keluar dari Game (Quit)',
    gameQuitConfirm: 'Yakin ingin keluar? Progres ronde saat ini tidak akan disimpan.',
    gameCancel: 'Batal',
    gameYesQuit: 'Ya, Keluar'
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('spotinize_lang');
      return saved === 'id' || saved === 'en' ? saved : 'en';
    } catch (e) {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('spotinize_lang', lang);
    } catch (e) {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          lang === 'id'
            ? 'Spotinize adalah game tebak lagu real-time. Uji seberapa cepat kamu mengenali lagu lewat Progressive Reveal System!'
            : 'Spotinize is a real-time music guessing game. Test how fast you recognize songs with our Progressive Reveal System!'
        );
      }
    }
  }, [lang]);

  const setLang = useCallback((nextLang) => {
    if (nextLang === 'en' || nextLang === 'id') {
      setLangState(nextLang);
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'en' ? 'id' : 'en'));
  }, []);

  const t = useCallback((key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
  }, [lang]);

  const tx = useCallback((enText, idText) => {
    return lang === 'id' ? idText : enText;
  }, [lang]);

  const tCategory = useCallback((category) => {
    if (!category) return '';
    if (category === 'Era & Tahun') return lang === 'id' ? 'Era & Tahun' : 'Era & Year';
    if (category === 'Genre') return 'Genre Hits';
    if (category === 'Artist') return 'Artist Mode';
    return category;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, tx, tCategory }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}

export default useLanguage;
