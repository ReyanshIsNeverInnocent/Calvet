import { BadgeCheck, CircleStar, Crown, Sparkles, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import type { ProfileBadge } from "@/types/profile";

// Add a custom kind to BADGE_STYLES, then issue it in Supabase SQL Editor
// (after migration 012):
// INSERT INTO public.profile_badges (profile_id, kind, label)
// SELECT id, 'custom-kind', 'Custom label' FROM public.profiles
// WHERE username = 'account';
// To remove it, DELETE FROM public.profile_badges b
// USING public.profiles p
// WHERE b.profile_id = p.id AND p.username = 'account'
//   AND b.kind = 'custom-kind';
const BADGE_STYLES: Record<string, { Icon: LucideIcon; color: string }> = {
  verified: { Icon: BadgeCheck, color: "#60d8ff" },
  creator: { Icon: Sparkles, color: "#ff65d8" },
  early: { Icon: CircleStar, color: "#ffd45c" },
  "official-demo": { Icon: Crown, color: "#ffbd59" }
};

export default function ProfileBadges({ badges }: { badges: ProfileBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="profile-badges flex items-center gap-1">
      {badges.map((badge) => {
        const { Icon, color } = BADGE_STYLES[badge.kind] ?? {
          Icon: Sparkles,
          color: "#a99bff"
        };

        return (
          <span
            key={badge.id}
            className="profile-detail-tooltip profile-badge-tooltip"
          >
            <span
              tabIndex={0}
              aria-label={`${badge.label} badge`}
              aria-describedby={`profile-badge-tooltip-${badge.id}`}
              className="profile-badge-icon"
              style={{ "--badge-color": color } as CSSProperties}
            >
              <Icon aria-hidden="true" size={17} strokeWidth={2.4} />
            </span>
            <span
              id={`profile-badge-tooltip-${badge.id}`}
              role="tooltip"
              className="profile-detail-tooltip-popover"
            >
              {badge.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}
