import { create } from 'zustand';
import type { LobbyState, LobbyPlayer, MyRole } from '@/multiplayer/types';

interface LobbyStoreState {
  lobbyState: LobbyState;
  myRole: MyRole;
  myPeerId: string | null;
  selectedChipId: string | null;

  setLobbyState: (state: LobbyState) => void;
  setMyRole: (role: MyRole) => void;
  setMyPeerId: (id: string | null) => void;
  setSelectedChip: (id: string | null) => void;
  addToLobby: (pid: string, nick: string, team: 'red' | 'blue' | 'spec') => void;
  removeFromLobby: (pid: string) => void;
  resetLobby: () => void;
}

const defaultLobby: LobbyState = {
  roomName: '',
  maxPlayers: 4,
  red: [],
  blue: [],
  spec: [],
  settings: { pitch: 'medium', time: 180, goals: 5 },
  hostId: null,
};

export const useLobbyStore = create<LobbyStoreState>((set, get) => ({
  lobbyState: { ...defaultLobby },
  myRole: 'solo',
  myPeerId: null,
  selectedChipId: null,

  setLobbyState: (state) => set({ lobbyState: state }),
  setMyRole: (role) => set({ myRole: role }),
  setMyPeerId: (id) => set({ myPeerId: id }),
  setSelectedChip: (id) => set({ selectedChipId: id }),

  addToLobby: (pid, nick, team) => set((s) => {
    const ls = { ...s.lobbyState };
    // Remove from all teams first
    ls.red = ls.red.filter(p => p.id !== pid);
    ls.blue = ls.blue.filter(p => p.id !== pid);
    ls.spec = ls.spec.filter(p => p.id !== pid);
    // Add to target team
    ls[team] = [...ls[team], { id: pid, nick }];
    return { lobbyState: ls };
  }),

  removeFromLobby: (pid) => set((s) => {
    const ls = { ...s.lobbyState };
    ls.red = ls.red.filter(p => p.id !== pid);
    ls.blue = ls.blue.filter(p => p.id !== pid);
    ls.spec = ls.spec.filter(p => p.id !== pid);
    return { lobbyState: ls };
  }),

  resetLobby: () => set({
    lobbyState: { ...defaultLobby, red: [], blue: [], spec: [] },
    myRole: 'solo',
    myPeerId: null,
    selectedChipId: null,
  }),
}));
