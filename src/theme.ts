import { useColorScheme } from 'react-native';

const light = {
  bg: '#F4F7F6',
  card: '#FFFFFF',
  text: '#15211D',
  muted: '#5D6B66',
  border: '#E1E7E4',
  primary: '#2F7D6B',
  onPrimary: '#FFFFFF',
  accent: '#E5F1EE',
  danger: '#C2453D',
  onDanger: '#FFFFFF',
  dangerSoft: '#FBEAE8',
  gold: '#B7791F',
};

export type Theme = typeof light;

const dark: Theme = {
  bg: '#0E1513',
  card: '#16201D',
  text: '#E7EFEC',
  muted: '#9AABA5',
  border: '#25332F',
  primary: '#4FB39A',
  onPrimary: '#06231C',
  accent: '#1C2E29',
  danger: '#E26A61',
  onDanger: '#2A0B09',
  dangerSoft: '#3A1E1C',
  gold: '#E0A84A',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
