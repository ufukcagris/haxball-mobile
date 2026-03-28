import { create } from 'zustand';

interface GameStoreState {
  scoreRed: number;
  scoreBlue: number;
  timeLeft: number;
  overtime: boolean;
  time: number; // total match time (for infinite check)
  paused: boolean;
  over: boolean;
  goalTeam: 'red' | 'blue' | null;
  showGoalOverlay: boolean;
  showEndOverlay: boolean;
  showPauseOverlay: boolean;
  showFullLobby: boolean;
  redNick: string;
  blueNick: string;

  updateHUD: (data: { scoreRed: number; scoreBlue: number; timeLeft: number; overtime: boolean; time: number }) => void;
  setGoal: (team: 'red' | 'blue') => void;
  clearGoal: () => void;
  setEnd: () => void;
  setPaused: (paused: boolean) => void;
  setShowFullLobby: (show: boolean) => void;
  setNicks: (red: string, blue: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  scoreRed: 0,
  scoreBlue: 0,
  timeLeft: 0,
  overtime: false,
  time: 180,
  paused: false,
  over: false,
  goalTeam: null,
  showGoalOverlay: false,
  showEndOverlay: false,
  showPauseOverlay: false,
  showFullLobby: false,
  redNick: 'KIRMIZI',
  blueNick: 'MAVİ',

  updateHUD: (data) => set({
    scoreRed: data.scoreRed,
    scoreBlue: data.scoreBlue,
    timeLeft: data.timeLeft,
    overtime: data.overtime,
    time: data.time,
  }),
  setGoal: (team) => set({ goalTeam: team, showGoalOverlay: true }),
  clearGoal: () => set({ goalTeam: null, showGoalOverlay: false }),
  setEnd: () => set({ over: true, showEndOverlay: true }),
  setPaused: (paused) => set({ paused, showPauseOverlay: paused }),
  setShowFullLobby: (show) => set({ showFullLobby: show }),
  setNicks: (red, blue) => set({ redNick: red, blueNick: blue }),
  reset: () => set((s) => ({
    scoreRed: 0, scoreBlue: 0, timeLeft: 0, overtime: false,
    paused: false, over: false, goalTeam: null,
    showGoalOverlay: false, showEndOverlay: false, showPauseOverlay: false,
    // Keep showFullLobby as is during reset, or handle explicitly
    showFullLobby: s.showFullLobby,
  })),
}));
