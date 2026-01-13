import { useEffect, useMemo, useRef, useState } from "react";

type TagPickerProps = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  labelFormatter?: (opt: string) => string;
};

export default function TagPicker({ options, value, onChange, placeholder = "Search or add…", labelFormatter }: TagPickerProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const formatted = (opt: string) => (labelFormatter ? labelFormatter(opt) : opt.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = options.filter((o) => !value.includes(o));
    if (!q) return base;
    return base.filter((o) => formatted(o).toLowerCase().includes(q));
  }, [options, value, query]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(Math.max(0, filtered.length - 1));
  }, [filtered.length, activeIndex]);

  const addTag = (opt: string) => {
    if (!value.includes(opt)) onChange([...value, opt]);
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();
  };

  const removeTag = (opt: string) => {
    onChange(value.filter((v) => v !== opt));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) addTag(filtered[activeIndex]);
    } else if (e.key === "Backspace" && query.length === 0 && value.length > 0) {
      // Remove last tag when input is empty
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div className="w-full">
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => removeTag(v)}
            className="px-2 py-1 text-sm rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            aria-label={`Remove ${formatted(v)}`}
          >
            {formatted(v)}
            <span className="ml-1 text-emerald-600">×</span>
          </button>
        ))}
      </div>

      {/* Input + list */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder={placeholder}
          className="w-full p-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />

        {focused && filtered.length > 0 && (
          <ul className="absolute z-10 mt-2 w-full max-h-40 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
            {filtered.map((opt, i) => (
              <li
                key={opt}
                className={`px-3 py-2 text-sm cursor-pointer ${i === activeIndex ? "bg-emerald-50" : ""}`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => { e.preventDefault(); addTag(opt); }}
              >
                {formatted(opt)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
