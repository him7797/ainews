import React from 'react';
import OnboardingCarousel from '../../components/OnboardingCarousel';
import { Stack } from 'expo-router';

export default function OnboardingScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingCarousel />
    </>
  );
}
