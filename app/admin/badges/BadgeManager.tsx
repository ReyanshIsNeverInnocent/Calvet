"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import type { SpecialAccount } from "./page";

export type ManagedBadge = {
  id: string;
  kind: string;
  label: string;
  is_visible: boolean;
  position: number;
};

type BadgeManagerProps = {
  initialUsername: string;
  initialPanel: "badges" | "special-accounts";
  profile: { username: string; display_name: string } | null;
  badges: ManagedBadge[];
  specialAccounts: SpecialAccount[];
};

const BUILT_IN_BADGES = [
  ["verified", "Verified"],
  ["founder", "Founder"],
  ["early", "Early"],
  ["official-demo", "Official Demo"],
  ["developer", "Developer"],
  ["friends", "Friends"],
  ["first-user-except-founder", "First User (except the founder)"],
  ["diva", "Diva"],
  ["the-one-and-only", "The One and Only"]
] as const;

export default function BadgeManager({
  initialUsername,
  initialPanel,
  profile,
  badges,
  specialAccounts: initialSpecialAccounts
}: BadgeManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [managedBadges, setManagedBadges] = useState(badges);
  const [specialAccounts, setSpecialAccounts] = useState(initialSpecialAccounts);
  const [draggedBadgeId, setDraggedBadgeId] = useState<string | null>(null);
  const [username, setUsername] = useState(initialUsername);
  const [activePanel, setActivePanel] =
    useState<"badges" | "special-accounts">(initialPanel);
  const [kind, setKind] = useState<string>(BUILT_IN_BADGES[0][0]);
  const [customKind, setCustomKind] = useState("");
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const activeProfile =
    profile && username.trim().toLowerCase() === profile.username ? profile : null;
  const activeProfileIsSpecial = Boolean(
    activeProfile &&
      specialAccounts.some((account) => account.username === activeProfile.username)
  );

  async function saveBadgePreferences(nextBadges: ManagedBadge[]) {
    if (!activeProfile) return;

    const previousBadges = managedBadges;
    const orderedBadges = nextBadges.map((badge, position) => ({
      ...badge,
      position
    }));
    setManagedBadges(orderedBadges);
    setBusy(true);
    setMessage("");

    const { error } = await supabase.rpc(
      "admin_update_profile_badge_preferences",
      {
        p_username: activeProfile.username,
        p_preferences: orderedBadges.map(({ id, is_visible, position }) => ({
          id,
          is_visible,
          display_order: position
        }))
      }
    );
    setBusy(false);

    if (error) {
      setManagedBadges(previousBadges);
      setMessage(`Could not save badge settings: ${error.message}`);
      return;
    }

    setMessage("Badge settings saved.");
    router.refresh();
  }

  function findProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    router.push(
      `/admin/badges?username=${encodeURIComponent(username.trim())}&panel=${activePanel}`
    );
  }

  async function setSpecialAccess(enabled: boolean) {
    if (!activeProfile) return;

    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("admin_set_special_account", {
      p_username: activeProfile.username,
      p_enabled: enabled
    });
    setBusy(false);

    if (error) {
      setMessage(`Could not ${enabled ? "grant" : "revoke"} special access: ${error.message}`);
      return;
    }

    setSpecialAccounts((accounts) =>
      enabled
        ? [
            {
              profile_id: "",
              username: activeProfile.username,
              display_name: activeProfile.display_name,
              granted_at: new Date().toISOString()
            },
            ...accounts.filter((account) => account.username !== activeProfile.username)
          ]
        : accounts.filter((account) => account.username !== activeProfile.username)
    );
    setMessage(
      enabled
        ? `Special access granted to @${activeProfile.username}.`
        : `Special access revoked from @${activeProfile.username}.`
    );
    router.refresh();
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
      <nav
        aria-label="Developer tools"
        className="grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.035] p-1"
      >
        {([
          ["badges", "Profile badges"],
          ["special-accounts", "Special accounts"]
        ] as const).map(([panel, title]) => (
          <button
            key={panel}
            type="button"
            aria-pressed={activePanel === panel}
            onClick={() => setActivePanel(panel)}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activePanel === panel
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {title}
          </button>
        ))}
      </nav>

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

      {activeProfile && activePanel === "badges" && (
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
            {managedBadges.length === 0 ? (
              <p className="mt-3 text-sm text-white/45">No badges on this profile yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {managedBadges.map((badge, index) => (
                  <li
                    key={badge.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (!draggedBadgeId || busy) return;

                      const fromIndex = managedBadges.findIndex(
                        (item) => item.id === draggedBadgeId
                      );
                      if (fromIndex < 0 || fromIndex === index) return;

                      const reordered = [...managedBadges];
                      const [draggedBadge] = reordered.splice(fromIndex, 1);
                      reordered.splice(index, 0, draggedBadge);
                      setDraggedBadgeId(null);
                      void saveBadgePreferences(reordered);
                    }}
                    className={`flex flex-col gap-3 rounded-xl border border-white/10 p-3 transition sm:flex-row sm:items-center ${
                      draggedBadgeId === badge.id ? "opacity-45" : ""
                    }`}
                  >
                    <button
                      type="button"
                      draggable={!busy}
                      aria-label={`Drag to reorder ${badge.label}, position ${index + 1}`}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        setDraggedBadgeId(badge.id);
                      }}
                      onDragEnd={() => setDraggedBadgeId(null)}
                      className="cursor-grab self-start text-white/40 hover:text-white/80 active:cursor-grabbing sm:self-auto"
                    >
                      <GripVertical size={18} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white/40">{badge.kind}</p>
                      <p className="mt-1 font-medium">{badge.label}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="mr-1 flex items-center gap-2 text-xs text-white/65">
                        <input
                          type="checkbox"
                          checked={badge.is_visible}
                          disabled={busy}
                          onChange={(event) => {
                            void saveBadgePreferences(
                              managedBadges.map((item) =>
                                item.id === badge.id
                                  ? { ...item, is_visible: event.target.checked }
                                  : item
                              )
                            );
                          }}
                          className="h-4 w-4 accent-violet-300"
                        />
                        Visible
                      </label>
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

      {activePanel === "special-accounts" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
              Music entitlement
            </p>
            <h2 className="mt-2 text-lg font-semibold">Special accounts</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              Special accounts can add as many profile songs as they need. Choose a profile above to grant or revoke access.
            </p>
            {activeProfile && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <div>
                  <p className="font-medium">{activeProfile.display_name}</p>
                  <p className="text-sm text-white/45">@{activeProfile.username}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {activeProfileIsSpecial
                      ? "Special access is enabled"
                      : "Standard account · up to 3 songs"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void setSpecialAccess(!activeProfileIsSpecial)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                    activeProfileIsSpecial
                      ? "border border-red-300/20 bg-red-300/10 text-red-100 hover:bg-red-300/15"
                      : "bg-violet-300 text-[#17131f] hover:bg-violet-200"
                  }`}
                >
                  {activeProfileIsSpecial ? "Revoke access" : "Grant special access"}
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Access list</h2>
                <p className="mt-1 text-sm text-white/45">
                  {specialAccounts.length} account{specialAccounts.length === 1 ? "" : "s"} with expanded song access
                </p>
              </div>
            </div>
            {specialAccounts.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/45">
                No special accounts have been granted access.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-white/[0.08]">
                {specialAccounts.map((account) => (
                  <li
                    key={account.username}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{account.display_name}</p>
                      <p className="text-xs text-white/45">@{account.username}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername(account.username);
                        router.push(
                          `/admin/badges?username=${encodeURIComponent(account.username)}&panel=special-accounts`
                        );
                      }}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.06]"
                    >
                      Manage account
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
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
