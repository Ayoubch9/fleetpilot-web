"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = {
  city: string;
  state: string;
  stateName: string;
  label: string;
};

export default function UsCityStateAutocomplete({
  name,
  label,
  value,
  setValue,
  className,
  inputClassName,
  required = false,
}: {
  name: string;
  label: string;
  value: string;
  setValue: (value: string) => void;
  className?: string;
  inputClassName?: string;
  required?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestId = useRef(0);

  const queryEligible = value.trim().length >= 2 && !/,\s*[A-Z]{2}$/i.test(value.trim());

  const [previousValue, setPreviousValue] = useState(value);
  if (previousValue !== value) {
    setPreviousValue(value);
    if (!queryEligible) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      setActiveIndex(-1);
    }
  }

  useEffect(() => {
    const query = value.trim();

    if (query.length < 2 || /,\s*[A-Z]{2}$/i.test(query)) {
      return;
    }

    const currentRequest = ++requestId.current;
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/us-cities?q=${encodeURIComponent(query)}`,
          { method: "GET" }
        );
        const data = (await response.json()) as {
          suggestions?: Suggestion[];
        };

        if (cancelled || currentRequest !== requestId.current) return;

        const next = data.suggestions || [];
        setSuggestions(next);
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        if (currentRequest !== requestId.current) return;
        setSuggestions([]);
        setOpen(false);
      } finally {
        if (!cancelled && currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    }, 120);

    return () => {
      window.clearTimeout(timer);
      cancelled = true;
    };
  }, [value]);

  function choose(item: Suggestion) {
    setValue(item.label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <label className={`fp-add-load-field fp-us-city-field ${className ?? ""}`.trim()}>
      <span>{label}</span>

      <div className="fp-us-city-autocomplete">
        <input
          name={name}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (event.target.value.trim().length >= 2) {
              setOpen(true);
            }
          }}
          onFocus={() => {
            if (value.trim().length >= 2 && suggestions.length) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(event) => {
            if (!open || !queryEligible || suggestions.length === 0) return;

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) =>
                Math.min(index + 1, suggestions.length - 1)
              );
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            }

            if (event.key === "Enter" && activeIndex >= 0) {
              event.preventDefault();
              choose(suggestions[activeIndex]);
            }

            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          autoComplete="off"
          className={`fp-add-load-control ${inputClassName ?? ""}`.trim()}
          required={required}
          role="combobox"
          aria-controls={`${name}-suggestions`}
          aria-activedescendant={open && queryEligible && activeIndex >= 0 ? `${name}-suggestion-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-expanded={open && queryEligible}
        />

        {loading && queryEligible && (
          <span className="fp-us-city-loading">Searching…</span>
        )}

        {open && queryEligible && (
          <div id={`${name}-suggestions`} className="fp-us-city-suggestions" role="listbox">
            {suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <button
                  key={`${item.city}-${item.state}-${index}`}
                  type="button"
                  id={`${name}-suggestion-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  className={
                    activeIndex === index ? "active" : undefined
                  }
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item)}
                >
                  <strong>{item.city}</strong>
                  <span>
                    {item.state}
                    <small>{item.stateName}</small>
                  </span>
                </button>
              ))
            ) : !loading ? (
              <div className="fp-us-city-empty">
                No U.S. city matches “{value.trim()}”
              </div>
            ) : null}
          </div>
        )}
      </div>

      <small className="fp-us-city-help">
        Type at least 2 letters, then choose a U.S. city and state.
      </small>
    </label>
  );
}
