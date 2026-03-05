"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Wheel } from "./Wheel";
import { wheelSegments } from "./config";

type WheelSpinResponse =
  | {
      ok: true;
      memberId: string;
      newSpinCount: number;
      outcome: {
        label: string;
        value: string | null;
        segmentIndex: number;
      };
    }
  | {
      ok: false;
      error: string;
    };

export default function WheelPage() {
  return (
    <Suspense>
      <WheelPageInner />
    </Suspense>
  );
}

function WheelPageInner() {
  const searchParams = useSearchParams();
  const [memberId, setMemberId] = useState(searchParams.get("member") ?? "");

  useEffect(() => {
    const id = searchParams.get("member");
    if (id) setMemberId(id);
  }, [searchParams]);
  const [memberError, setMemberError] = useState<string | null>(null);

  const [spinning, setSpinning] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [spinResult, setSpinResult] = useState<WheelSpinResponse | null>(null);
  const [spinError, setSpinError] = useState<string | null>(null);

  const handleSpin = async () => {
    if (spinning) return;

    const trimmedId = memberId.trim();
    if (trimmedId.length < 5 || trimmedId.length > 6) {
      setMemberError("Member ID must be 5–6 characters long.");
      return;
    }

    setSpinError(null);
    setSpinResult(null);
    setMemberError(null);
    setSpinning(true);

    try {
      const response = await fetch("/api/wheel-spin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: trimmedId })
      });

      const data: WheelSpinResponse = await response.json();
      if (!response.ok || !data.ok) {
        setSpinError(
          data && !data.ok && data.error
            ? data.error
            : "Unable to record spin."
        );
        setSpinning(false);
        return;
      }

      const index =
        data.outcome.segmentIndex >= 0 &&
        data.outcome.segmentIndex < wheelSegments.length
          ? data.outcome.segmentIndex
          : 0;

      setActiveIndex(index);
      setSpinResult(data);
    } catch {
      setSpinError("Unable to record spin.");
      setSpinning(false);
    }
  };

  return (
    <main className="portal-root">
      <div className="portal-shell">
        <div className="portal-orbit" aria-hidden="true" />

        <section>
          <p className="hero-eyebrow">Cosmic Herbway // Staff console</p>
          <h1 className="hero-title">
            Spin the{" "}
            <span className="hero-title-em">bonus wheel for members</span>.
          </h1>
          <p className="hero-subtitle">
            Enter the member ID from their card, then use the wheel to record a
            spin and reveal rewards. This page is designed for tablets and
            phones used behind the counter.
          </p>
        </section>

        <section>
          <div className="panel">
            <header>
              <h2 className="panel-header-title">Member &amp; wheel</h2>
              <p className="panel-header-subtitle">
                Enter a member ID and spin. Column M in the sheet tracks total
                spins used.
              </p>
            </header>

            <form
              onSubmit={(event: FormEvent) => {
                event.preventDefault();
                handleSpin();
              }}
              style={{ marginTop: "1.2rem" }}
            >
              <label htmlFor="wheel-member-id" className="field-label">
                Member ID
              </label>
              <input
                id="wheel-member-id"
                type="text"
                inputMode="text"
                minLength={5}
                maxLength={6}
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
                className="field-input"
                placeholder="5–6 characters from card"
              />
              <p className="field-hint">
                Same ID members use in the main portal.
              </p>

              {memberError && <p className="banner-error">{memberError}</p>}

              <button
                type="submit"
                className="primary-button"
                disabled={spinning}
              >
                <span className="primary-button-label">
                  {spinning ? "Spinning..." : "Spin for this member"}
                </span>
              </button>
            </form>

            <div style={{ marginTop: "1.5rem" }}>
              <Wheel
                activeIndex={activeIndex}
                spinning={spinning}
                onSpinComplete={() => setSpinning(false)}
                resultLabel={spinResult && spinResult.ok && !spinning ? spinResult.outcome.label : null}
              />

              {spinError && (
                <p className="banner-error" style={{ marginTop: "0.9rem" }}>
                  {spinError}
                </p>
              )}

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
