import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type CurrencyType = 'VND' | 'USD' | 'EUR' | 'JPY' | 'KRW' | 'SGD';
export type LanguageType = 'vi' | 'en';

interface SettingsState {
  language: LanguageType;
  currency: CurrencyType;
}

const getInitialLanguage = (): LanguageType => {
  const saved = localStorage.getItem('app_language');
  return (saved === 'vi' || saved === 'en') ? saved : 'vi';
};

const getInitialCurrency = (): CurrencyType => {
  const saved = localStorage.getItem('app_currency');
  const allowed: CurrencyType[] = ['VND', 'USD', 'EUR', 'JPY', 'KRW', 'SGD'];
  return allowed.includes(saved as any) ? (saved as CurrencyType) : 'VND';
};

const initialState: SettingsState = {
  language: getInitialLanguage(),
  currency: getInitialCurrency(),
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<LanguageType>) {
      state.language = action.payload;
      localStorage.setItem('app_language', action.payload);
    },
    setCurrency(state, action: PayloadAction<CurrencyType>) {
      state.currency = action.payload;
      localStorage.setItem('app_currency', action.payload);
    },
  },
});

export const { setLanguage, setCurrency } = settingsSlice.actions;
export default settingsSlice.reducer;
