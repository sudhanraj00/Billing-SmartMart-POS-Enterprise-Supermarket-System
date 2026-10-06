import { create } from 'zustand';
import { api } from '../services/api';
import { CashierShift } from '../types';

interface ShiftState {
  currentShift: CashierShift | null;
  isLoading: boolean;
  fetchCurrentShift: () => Promise<void>;
  openShift: (openingCash: number, notes?: string) => Promise<boolean>;
  closeShift: (actualCash: number, differenceReason?: string, notes?: string) => Promise<boolean>;
}

export const useShiftStore = create<ShiftState>((set) => ({
  currentShift: null,
  isLoading: false,

  fetchCurrentShift: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/shifts/current');
      set({ currentShift: res.data.data, isLoading: false });
    } catch {
      set({ currentShift: null, isLoading: false });
    }
  },

  openShift: async (openingCash: number, notes?: string) => {
    try {
      const res = await api.post('/shifts/open', { openingCash, notes });
      set({ currentShift: res.data.data });
      return true;
    } catch {
      return false;
    }
  },

  closeShift: async (actualCash: number, differenceReason?: string, notes?: string) => {
    try {
      await api.post('/shifts/close', { actualCash, differenceReason, notes });
      set({ currentShift: null });
      return true;
    } catch {
      return false;
    }
  },
}));
