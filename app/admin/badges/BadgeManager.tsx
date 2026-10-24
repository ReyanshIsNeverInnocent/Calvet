"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export type ManagedBadge = {
  id: string;
  kind: string;
  label: string;
};

type BadgeManagerProps = {
  initialUsername: string;
  profile: { username: string; display_name: string } | null;
  badges: ManagedBadge[];
};

const BUILT_IN_BADGES = [
  ["verified", "Verified"],
  ["founder", "Founder"],
  ["early", "Early"],
  ["official-demo", "Official Demo"],
  ["developer", "Developer"],
  ["the-one-and-only", "The One and Only"]
] as const;

export default function BadgeManager({
  initialUsername,
  profile,
  badges
}: BadgeManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState(initialUsername);
  const [kind, setKind] = useState<string>(BUILT_IN_BADGES[0][0]);
  const [customKind, setCustomKind] = useState("");
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const activeProfile =
    profile && username.trim().toLowerCase() === profile.username ? profile : null;

  function findProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    router.push(`/admin/badges?username=${encodeURIComponent(username.trim())}`);
  }

  async function addBadge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedKind = kind === "custom" ? customKind.trim() : kind;

    if (!activeProfile || !selectedKind || !label.trim()) {
      setMessage("Choose a badge kind and enter a label.");
      return;
    }

    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("admin_upsert_profile_badge", {
      p_username: activeProfile.username,
      p_kind: selectedKind,
      p_label: label.trim()
    });
    setBusy(false);

    if (error) {
      setMessage(`Could not save badge: ${error.message}`);
      return;
    }

    setLabel("");
    setMessage("Badge saved.");
    router.refresh();
  }

  async function updateBadge(badge: ManagedBadge, nextLabel: string) {
    if (!activeProfile) return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("admin_upsert_profile_badge", {
      p_username: activeProfile.username,
      p_kind: badge.kind,
      p_label: nextLabel.trim()
    });
    setBusy(false);

    if (error) {
      setMessage(`Could not update badge: ${error.message}`);
      return;
    }

    setMessage("Badge updated.");
    router.refresh();
  }

  async function deleteBadge(badge: ManagedBadge) {
    if (!activeProfile) return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("admin_delete_profile_badge", {
      p_username: activeProfile.username,
      p_kind: badge.kind
    });
    setBusy(false);

    if (error) {
      setMessage(`Could not remove badge: ${error.message}`);
      return;
    }

    setMessage("Badge removed.");
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-6">
      <form
        onSubmit={findProfile}
        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row"
      >
        <label className="sr-only" htmlFor="badge-profile-username">
          Profile username
        </label>
        <div className="flex min-w-0 flex-1 items-center rounded-xl border border-white/10 bg-black/20 px-3">
          <span className="text-sm text-white/40">/@</span>
          <input
            id="badge-profile-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="profile username"
            className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none"
            required
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/15"
        >
          Find profile
        </button>
      </form>

      {activeProfile && (
        <>
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-wider text-white/40">Selected profile</p>
            <h2 className="mt-2 text-lg font-semibold">{activeProfile.display_name}</h2>
            <p className="text-sm text-white/50">@{activeProfile.username}</p>
          </section>

          <form
            onSubmit={addBadge}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
          >
            <h2 className="text-lg font-semibold">Add or update a badge</h2>
            <label className="block text-sm text-white/65">
              Badge
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#111116] px-3 py-3 text-white"
              >
                {BUILT_IN_BADGES.map(([value, title]) => (
                  <option key={value} value={value}>{title}</option>
                ))}
                <option value="custom">Custom badge kind</option>
              </select>
            </label>
            {kind === "custom" && (
              <label className="block text-sm text-white/65">
                Custom kind
                <input
                  value={customKind}
                  onChange={(event) => setCustomKind(event.target.value)}
                  maxLength={40}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none"
                  required
                />
              </label>
            )}
            <label className="block text-sm text-white/65">
              Badge label
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                maxLength={40}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none"
                placeholder="For example, Developer"
                required
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-violet-300 px-5 py-3 text-sm font-semibold text-[#17131f] transition hover:bg-violet-200 disabled:opacity-50"
            >
              Save badge
            </button>
          </form>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-semibold">Current badges</h2>
            {badges.length === 0 ? (
              <p className="mt-3 text-sm text-white/45">No badges on this profile yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {badges.map((badge) => (
                  <li
                    key={badge.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white/40">{badge.kind}</p>
                      <p className="mt-1 font-medium">{badge.label}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          const nextLabel = window.prompt("New badge label", badge.label);
                          if (nextLabel !== null) void updateBadge(badge, nextLabel);
                        }}
                        className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`Remove the ${badge.label} badge?`)) {
                            void deleteBadge(badge);
                          }
                        }}
                        className="rounded-lg bg-red-400/10 px-3 py-2 text-sm text-red-200 hover:bg-red-400/15 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {username.trim() && !activeProfile && (
        <p className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">
          No profile found for that username.
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">
          {message}
        </p>
      )}
    </div>
  );
}
