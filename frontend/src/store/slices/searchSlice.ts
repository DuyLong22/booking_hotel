import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface SearchState {
  searchQuery: string;
  provinceId: string;
  districtId: string;
  wardId: string;
  categoryId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  priceMin: number | null;
  priceMax: number | null;
  starRating: number | null;
  amenityIds: string[];
}

const getTomorrow = (offset = 1): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

const defaultState: SearchState = {
  searchQuery: '',
  provinceId: '',
  districtId: '',
  wardId: '',
  categoryId: '',
  checkInDate: getTomorrow(1),
  checkOutDate: getTomorrow(2),
  guests: 2,
  priceMin: null,
  priceMax: null,
  starRating: null,
  amenityIds: [],
};

const loadSearchState = (): SearchState => {
  try {
    const saved = localStorage.getItem('search_criteria');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultState,
        ...parsed,
        checkInDate: parsed.checkInDate || defaultState.checkInDate,
        checkOutDate: parsed.checkOutDate || defaultState.checkOutDate,
      };
    }
  } catch (e) {
    console.error('Error loading search state:', e);
  }
  return defaultState;
};

const searchSlice = createSlice({
  name: 'search',
  initialState: loadSearchState(),
  reducers: {
    setSearchCriteria: (state, action: PayloadAction<Partial<SearchState>>) => {
      const newState = { ...state, ...action.payload };
      try {
        localStorage.setItem('search_criteria', JSON.stringify(newState));
      } catch (e) {
        console.error('Error saving search state:', e);
      }
      return newState;
    },
    resetSearchCriteria: () => {
      try {
        localStorage.removeItem('search_criteria');
      } catch (e) {
        console.error('Error resetting search state:', e);
      }
      return defaultState;
    },
  },
});

export const { setSearchCriteria, resetSearchCriteria } = searchSlice.actions;
export default searchSlice.reducer;
