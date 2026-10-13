"use client";

import { FormEvent, useState } from "react";
import { SUPPORT_EMAIL } from "@/lib/support";
import styles from "./contact-redesign.module.css";

export default function ContactForm() {
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [message,setMessage]=useState("");

  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const subject=encodeURIComponent(`MileVoxa support request from ${name || "customer"}`);
    const body=encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    window.location.href=`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      <div className={styles.twoColumn}>
        <label className={styles.field}>
          <span>Your Name</span>
          <input
            required
            value={name}
            onChange={event=>setName(event.target.value)}
            placeholder="John Doe"
            autoComplete="name"
          />
        </label>

        <label className={styles.field}>
          <span>Email Address</span>
          <input
            required
            type="email"
            value={email}
            onChange={event=>setEmail(event.target.value)}
            placeholder="driver@fleet.com"
            autoComplete="email"
          />
        </label>
      </div>

      <label className={styles.field}>
        <span>How can we help?</span>
        <textarea
          required
          rows={6}
          value={message}
          onChange={event=>setMessage(event.target.value)}
          placeholder="Tell us about your account, billing, privacy, product question, or feedback..."
        />
      </label>

      <div className={styles.formBottom}>
        <span className={styles.privacyNote}>
          🛡️ Your message opens in your device&apos;s email app and is sent
          directly to {SUPPORT_EMAIL}.
        </span>

        <button type="submit" className={styles.submit}>
          <span>Open Email Draft</span>
          <span>→</span>
        </button>
      </div>

      <small className={styles.fallback}>
        Fallback delivery uses your device&apos;s email app and sends the
        message to {SUPPORT_EMAIL}.
      </small>
    </form>
  );
}
