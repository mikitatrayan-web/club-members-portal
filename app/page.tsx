"use client";

import Image from "next/image";
import { FormEvent, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Archetype =
  | "Indica warrior"
  | "Sativa wizard"
  | "Hash gnome"
  | "Hybrid elf";

const archetypeImageByLabel: Record<Archetype, { src: string; alt: string }> = {
  "Hash gnome": {
    src: "/chars/hash.png",
    alt: "Hash Gnome"
  },
  "Indica warrior": {
    src: "/chars/indica.png",
    alt: "Indica Warrior"
  },
  "Sativa wizard": {
    src: "/chars/sativa.png",
    alt: "Sativa Wizard"
  },
  "Hybrid elf": {
    src: "/chars/hybrid.png",
    alt: "Hybrid Elf"
  }
};

type MemberResponse =
  | {
      found: true;
      member: {
        id: string;
        spins: number;
        archetype?: Archetype | null;
        reviewPosted?: boolean;
        reviewCredited?: boolean;
        referredBy?: string | null;
        referrals?: string[];
        igSubscribed?: boolean;
        collectibles?: string[];
      };
    }
  | {
      found: false;
      error: string;
    };

export default function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  );
}

function HomePageInner() {
  const searchParams = useSearchParams();
  const [memberId, setMemberId] = useState(searchParams.get("member") ?? "");

  useEffect(() => {
    const id = searchParams.get("member");
    if (id) setMemberId(id);
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MemberResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [archetypeSaving, setArchetypeSaving] = useState(false);
  const [archetypeError, setArchetypeError] = useState<string | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setArchetypeError(null);
    setReviewError(null);

    const trimmedId = memberId.trim();
    if (trimmedId.length < 5 || trimmedId.length > 6) {
      setError("Your member ID should be 5–6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/check-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: trimmedId })
      });

      const data: MemberResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError("Something went wrong, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleChooseArchetype = async (choice: Archetype) => {
    if (!result || !result.found || result.member.archetype) return;

    setArchetypeError(null);
    setArchetypeSaving(true);
    try {
      const response = await fetch("/api/member-archetype", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: result.member.id,
          archetype: choice
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Unable to save archetype. Please try again.";
        setArchetypeError(message);
        return;
      }

      setResult((current) =>
        current && current.found
          ? {
              ...current,
              member: {
                ...current.member,
                archetype: choice
              }
            }
          : current
      );
    } catch {
      setArchetypeError("Unable to save archetype. Please try again.");
    } finally {
      setArchetypeSaving(false);
    }
  };

  const handleReviewClick = async () => {
    if (
      !result ||
      !result.found ||
      result.member.reviewPosted ||
      result.member.reviewCredited
    )
      return;

    setReviewError(null);
    setReviewSaving(true);
    setCopied(false);

    try {
      if (typeof window !== "undefined") {
        window.open(
          "https://maps.app.goo.gl/tZiqzBxyQjf7kA3D7",
          "_blank",
          "noopener,noreferrer"
        );
      }

      const response = await fetch("/api/member-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: result.member.id,
          posted: true
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Unable to mark review as posted. Please tell staff.";
        setReviewError(message);
        return;
      }

      setResult((current) =>
        current && current.found
          ? {
              ...current,
              member: {
                ...current.member,
                reviewPosted: true
              }
            }
          : current
      );
    } catch {
      setReviewError("Unable to mark review as posted. Please tell staff.");
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <main className="portal-root">
      <div className="portal-shell">
        <div className="portal-orbit" aria-hidden="true" />

        {!result || !result.found ? (
          <>
            <section>
              <p className="hero-eyebrow">Cosmic Herbway // Members Only</p>
              <h1 className="hero-title">
                Voyage through the{" "}
                <span className="hero-title-em">past-future herb cosmos</span>.
              </h1>
              <p className="hero-subtitle">
                Whisper your member ID into the portal and we&apos;ll reveal the
                stash the cosmos set aside for you: spins grown from timeless herbs.
              </p>
              <p className="hero-footnote">
                Minimal signal. No noise. Just you, the void, and the green
                that remembers every orbit you&apos;ve taken with us.
              </p>
            </section>

            <section>
              <div className="panel">
                <header>
                  <h2 className="panel-header-title">Enter the member portal</h2>
                  <p className="panel-header-subtitle">
                    One code. Your entire herbal constellation.
                  </p>
                </header>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginTop: "1.2rem" }}>
                    <label htmlFor="member-id" className="field-label">
                      Member ID
                    </label>
                    <input
                      id="member-id"
                      type="text"
                      inputMode="text"
                      minLength={5}
                      maxLength={6}
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      className="field-input"
                      placeholder="5–6 cosmic glyphs from your card"
                    />
                    <p className="field-hint">
                      You can find it on your physical card or in the echoes of
                      our last encounter.
                    </p>
                  </div>

                  {error && <p className="banner-error">{error}</p>}

                  {result && !result.found && !error && (
                    <p className="banner-warning">
                      This ID doesn&apos;t map to any traveler in our records.
                      Check the glyphs or ask staff to realign your profile.
                    </p>
                  )}

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                  >
                    <span className="primary-button-label">
                      {loading ? "Scanning the star ledger" : "Reveal my bonuses"}
                      {!loading && (
                        <span className="secondary">Herbs always remember</span>
                      )}
                    </span>
                  </button>
                </form>

                <p className="panel-footnote">
                  For members of the private club, drifting between eras. Staff
                  can help if the portal feels strange.
                </p>
              </div>
            </section>
          </>
        ) : (
          <section className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {result.member.id.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p className="profile-meta-eyebrow">Cosmic Voyager Profile</p>
                <h1 className="profile-meta-title">
                  Member {result.member.id}
                </h1>
                <p className="profile-meta-copy">
                  Use spins with any staff member at the club
                </p>
              </div>
              {result.member.archetype && (
                <div
                  style={{
                    position: "relative",
                    width: 72,
                    height: 96,
                    borderRadius: 16,
                    overflow: "hidden",
                    flexShrink: 0
                  }}
                >
                  <Image
                    src={archetypeImageByLabel[result.member.archetype].src}
                    alt={archetypeImageByLabel[result.member.archetype].alt}
                    fill
                    sizes="96px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
            </div>

            <div className="bonus-grid">
              <BonusCard label="Spins" value={result.member.spins} />
            </div>

            {result.member.collectibles && result.member.collectibles.length > 0 && (
              <p className="profile-copy-secondary" style={{ marginTop: "0.4rem" }}>
                Collectible cards:{" "}
                <span style={{ fontWeight: 600 }}>
                  {result.member.collectibles.join(", ")}
                </span>
              </p>
            )}

            {(() => {
              const referredBy = result.member.referredBy;
              const hasReferrer =
                referredBy &&
                referredBy !== "0" &&
                String(referredBy).trim() !== "";
              const referrals = (result.member.referrals || []).filter(
                (r) => r != null && r !== "" && String(r).trim() !== "0"
              );
              const hasReferrals = referrals.length > 0;
              if (!hasReferrer && !hasReferrals) return null;
              return (
                <div style={{ marginTop: "0.8rem" }}>
                  {hasReferrer && (
                    <p className="profile-copy-secondary">
                      You were welcomed into this orbit by{" "}
                      <span style={{ fontWeight: 600 }}>{referredBy}</span>.
                    </p>
                  )}
                  <p className="profile-copy-secondary" style={{ marginTop: "0.25rem" }}>
                    Your referrals:{" "}
                    {hasReferrals
                      ? referrals.join(", ")
                      : "You haven't referred anyone yet."}
                  </p>
                </div>
              );
            })()}

            <p className="profile-copy">
              FOLLOW US – GET A SPIN
            </p>
            <p className="profile-copy-secondary">
              When your balances return to zero, the cosmos simply waits for
              your next orbit.
            </p>

            <div
              className={
                "review-panel" +
                (result.member.igSubscribed ? " review-panel--complete" : "")
              }
              style={{ marginTop: "0.9rem" }}
            >
              {result.member.igSubscribed ? (
                <>
                  <p className="review-panel-title">
                    QUEST COMPLETE – INSTA SPIN
                  </p>
                  <p className="review-panel-body">
                    You&apos;re already tuned into our Instagram signal. Staff
                    have credited your subscription spin; watch for the next
                    quest to appear here.
                  </p>
                </>
              ) : (
                <>
                  <p className="review-panel-title">
                    FOLLOW US – GET A SPIN
                  </p>
                  <p className="review-panel-body">
                    Subscribe to our Instagram to unlock a spin. Show
                    staff your follow screen so they can sync the bonus into
                    this profile.
                  </p>
                  <div className="review-panel-row">
                    <a
                      href="https://instagram.com/icetraycsc"
                      target="_blank"
                      rel="noreferrer"
                      className="review-link-pill"
                    >
                      Open Instagram
                    </a>
                  </div>
                </>
              )}
            </div>

            {result.member.reviewCredited ? (
              <div className="review-panel review-panel--complete">
                <p className="review-panel-title">
                  QUEST COMPLETE – SPIN CREDITED
                </p>
                <p className="review-panel-body">
                  Staff have already anchored this bonus into your profile. Drift
                  back later for new quests and fresh herbal missions.
                </p>
              </div>
            ) : !result.member.reviewPosted ? (
              <div style={{ marginTop: "1.1rem" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleReviewClick}
                  disabled={reviewSaving}
                >
                  LEAVE REVIEW -&gt; GET A SPIN
                </button>
                {reviewError && (
                  <p
                    className="banner-error"
                    style={{ marginTop: "0.7rem", fontSize: "0.78rem" }}
                  >
                    {reviewError}
                  </p>
                )}
              </div>
            ) : (
              <div className="review-panel">
                <p className="review-panel-title">
                  AFTER THE REVIEW IS POSTED – CLAIM YOUR SPIN
                </p>
                <p className="review-panel-body">
                  Show this to staff after your cosmic words go live. They&apos;ll
                  anchor your bonus into this profile.
                </p>
                <div className="review-panel-row">
                  <a
                    href="https://maps.app.goo.gl/tZiqzBxyQjf7kA3D7"
                    target="_blank"
                    rel="noreferrer"
                    className="review-link-pill"
                  >
                    Open review portal
                  </a>
                  <button
                    type="button"
                    className="review-copy-button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          "https://maps.app.goo.gl/tZiqzBxyQjf7kA3D7"
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch {
                        setCopied(false);
                      }
                    }}
                  >
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </div>
                <p className="review-ack">
                  Once staff have seen your review, they&apos;ll add the spin
                  to your cosmic balance.
                </p>
              </div>
            )}

            {!result.member.archetype && (
              <div style={{ marginTop: "1.3rem" }}>
                <p className="field-label">
                  Choose your herbal archetype
                </p>
                <p className="field-hint">
                  We&apos;ll remember this in the star-ledger so we don&apos;t
                  ask you again.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "0.5rem",
                    marginTop: "0.85rem"
                  }}
                >
                  {[
                    "Indica warrior",
                    "Sativa wizard",
                    "Hash gnome",
                    "Hybrid elf"
                  ].map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => handleChooseArchetype(choice as Archetype)}
                      disabled={archetypeSaving}
                      className="primary-button"
                      style={{
                        marginTop: 0,
                        fontSize: "0.78rem",
                        padding: "0.55rem 0.8rem"
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </div>

                {archetypeError && (
                  <p className="banner-error" style={{ marginTop: "0.7rem" }}>
                    {archetypeError}
                  </p>
                )}
              </div>
            )}

            {result.member.archetype && (
              <p
                className="profile-copy"
                style={{ marginTop: "1.1rem", fontSize: "0.76rem" }}
              >
                You walk the path of the{" "}
                <span style={{ fontWeight: 600 }}>
                  {result.member.archetype}
                </span>
                . The garden remembers.
              </p>
            )}

            <div className="profile-footer">
              <span className="profile-footer-copy">
                Not your constellation? You can step back through the veil.
              </span>
              <button
                type="button"
                onClick={() => {
                  setMemberId("");
                  setResult(null);
                  setError(null);
                  setArchetypeError(null);
                }}
                className="profile-footer-link"
              >
                Check another ID
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function BonusCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bonus-card">
      <span className="bonus-card-label">{label}</span>
      <span className="bonus-card-value">{value ?? 0}</span>
    </div>
  );
}

