import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { API_BASE_URL, API_HEADERS } from '../config/api';

// Lightweight session token for Places Autocomplete billing grouping —
// doesn't need cryptographic randomness, just uniqueness per search session.
function generateSessionToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

const DEBOUNCE_MS = 300;

// Destination search with Google Places Autocomplete, proxied through our own
// backend (see backend PlacesService) so the Places API key stays server-side.
export function DestinationSearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionToken = useRef(generateSessionToken());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/places/autocomplete?input=${encodeURIComponent(text)}&sessionToken=${sessionToken.current}`,
          { headers: API_HEADERS },
        );
        setSuggestions(await res.json());
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  };

  const selectSuggestion = async (suggestion: Suggestion) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/places/details?placeId=${suggestion.placeId}&sessionToken=${sessionToken.current}`,
        { headers: API_HEADERS },
      );
      const details = await res.json();
      navigation.navigate('RequestTrip', {
        destination: {
          lat: details.lat,
          lng: details.lng,
          label: suggestion.mainText ?? details.name,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <TextInput
        autoFocus
        value={query}
        onChangeText={onChangeText}
        placeholder="Search a landmark or address near you"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />

      {loading ? <ActivityIndicator color={colors.brandYellow} style={styles.spinner} /> : null}

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.placeId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => selectSuggestion(item)}>
            <Text style={styles.rowMain}>📍 {item.mainText}</Text>
            <Text style={styles.rowSecondary}>{item.secondaryText}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, padding: spacing.lg, gap: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textOnDark,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.body,
  },
  spinner: { marginTop: spacing.sm },
  list: { gap: spacing.sm },
  row: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, gap: 2 },
  rowMain: { color: colors.textOnDark, fontSize: typography.sizes.body, fontFamily: typography.fontFamilyMedium },
  rowSecondary: { color: colors.textMuted, fontSize: typography.sizes.caption, fontFamily: typography.fontFamily },
});
