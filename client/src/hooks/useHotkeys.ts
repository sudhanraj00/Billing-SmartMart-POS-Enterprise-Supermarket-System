import { useEffect } from 'react';

export interface HotkeyMap {
  onF2?: () => void; // Focus barcode/search
  onF4?: () => void; // Hold bill
  onF8?: () => void; // Payment modal
  onF9?: () => void; // Complete sale
  onEscape?: () => void; // Close modal
}

export function useHotkeys(map: HotkeyMap) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && map.onF2) {
        e.preventDefault();
        map.onF2();
      } else if (e.key === 'F4' && map.onF4) {
        e.preventDefault();
        map.onF4();
      } else if (e.key === 'F8' && map.onF8) {
        e.preventDefault();
        map.onF8();
      } else if (e.key === 'F9' && map.onF9) {
        e.preventDefault();
        map.onF9();
      } else if (e.key === 'Escape' && map.onEscape) {
        e.preventDefault();
        map.onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [map]);
}
