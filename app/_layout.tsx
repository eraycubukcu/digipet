/**
 * app/_layout.tsx — Root layout.
 * PetProvider ile tüm uygulamayı sarar.
 * Onboarding kontrolü: flag yoksa onboarding route'una yönlendirir.
 */

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { PetProvider, STORAGE_ONBOARDING_KEY } from '../context/PetContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function OnboardingKontrolcu() {
  const [kontolEdildi, setKontolEdildi] = useState(false);

  useEffect(() => {
    (async () => {
      const deger = await AsyncStorage.getItem(STORAGE_ONBOARDING_KEY);
      if (!deger) {
        router.replace('/onboarding');
      }
      setKontolEdildi(true);
    })();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <PetProvider>
      <OnboardingKontrolcu />
      <Stack>
        <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
        <Stack.Screen name="onboarding"  options={{ headerShown: false }} />
        <Stack.Screen name="modal"       options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </PetProvider>
  );
}
