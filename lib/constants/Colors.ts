export const Colors = {
  light: {
    text: '#333',
    background: '#F7F7F7',
    tint: '#FF6B6B',
    icon: '#666',
  },
  dark: {
    text: '#FFF',
    background: '#000000',
    tint: '#FF6B6B',
    icon: '#666',
  },
} as const;

export type ColorScheme = keyof typeof Colors; 