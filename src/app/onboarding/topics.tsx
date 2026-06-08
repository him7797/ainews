import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopicPill from '../../components/TopicPill';
import { getSelectedTopics, setSelectedTopics, setOnboardingCompleted } from '../../lib/storage';
import { router, Stack } from 'expo-router';

const AVAILABLE_TOPICS = [
  'Models', 'Agents', 'RAG', 'Research', 'Open source',
  'Funding', 'Robotics', 'Policy', 'Tooling', 'Hardware'
];

export default function TopicsScreen() {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const loadTopics = async () => {
      const stored = await getSelectedTopics();
      setSelected(stored);
    };
    loadTopics();
  }, []);

  const toggleTopic = (topic: string) => {
    setSelected((prev) => 
      prev.includes(topic) 
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const handleFinish = async () => {
    if (selected.length === 0) return; // Mandatory selection
    await setSelectedTopics(selected);
    await setOnboardingCompleted(true);
    // Replace current route with main app feed layout (assume `/(tabs)` or `/feed` is root)
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>WHAT DO YOU{'\n'}FOLLOW?</Text>
        <Text style={styles.subtitle}>Pick a few. You can change these anytime.</Text>

        <View style={styles.pillContainer}>
          {AVAILABLE_TOPICS.map((topic) => (
            <TopicPill
              key={topic}
              label={topic}
              isSelected={selected.includes(topic)}
              onPress={() => toggleTopic(topic)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.selectionCount}>{selected.length} selected</Text>
        <TouchableOpacity 
          style={[styles.button, selected.length === 0 && styles.buttonDisabled]} 
          onPress={handleFinish}
          disabled={selected.length === 0}
        >
          <Text style={styles.buttonText}>Build my feed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B93A5',
    marginBottom: 32,
    lineHeight: 24,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  selectionCount: {
    color: '#8B93A5',
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4361EE',
    height: 56,
    width: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  }
});
