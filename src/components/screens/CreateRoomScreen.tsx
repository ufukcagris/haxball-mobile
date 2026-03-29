'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useLobbyStore } from '@/stores/useLobbyStore';
import { MenuCard } from '@/components/ui/MenuCard';
import { FieldInput } from '@/components/ui/FieldInput';
import { SelectorButton } from '@/components/ui/SelectorButton';
import { PlayButton } from '@/components/ui/PlayButton';
import { PeerManager } from '@/multiplayer/PeerManager';
import { HostManager } from '@/multiplayer/HostManager';

// Shared peer manager instance
let sharedPeer: PeerManager | null = null;
let sharedHost: HostManager | null = null;

export function getSharedPeer(): PeerManager {
  if (!sharedPeer) sharedPeer = new PeerManager();
  return sharedPeer;
}
export function getSharedHost(): HostManager | null { return sharedHost; }
export function resetSharedHost(): void { sharedHost = null; }

export function CreateRoomScreen() {
  const { config, setScreen } = useAppStore();
  const { lobbyState, setLobbyState, setMyRole, setMyPeerId, addToLobby } = useLobbyStore();
  const [roomName, setRoomName] = useState('Harika Oda');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [status, setStatus] = useState('Baglaniyor...');
  const [statusCls, setStatusCls] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const peer = getSharedPeer();
    
    const onInit = (id: string) => {
      setStatus('✅ Hazir');
      setStatusCls('ok');
      setReady(true);
      setMyPeerId(id);
    };

    if (peer.isReady && peer.peerId) {
      onInit(peer.peerId);
    } else {
      peer.init(
        onInit,
        (err) => {
          setStatus('❌ Baglanti hatasi: ' + err);
          setStatusCls('err');
          setReady(false);
        },
        undefined
      );
    }
  }, [setMyPeerId]);

  const createRoom = () => {
    const peer = getSharedPeer();
    if (!peer.peerId || !ready) {
      setStatus('❌ Peer hazir degil!');
      setStatusCls('err');
      return;
    }

    setMyRole('host');
    const newLobby = {
      ...lobbyState,
      roomName: roomName || 'Oda',
      maxPlayers,
      hostId: peer.peerId,
      red: [{ id: peer.peerId, nick: config.nick }],
      blue: [],
      spec: [],
    };
    setLobbyState(newLobby);

    // Setup host manager
    sharedHost = new HostManager(peer);
    sharedHost.onPlayerJoined = (pid, nick) => {
      addToLobby(pid, nick, 'spec');
    };
    sharedHost.onPlayerLeft = (pid) => {
      useLobbyStore.getState().removeFromLobby(pid);
    };
    sharedHost.setupConnectionListener();

    // Welcome message only once
    const { addChatMessage, hasJoinedMessageShown, setHasJoinedMessageShown } = useLobbyStore.getState();
    if (!hasJoinedMessageShown) {
      addChatMessage('SİSTEM', 'Odaya katildin');
      setHasJoinedMessageShown(true);
    }

    setScreen('lobby');
  };

  const maxOptions = [2, 4, 6, 8, 10];

  return (
    <div
      className="flex flex-col items-center overflow-y-auto w-full h-full"
      style={{
        background: 'radial-gradient(ellipse at 40% 30%, #0d2040 0%, #0a0e1a 70%)',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      <div className="menu-bg fixed inset-0" />
      <div className="my-auto flex flex-col mobile-landscape:flex-row items-center justify-center gap-[clamp(10px,4vw,30px)] w-full shrink-0 px-3 py-6 z-1">
        <div className="relative text-center shrink-0 mobile-landscape:scale-90">
        <div className="text-[clamp(1.2rem,4vw,2rem)] font-black"
          style={{
            background: 'linear-gradient(135deg, #00e5ff, #ffffff, #ff3d71)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}
        >
          Oda Olustur
        </div>
      </div>

      <MenuCard className="w-[min(460px,96vw)] mobile-landscape:w-[480px]">
        <div className="flex flex-col mobile-landscape:grid mobile-landscape:grid-cols-2 gap-[clamp(7px,1.4vh,12px)] mobile-landscape:gap-4">
          <div className="flex flex-col gap-[clamp(7px,1.4vh,12px)] mobile-landscape:gap-3">
        <FieldInput label="Oda Adi" value={roomName} onChange={setRoomName} placeholder="Oda adi..." maxLength={20} />

        <div className="flex flex-col gap-1">
          <div className="text-[0.65rem] font-bold tracking-[2px] uppercase text-(--accent) opacity-80">
            Max Oyuncu
          </div>
          <div className="flex gap-2">
            {maxOptions.map((n) => (
              <SelectorButton key={n} active={maxPlayers === n} onClick={() => setMaxPlayers(n)}>
                {n}
              </SelectorButton>
            ))}
          </div>
        </div>

        <div className={`text-[0.78rem] text-center py-1.5 min-h-[20px]
          ${statusCls === 'ok' ? 'text-(--green)' : statusCls === 'err' ? 'text-(--red-team)' : 'text-(--text-dim)'}`}
        >
          {status}
        </div>
        </div>

        <div className="flex flex-col gap-[clamp(7px,1.4vh,12px)] mobile-landscape:gap-3">
          <PlayButton onClick={createRoom} disabled={!ready} className="w-full">
            🏟️ ODA OLUSTUR
          </PlayButton>
          <PlayButton onClick={() => setScreen('join')} variant="purple" className="w-full">
            🚀 ODAYA KATIL
          </PlayButton>
          <PlayButton onClick={() => setScreen('menu')} variant="secondary" className="w-full">
            ← Geri
          </PlayButton>
        </div>
        </div>
      </MenuCard>
      </div>
    </div>
  );
}
