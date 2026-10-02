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
}: {
  name: string;
  label: string;
  value: string;
  setValue: (value: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestId = useRef(0);

  useEffect(() => {
    const query = value.trim();

    if (query.length < 2 || /,\s*[A-Z]{2}$/i.test(query)) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/us-cities?q=${encodeURIComponent(query)}`,
          { method: "GET" }
        );
        const data = (await response.json()) as {
          suggestions?: Suggestion[];
        };

        if (currentRequest !== requestId.current) return;

        const next = data.suggestions || [];
        setSuggestions(next);
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        if (currentRequest !== requestId.current) return;
        setSuggestions([]);
        setOpen(false);
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [value]);

  function choose(item: Suggestion) {
    setValue(item.label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <label className="fp-add-load-field fp-us-city-field">
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
            if (!open || suggestions.length === 0) return;

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
          className="fp-add-load-control"
          aria-autocomplete="list"
          aria-expanded={open}
        />

        {loading && (
          <span className="fp-us-city-loading">Searching…</span>
        )}

        {open && (
          <div className="fp-us-city-suggestions" role="listbox">
            {suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <button
                  key={`${item.city}-${item.state}-${index}`}
                  type="button"
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
