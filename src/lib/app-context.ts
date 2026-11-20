import { createContext, useContext } from 'react';

export type AppActions = {
  openProject: (slug: string) => void;
  openPalette: () => void;
  replayIntro: () => void;
  copyEmail: () => void;
  notify: (message: string) => void;
};

export const AppContext = createContext<AppActions | null>(null);

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside <App>');
  return value;
}
