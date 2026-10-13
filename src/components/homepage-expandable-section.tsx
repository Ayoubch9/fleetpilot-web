"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import styles from "@/app/home-redesign.module.css";

type Props = {
  id: string;
  aliasIds?: string[];
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
};

const EVENT_NAME = "milevoxa:homepage-expand";

export default function HomepageExpandableSection({
  id,
  aliasIds = [],
  eyebrow,
  title,
  summary,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const matchesHash = useCallback(
    (hash: string) => {
      const clean = hash.replace(/^#/, "");
      return clean === id || aliasIds.includes(clean);
    },
    [aliasIds, id]
  );

  const openAndFocus = useCallback(
    (scroll = true) => {
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, {
          detail: { id },
        })
      );
      setOpen(true);

      if (scroll) {
        window.requestAnimationFrame(() => {
          shellRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    },
    [id]
  );

  useEffect(() => {
    function onExclusiveOpen(event: Event) {
      const customEvent = event as CustomEvent<{ id?: string }>;
      if (customEvent.detail?.id !== id) {
        setOpen(false);
      }
    }

    function onHashChange() {
      if (matchesHash(window.location.hash)) {
        openAndFocus(true);
      }
    }

    window.addEventListener(EVENT_NAME, onExclusiveOpen);
    window.addEventListener("hashchange", onHashChange);

    const frame = window.requestAnimationFrame(() => {
      if (matchesHash(window.location.hash)) openAndFocus(false);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(EVENT_NAME, onExclusiveOpen);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [id, matchesHash, openAndFocus]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }

    openAndFocus(true);
  }

  return (
    <div
      id={id}
      ref={shellRef}
      className={`${styles.expandableShell} ${open ? styles.expandableOpen : ""}`}
      data-home-expandable
    >
      <button
        type="button"
        className={styles.expandableTrigger}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`${id}-content`}
      >
        <span className={styles.expandableCopy}>
          <small>{eyebrow}</small>
          <strong>{title}</strong>
          <span>{summary}</span>
        </span>

        <span className={styles.expandableAction}>
          <span>{open ? "Hide" : "More"}</span>
          <b aria-hidden="true">{open ? "−" : "+"}</b>
        </span>
      </button>

      <div
        id={`${id}-content`}
        className={styles.expandableContent}
        hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}
