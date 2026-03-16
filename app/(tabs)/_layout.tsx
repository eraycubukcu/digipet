/**
 * app/(tabs)/_layout.tsx — Tab bar yapılandırması.
 * 3 sekme: Ana Oyun 🐾 / Mağaza 🛒 / Ayarlar ⚙️
 * Dil ve karanlık mod context'ten alınır.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { usePet } from '../../context/PetContext';

export default function TabLayout() {
  const { tema, metin } = usePet();

  return (
    <Tabs
      screenOptions={{
        headerShown:          false,
        tabBarActiveTintColor:   '#667eea',
        tabBarInactiveTintColor: tema.yaziSecondary,
        tabBarStyle: {
          backgroundColor: tema.tabBar,
          borderTopColor:  tema.tabBarBorder,
          borderTopWidth:  1,
        },
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
        },
      }}
    >
      {/* Sekme 1 — Ana Oyun */}
      <Tabs.Screen
        name="index"
        options={{
          title:        metin.anaOyun,
          tabBarIcon:   ({ color }) => (
            <TabIcon emoji="🐾" color={color} />
          ),
        }}
      />

      {/* Sekme 2 — Mağaza */}
      <Tabs.Screen
        name="explore"
        options={{
          title:        metin.magaza,
          tabBarIcon:   ({ color }) => (
            <TabIcon emoji="🛒" color={color} />
          ),
        }}
      />

      {/* Sekme 3 — Ayarlar */}
      <Tabs.Screen
        name="settings"
        options={{
          title:        metin.ayarlar,
          tabBarIcon:   ({ color }) => (
            <TabIcon emoji="⚙️" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

/** Emoji tabanlı sekme ikonu */
import { Text } from 'react-native';
const TabIcon = ({ emoji, color: _color }: { emoji: string; color: string }) => (
  <Text style={{ fontSize: 22 }}>{emoji}</Text>
);
