/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#624cacff';
const tintColorDark = '#A78BFA';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E0E0E0',
    input: '#FFFFFF',
    inputBorder: '#E0E0E0',
    section: '#F5F5F5',
    sectionBackground: 'rgba(0, 0, 0, 0.03)',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    placeholder: '#999999',
    disabled: '#CCCCCC',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
    info: '#17A2B8',
  },
  dark: {
    text: '#ECEDEE',
    background: '#121212',
    card: '#1E1E1E',
    border: '#333333',
    input: '#2A2A2A',
    inputBorder: '#404040',
    section: '#1A1A1A',
    sectionBackground: 'rgba(255, 255, 255, 0.05)',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    placeholder: '#666666',
    disabled: '#444444',
    error: '#EF5350',
    success: '#66BB6A',
    warning: '#FFA726',
    info: '#42A5F5',
  },
};
