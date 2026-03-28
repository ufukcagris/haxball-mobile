'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useLobbyStore } from '@/stores/useLobbyStore';
import { MenuCard } from '@/components/ui/MenuCard';
import { FieldInput } from '@/components/ui/FieldInput';
import { PlayButton } from '@/components/ui/PlayButton';
import { getSharedPeer } from './CreateRoomScreen';
import { GuestManager } from '@/multiplayer/GuestManager';

let sharedGuest: GuestManager | null = null;
export function getSharedGuest(): GuestManager | null {
  if (!sharedGuest) {
    const peer = getSharedPeer();
    sharedGuest = new GuestManager(peer);
  }
  return sharedGuest;
}
export function resetSharedGuest(): void {
  sharedGuest = null;
}

export function JoinRoomScreen() {
  const { config, setScreen } = useAppStore();
  const { setLobbyState, setMyRole, setMyPeerId } = useLobbyStore();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('Hazirlaniyor...');
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
      peer.init(onInit, (err) => {
        setStatus('❌ Baglanti hatasi: ' + err);
        setStatusCls('err');
        setReady(false);
      });
    }
  }, [setMyPeerId]);

  const joinRoom = () => {
    if (!ready) {
      setStatus('Henüz hazir degil, bekle...');
      setStatusCls('err');
      return;
    }
    if (!code.trim()) {
      setStatus('Kod gir!');
      setStatusCls('err');
      return;
    }
    setStatus('🔗 Baglaniyor...');
    setStatusCls('');
    setMyRole('guest');

    const guest = getSharedGuest()!;

    guest.onLobbyUpdate = (state) => {
      const p = getSharedPeer();
      setMyPeerId(p.peerId!);
      
      // Welcome message only once
      const { addChatMessage, hasJoinedMessageShown, setHasJoinedMessageShown } = useLobbyStore.getState();
      if (!hasJoinedMessageShown) {
        addChatMessage('SİSTEM', 'Odaya katildin');
        setHasJoinedMessageShown(true);
      }

      setLobbyState(state);
      setScreen('lobby');
    };
    guest.onDisconnect = () => {
      setStatus((prev) =>
        prev.includes('Oda dolu') ? prev : '❌ Baglanti kesildi',
      );
      setStatusCls('err');
    };
    guest.onError = (err) => {
      setStatus('❌ ' + err);
      setStatusCls('err');
    };

    guest.connect(code.trim(), config.nick);
  };

  return (
    <div
      className='flex flex-col items-center justify-center overflow-y-auto px-3 py-6 gap-3 w-full h-full'
      style={{
        background:
          'radial-gradient(ellipse at 40% 30%, #0d2040 0%, #0a0e1a 70%)',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      <div className='menu-bg' />
      <div className='relative text-center z-1 mt-3'>
        <div
          className='text-[clamp(1.2rem,4vw,2rem)] font-black'
          style={{
            background: 'linear-gradient(135deg, #00e5ff, #ffffff, #ff3d71)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Odaya Katil
        </div>
      </div>

      <MenuCard className='w-[min(460px,96vw)]'>
        <FieldInput
          label='Oda Kodu'
          value={code}
          onChange={setCode}
          placeholder='Oda kodunu gir...'
          maxLength={50}
          mono
        />

        <div
          className={`text-[0.78rem] text-center py-1.5 min-h-[20px]
          ${statusCls === 'ok' ? 'text-(--green)' : statusCls === 'err' ? 'text-(--red-team)' : 'text-(--text-dim)'}`}
        >
          {status}
        </div>

        <PlayButton onClick={joinRoom} disabled={!ready} className='w-full'>
          🚀 KATIL
        </PlayButton>
        <PlayButton
          onClick={() => setScreen('menu')}
          variant='secondary'
          className='w-full'
        >
          ← Geri
        </PlayButton>
      </MenuCard>
    </div>
  );
}
