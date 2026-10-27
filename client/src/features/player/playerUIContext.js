import { createContext, useContext } from 'react';

export const PlayerUI = createContext(null);
export function usePlayerUI() { return useContext(PlayerUI); }
