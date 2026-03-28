import { create } from 'zustand';
import type { LobbyState, MyRole } from '@/multiplayer/types';

interface LobbyStoreState {
  lobbyState: LobbyState;
  myRole: MyRole;
  myPeerId: string | null;
  selectedChipId: string | null;
  chatMessages: Array<{ nick: string; message: string; id: number }>;

  setLobbyState: (state: LobbyState) => void;
  setMyRole: (role: MyRole) => void;
  setMyPeerId: (id: string | null) => void;
  setSelectedChip: (id: string | null) => void;
  addToLobby: (
    pid: string,
    nick: string,
    team: 'red' | 'blue' | 'spec',
  ) => void;
  removeFromLobby: (pid: string) => void;
  addChatMessage: (nick: string, message: string) => void;
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

export const useLobbyStore = create<LobbyStoreState>((set) => ({
  lobbyState: { ...defaultLobby },
  myRole: 'solo',
  myPeerId: null,
  selectedChipId: null,
  chatMessages: [],

  setLobbyState: (state) => set({ lobbyState: state }),
  setMyRole: (role) => set({ myRole: role }),
  setMyPeerId: (id) => set({ myPeerId: id }),
  setSelectedChip: (id) => set({ selectedChipId: id }),

  addToLobby: (pid, nick, team) =>
    set((s) => {
      const ls = { ...s.lobbyState };
      // Remove from all teams first
      ls.red = ls.red.filter((p) => p.id !== pid);
      ls.blue = ls.blue.filter((p) => p.id !== pid);
      ls.spec = ls.spec.filter((p) => p.id !== pid);
      // Add to target team
      ls[team] = [...ls[team], { id: pid, nick }];
      return { lobbyState: ls };
    }),

  removeFromLobby: (pid) =>
    set((s) => {
      const ls = { ...s.lobbyState };
      ls.red = ls.red.filter((p) => p.id !== pid);
      ls.blue = ls.blue.filter((p) => p.id !== pid);
      ls.spec = ls.spec.filter((p) => p.id !== pid);
      return { lobbyState: ls };
    }),

  addChatMessage: (nick, message) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages.slice(-19),
        { nick, message, id: Date.now() + Math.random() },
      ],
    })),

  resetLobby: () =>
    set({
      lobbyState: { ...defaultLobby, red: [], blue: [], spec: [] },
      myRole: 'solo',
      myPeerId: null,
      selectedChipId: null,
      chatMessages: [],
    }),
}));
