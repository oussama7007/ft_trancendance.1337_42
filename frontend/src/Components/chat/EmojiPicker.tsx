import { useEffect, useRef, useState } from "react";
import type { ChatTranslations } from "../../translations";

type CategoryKey = "recent" | "smileys" | "gestures" | "hearts" | "home" | "food" | "nature" | "objects" | "symbols";

const EMOJIS: Record<Exclude<CategoryKey, "recent">, string[]> = {
  smileys: [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
    "😘", "😋", "😛", "😜", "🤪", "🤗", "🤭", "🤫", "🤔", "🤐", "😐", "😑", "😶", "😏", "😒", "🙄",
    "😬", "😌", "😔", "😪", "😴", "😷", "🤒", "🥵", "🥶", "🥳", "😎", "🤓", "😕", "😟", "🙁", "😮",
    "😲", "😳", "🥺", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "😤", "😡", "🤯", "🫡",
  ],
  gestures: [
    "👍", "👎", "👌", "🤌", "✌️", "🤞", "🤟", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "👋",
    "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🫵", "👀", "🧠", "🙋", "🙆", "🙅", "🤷",
  ],
  hearts: [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
    "💘", "💝", "💯", "✨", "⭐", "🌟", "🔥", "🎉", "🎊", "🎁",
  ],
  home: [
    "🏠", "🏡", "🏢", "🏘️", "🏙️", "🏗️", "🏫", "🕌", "🏨", "🛏️", "🛋️", "🚪", "🪟", "🚿", "🛁", "🚽",
    "🧹", "🧺", "🔑", "🗝️", "📍", "🗺️", "🚗", "🚕", "🚌", "🚆", "🚲", "🛵", "✈️", "🧳", "🏖️", "⛰️",
  ],
  food: [
    "☕", "🍵", "🫖", "🥛", "🧃", "🥤", "🍞", "🥐", "🥖", "🧀", "🥚", "🍳", "🥗", "🍲", "🍕", "🍔",
    "🌮", "🍝", "🍜", "🍚", "🍗", "🥘", "🍰", "🎂", "🍪", "🍩", "🍫", "🍎", "🍊", "🍌", "🍉", "🍇",
  ],
  nature: [
    "☀️", "🌤️", "⛅", "🌧️", "⛈️", "❄️", "🌈", "🌙", "🌍", "🌳", "🌴", "🌵", "🌷", "🌹", "🌻", "🍀",
    "🐶", "🐱", "🐭", "🐰", "🦊", "🐻", "🐼", "🐨", "🦁", "🐮", "🐔", "🐧", "🐦", "🦋", "🐢", "🐟",
  ],
  objects: [
    "📱", "💻", "🖥️", "⌨️", "📷", "📞", "📺", "🔌", "💡", "🔋", "🧾", "💳", "💵", "💰", "📄", "📝",
    "📅", "📆", "⏰", "⌛", "📦", "✉️", "📧", "📎", "✂️", "🔒", "🔓", "🔧", "🔨", "🧰", "🪑", "📚",
  ],
  symbols: [
    "✅", "☑️", "✔️", "❌", "❎", "⚠️", "❗", "❓", "‼️", "⁉️", "🆗", "🆕", "🆓", "🔝", "🔜", "➕",
    "➖", "➡️", "⬅️", "⬆️", "⬇️", "🔄", "🔁", "⏩", "⏪", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫",
  ],
};

const TAB_ICON: Record<CategoryKey, string> = {
  recent: "🕘", smileys: "😀", gestures: "👍", hearts: "❤️", home: "🏠",
  food: "☕", nature: "🌳", objects: "💡", symbols: "✅",
};

const RECENT_KEY = "chat.recentEmojis";
const MAX_RECENT = 24;

function loadRecent(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
  }
}

interface EmojiPickerProps {
  t: ChatTranslations;
  onPick: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ t, onPick, onClose }: EmojiPickerProps) {
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const [category, setCategory] = useState<CategoryKey>(() => (loadRecent().length ? "recent" : "smileys"));
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    const onDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!panelRef.current?.contains(target) && !target.closest("[data-emoji-toggle]")) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  function pick(emoji: string) {
    const next = [emoji, ...recent.filter((item) => item !== emoji)].slice(0, MAX_RECENT);
    setRecent(next);
    saveRecent(next);
    onPick(emoji);
  }

  const tabs: CategoryKey[] = [
    ...(recent.length ? (["recent"] as CategoryKey[]) : []),
    "smileys", "gestures", "hearts", "home", "food", "nature", "objects", "symbols",
  ];
  const list = category === "recent" ? recent : EMOJIS[category];

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t.emoji.open}
      className="absolute bottom-full start-2 z-30 mb-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
    >
      <div role="tablist" className="flex gap-0.5 overflow-x-auto border-b border-[var(--color-border)] p-1.5">
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={category === key}
            aria-label={t.emoji[key]}
            title={t.emoji[key]}
            onClick={() => setCategory(key)}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg transition ${
              category === key ? "bg-[var(--color-accent-soft)]" : "hover:bg-[var(--color-background)]"
            }`}
          >
            {TAB_ICON[key]}
          </button>
        ))}
      </div>

      <p className="px-3 pt-2 text-xs font-semibold text-[var(--color-muted)]">{t.emoji[category]}</p>

      <div className="grid max-h-56 grid-cols-8 gap-0.5 overflow-y-auto p-2">
        {list.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => pick(emoji)}
            aria-label={emoji}
            className="flex h-9 w-full items-center justify-center rounded-lg text-xl transition hover:scale-110 hover:bg-[var(--color-background)]"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
