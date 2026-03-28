'use client';

import dynamic from 'next/dynamic';

const ScreenManager = dynamic(
  () => import('@/components/screens/ScreenManager').then(mod => ({ default: mod.ScreenManager })),
  { ssr: false }
);

export default function Home() {
  return <ScreenManager />;
}
