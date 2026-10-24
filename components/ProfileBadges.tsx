import {
  BadgeCheck,
  Cat,
  CircleStar,
  Code2,
  Crown,
  Infinity,
  Sparkles,
  type LucideIcon,
  type LucideProps
} from "lucide-react";
import type { CSSProperties } from "react";
import type { ProfileBadge } from "@/types/profile";

/*
For the simpler admin interface, sign in as @whatthefuck and visit
/admin/badges after applying migration 013. SQL Editor instructions follow as
an alternative. Migrations 011 and 012 must also be applied first. Replace
'account' with the profile's exact username.

Add a badge:
INSERT INTO public.profile_badges (profile_id, kind, label)
SELECT id, 'custom-kind', 'Custom label'
FROM public.profiles
WHERE username = 'account'
ON CONFLICT (profile_id, kind) DO UPDATE SET label = EXCLUDED.label;

Add multiple badges to one profile at once:
INSERT INTO public.profile_badges (profile_id, kind, label)
SELECT p.id, badge.kind, badge.label
FROM public.profiles p
CROSS JOIN (VALUES
  ('founder', 'Founder'),
  ('developer', 'Developer'),
  ('the-one-and-only', 'The One and Only')
) AS badge(kind, label)
WHERE p.username = 'account'
ON CONFLICT (profile_id, kind) DO UPDATE SET label = EXCLUDED.label;

Modify its displayed label:
UPDATE public.profile_badges b
SET label = 'Updated label'
FROM public.profiles p
WHERE b.profile_id = p.id
  AND p.username = 'account'
  AND b.kind = 'custom-kind';

Delete a badge:
DELETE FROM public.profile_badges b
USING public.profiles p
WHERE b.profile_id = p.id
  AND p.username = 'account'
  AND b.kind = 'custom-kind';

Remove an old creator badge from one profile:
DELETE FROM public.profile_badges b
USING public.profiles p
WHERE b.profile_id = p.id
  AND p.username = 'account'
  AND b.kind = 'creator';

Built-in kinds: verified, founder, early, official-demo, developer, friends,
first-user-except-founder, and the-one-and-only. Custom kinds must be 1-40
characters. Add a matching entry to BADGE_STYLES to choose its icon and color;
otherwise the badge uses the default Sparkles icon and color. Labels must be
1-40 characters. Changing a badge kind also requires updating the matching
BADGE_STYLES entry.
*/

function BowTieIcon({
  size = 24,
  strokeWidth = 2,
  ...props
}: LucideProps) {
  return (
    <svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7.5 11.5 12 3 16.5V7.5Z" />
      <path d="m21 7.5-8.5 4.5 8.5 4.5V7.5Z" />
    </svg>
  );
}

const BADGE_STYLES: Record<
  string,
  { Icon: LucideIcon | typeof BowTieIcon; color: string }
> = {
  verified: { Icon: BadgeCheck, color: "#60d8ff" },
  founder: { Icon: Crown, color: "#ff65d8" },
  early: { Icon: CircleStar, color: "#ffd45c" },
  "official-demo": { Icon: Sparkles, color: "#ffbd59" },
  developer: { Icon: Code2, color: "#69e6b3" },
  friends: { Icon: Cat, color: "#ff9bcf" },
  "first-user-except-founder": { Icon: BowTieIcon, color: "#ef4444" },
  "the-one-and-only": { Icon: Infinity, color: "#c4a1ff" }
};

export default function ProfileBadges({ badges }: { badges: ProfileBadge[] }) {
  const visibleBadges = badges
    .filter((badge) => badge.is_visible && badge.kind !== "creator")
    .sort((left, right) => left.position - right.position);
  if (visibleBadges.length === 0) return null;

  return (
    <div className="profile-badges flex items-center gap-1">
      {visibleBadges.map((badge) => {
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
