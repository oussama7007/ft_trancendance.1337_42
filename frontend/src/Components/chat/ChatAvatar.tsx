import { useState } from "react";
import { initialOf } from "./chatUtils";
import { resolveMediaUrl } from "../../services/chatService";

interface ChatAvatarProps {
  name: string | null;
  avatarUrl?: string | null;
  online?: boolean;
  size?: "sm" | "md" | "lg";
  onlineLabel?: string;
  offlineLabel?: string;
}

const SIZES = {
  sm: "h-10 w-10 text-sm",
  md: "h-11 w-11 text-base",
  lg: "h-28 w-28 text-4xl",
};

export default function ChatAvatar({ name, avatarUrl, online, size = "md", onlineLabel, offlineLabel }: ChatAvatarProps) {
  const [broken, setBroken] = useState(false);
  const src = resolveMediaUrl(avatarUrl);
  const showImage = Boolean(src) && !broken;

  return (
    <div className="relative shrink-0">
      {showImage ? (
        <img
          src={src!}
          alt={name ?? ""}
          onError={() => setBroken(true)}
          referrerPolicy="no-referrer"
          className={`${SIZES[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`${SIZES[size]} flex items-center justify-center rounded-full bg-[var(--color-primary)] font-bold text-white`}
        >
          {initialOf(name)}
        </div>
      )}

      {online !== undefined && (
        <span
          title={online ? onlineLabel : offlineLabel}
          aria-label={online ? onlineLabel : offlineLabel}
          className={`absolute bottom-0 end-0 rounded-full border-2 border-[var(--color-surface)] ${
            size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"
          } ${online ? "bg-green-500" : "bg-gray-400"}`}
        />
      )}
    </div>
  );
}
