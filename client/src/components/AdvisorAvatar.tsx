import { Heart } from "lucide-react";

type AdvisorAvatarProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  showHeart?: boolean;
};

const sizeClasses = {
  sm: "h-8 w-8 text-lg",
  md: "h-10 w-10 text-xl",
  lg: "h-16 w-16 text-3xl",
} as const;

/** A warm, human advisor marker for Sally's community guidance. */
export function AdvisorAvatar({ size = "md", className = "", showHeart = true }: AdvisorAvatarProps) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-rose-200 to-violet-200 shadow-sm ring-2 ring-white ${sizeClasses[size]} ${className}`}
      role="img"
      aria-label="Sally, your friendly older-lady community advisor"
      data-testid="advisor-avatar"
      data-advisor-asset="sally-advisor"
    >
      <img
        src="/brand/sally-advisor_4c4cea71.jpg"
        alt="Sally, your friendly older-lady community advisor"
        className="h-full w-full rounded-full object-cover object-center"
      />
      {showHeart && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
          <Heart className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
