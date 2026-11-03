import type { AvatarColor, BotShape } from "@/lib/agents/model";

const text: Record<AvatarColor, string> = {
  mint: "text-avatar-mint",
  amber: "text-avatar-amber",
  iris: "text-avatar-iris",
  blue: "text-avatar-blue",
  coral: "text-avatar-coral",
  violet: "text-avatar-violet",
};

function Face({ color, className }: { color: AvatarColor; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`${text[color]} ${className ?? "size-9"}`} aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="currentColor" />
      <circle cx="14" cy="18" r="1.6" fill="#fff" />
      <circle cx="26" cy="18" r="1.6" fill="#fff" />
      <path d="M14 24.5c1.8 2.4 10.2 2.4 12 0" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Triangle({ color, className }: { color: AvatarColor; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`${text[color]} ${className ?? "size-9"}`} aria-hidden="true">
      <polygon points="20,3 37.5,36 2.5,36" fill="currentColor" />
      <circle cx="15" cy="24" r="1.4" fill="#fff" />
      <circle cx="25" cy="24" r="1.4" fill="#fff" />
      <path d="M15.2 28.2c1.4 1.8 8.2 1.8 9.6 0" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BotMark({
  color,
  shape,
  members,
  className,
}: {
  color: AvatarColor;
  shape: BotShape;
  members?: AvatarColor[];
  className?: string;
}) {
  if (shape === "group") {
    const a = members?.[0] ?? "mint";
    const b = members?.[1] ?? "violet";
    return (
      <span className={`relative block size-9 shrink-0 ${className ?? ""}`}>
        <Face color={a} className="absolute top-0 left-0 size-6" />
        <Face color={b} className="absolute right-0 bottom-0 size-6" />
      </span>
    );
  }
  if (shape === "triangle") return <Triangle color={color} className={className ?? "size-9 shrink-0"} />;
  return <Face color={color} className={className ?? "size-9 shrink-0"} />;
}
