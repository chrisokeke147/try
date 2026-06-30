import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';

export function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.screen}>
      <View style={styles.brandBlock}>
        <Logo width={220} light showTagline />
      </View>

      <View style={styles.actions}>
        <Button label="Sign In" onPress={() => navigation.navigate('SignIn')} />
        <Button label="Create an account" variant="secondary" onPress={() => navigation.navigate('SignUp')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, padding: spacing.lg, justifyContent: 'space-between' },
  brandBlock: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  actions: { gap: spacing.md, paddingBottom: spacing.lg },
});
