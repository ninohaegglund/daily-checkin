import { useRef, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

type TagPickerProps<Option extends string> = {
  options: Option[];
  value: Option[];
  onChange: (next: Option[]) => void;
  placeholder?: string;
  labelFormatter?: (opt: Option) => string;
};

export default function TagPicker<Option extends string>({
  options,
  value,
  onChange,
  placeholder = "Search or add...",
  labelFormatter,
}: TagPickerProps<Option>) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const formatted = (opt: Option) =>
    labelFormatter ? labelFormatter(opt) : opt.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

  const q = query.trim().toLowerCase();
  const baseOptions = options.filter((option) => !value.includes(option));
  const filtered = q
    ? baseOptions.filter((option) => formatted(option).toLowerCase().includes(q))
    : baseOptions;
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, filtered.length - 1));

  const addTag = (option: Option) => {
    if (!value.includes(option)) onChange([...value, option]);
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();
  };

  const removeTag = (option: Option) => {
    onChange(value.filter((item) => item !== option));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(0, filtered.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (filtered[safeActiveIndex]) addTag(filtered[safeActiveIndex]);
    } else if (event.key === "Backspace" && query.length === 0 && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (event.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div className="tag-picker">
      <div className="tag-list">
        {value.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => removeTag(item)}
            className="tag-chip"
            aria-label={`Remove ${formatted(item)}`}
          >
            {formatted(item)}
            <X className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      <div className="tag-input-wrap">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder={placeholder}
          className="tag-input"
        />

        {focused && filtered.length > 0 && (
          <ul className="tag-menu">
            {filtered.map((option, index) => (
              <li
                key={option}
                className={index === safeActiveIndex ? "tag-option tag-option--active" : "tag-option"}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  addTag(option);
                }}
              >
                {formatted(option)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
