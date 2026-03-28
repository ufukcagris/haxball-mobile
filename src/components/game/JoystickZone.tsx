'use client';

import { RefObject } from 'react';

interface JoystickZoneProps {
  zoneRef: RefObject<HTMLDivElement | null>;
  jBaseRef: RefObject<HTMLDivElement | null>;
  jKnobRef: RefObject<HTMLDivElement | null>;
}

export function JoystickZone({ zoneRef, jBaseRef, jKnobRef }: JoystickZoneProps) {
  return (
    <div
      ref={zoneRef}
      className="absolute bottom-0 left-0 right-0 z-30"
      style={{ top: '40px', pointerEvents: 'all', touchAction: 'none' }}
    >
      <div
        ref={jBaseRef}
        className="joystick-base"
        style={{ display: 'none' }}
      >
        <div ref={jKnobRef} className="joystick-knob" />
      </div>
    </div>
  );
}
