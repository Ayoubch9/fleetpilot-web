"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/app/home-redesign.module.css";

export default function HomepageStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 480);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className={`${styles.stickyCta} ${visible ? styles.stickyVisible : ""}`} aria-hidden={!visible}>
      <div className={styles.stickyInner}>
        <div className={styles.stickyCopy}>
          <span />
          <strong>Ready to organize your trucking business?</strong>
          <small>· Free during beta</small>
        </div>
        <Link href="/signup">Join Free Beta</Link>
      </div>
    </div>
  );
}
