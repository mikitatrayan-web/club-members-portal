"use client";

import { useEffect, useRef } from "react";
import { wheelSegments } from "./config";

type WheelProps = {
  activeIndex: number | null;
  spinning: boolean;
  onSpinComplete?: () => void;
};
type SpinWheelInstance = {
  spinToItem: (
    itemIndex?: number,
    duration?: number,
    spinToCenter?: boolean,
    numberOfRevolutions?: number,
    direction?: number,
    easingFunction?: ((n: number) => number) | null
  ) => void;
  remove?: () => void;
};

export function Wheel({ activeIndex, spinning, onSpinComplete }: WheelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wheelRef = useRef<SpinWheelInstance | null>(null);
  const easingRef = useRef<((n: number) => number) | null>(null);
  const lastIndexRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      if (!containerRef.current) return;
      try {
        const spinWheelModule = await import("spin-wheel");
        const WheelClass = (spinWheelModule as any).Wheel;
        const easing = (spinWheelModule as any).easing;

        if (!WheelClass || !mounted) return;

        const items = wheelSegments.map((segment) => ({
          label: segment.label,
          backgroundColor: segment.color,
          labelColor: segment.labelColor ?? "#ffffff"
        }));

        const wheel = new WheelClass(containerRef.current, {
          items,
          isInteractive: false,
          // Pointer at 6 o'clock (bottom). Our visual pointer is
          // aligned to the bottom edge to match this angle.
          pointerAngle: 180
        });

        wheelRef.current = wheel;
        easingRef.current = easing && easing.cubicOut ? easing.cubicOut : null;
      } catch (error) {
        console.error("Failed to initialise spin-wheel", error);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (wheelRef.current && typeof wheelRef.current.remove === "function") {
        wheelRef.current.remove();
      }
      wheelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (activeIndex == null) return;
    if (lastIndexRef.current === activeIndex) return;
    lastIndexRef.current = activeIndex;
    const wheel = wheelRef.current;
    if (!wheel) return;

    try {
      const duration = 4000;
      const easingFn = easingRef.current;
      wheel.spinToItem(activeIndex, duration, true, 2, 1, easingFn ?? null);

      if (onSpinComplete) {
        setTimeout(() => {
          onSpinComplete();
        }, duration);
      }
    } catch (error) {
      console.error("Error spinning wheel", error);
      if (onSpinComplete) {
        onSpinComplete();
      }
    }
  }, [activeIndex, onSpinComplete]);

  return (
    <div
      style={{ position: "relative", width: 280, height: 280, margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "-8px",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderBottom: "22px solid #facc15",
          filter: "drop-shadow(0 0 12px rgba(250, 204, 21, 0.9))",
          zIndex: 10
        }}
      />
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%"
        }}
      />
    </div>
  );
}

