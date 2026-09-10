import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColors } from '@/hooks/useThemeColors';

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type ShowAlertFn = (title: string, message?: string, buttons?: AlertButton[]) => void;

let showAlertRef: ShowAlertFn | null = null;

/** Déclenche la boîte de dialogue personnalisée depuis n'importe où (voir utils/alert.ts). */
export function showCustomAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (showAlertRef) {
    showAlertRef(title, message, buttons);
  } else if (__DEV__) {
    console.warn('AlertHost non monté: impossible d\'afficher', title);
  }
}

const ERROR_PATTERN = /erreur|échec|impossible|invalide/i;
const SUCCESS_PATTERN = /succès|réussi/i;

function getIconFor(title: string, buttons: AlertButton[]) {
  if (ERROR_PATTERN.test(title)) return { name: 'xmark.circle.fill' as const, color: '#DC3545' };
  if (SUCCESS_PATTERN.test(title)) return { name: 'checkmark.circle.fill' as const, color: '#28A745' };
  if (buttons.some((b) => b.style === 'destructive')) {
    return { name: 'exclamationmark.triangle.fill' as const, color: '#FF9800' };
  }
  return { name: 'info.circle.fill' as const, color: undefined };
}

/**
 * Hôte unique de la boîte de dialogue personnalisée de l'app.
 * À monter une seule fois près de la racine (voir app/_layout.tsx).
 */
export function AlertHost() {
  const colors = useThemeColors();
  const [state, setState] = useState<AlertState>({ visible: false, title: '', buttons: [] });
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    showAlertRef = (title, message, buttons) => {
      setState({
        visible: true,
        title,
        message,
        buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
      });
    };
    return () => {
      showAlertRef = null;
    };
  }, []);

  useEffect(() => {
    if (state.visible) {
      scale.setValue(0.92);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 9, tension: 90 }),
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [state.visible, scale, opacity]);

  const close = () => setState((s) => ({ ...s, visible: false }));

  const handlePress = (button: AlertButton) => {
    close();
    if (button.onPress) {
      // Laisse la modale se fermer avant de déclencher l'action (navigation, etc.)
      setTimeout(button.onPress, 60);
    }
  };

  if (!state.visible) return null;

  const icon = getIconFor(state.title, state.buttons);
  const stacked = state.buttons.length > 2;

  return (
    <Modal transparent visible={state.visible} animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.card, opacity, transform: [{ scale }] },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: (icon.color || colors.tint) + '1A' }]}>
            <IconSymbol name={icon.name} size={26} color={icon.color || colors.tint} />
          </View>

          <ThemedText style={styles.title}>{state.title}</ThemedText>
          {!!state.message && (
            <ThemedText style={[styles.message, { color: colors.placeholder }]}>{state.message}</ThemedText>
          )}

          <View style={[styles.buttonsRow, stacked && styles.buttonsColumn]}>
            {state.buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';
              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  style={[
                    styles.button,
                    stacked ? styles.buttonStacked : styles.buttonInline,
                    isDestructive && { backgroundColor: '#DC3545' },
                    isCancel && { backgroundColor: colors.section, borderWidth: 1, borderColor: colors.border },
                    !isDestructive && !isCancel && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => handlePress(button)}
                  activeOpacity={0.8}
                >
                  <ThemedText
                    style={[
                      styles.buttonText,
                      isCancel ? { color: colors.text } : { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {button.text || 'OK'}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  buttonsColumn: {
    flexDirection: 'column',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInline: {
    flex: 1,
  },
  buttonStacked: {
    width: '100%',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
