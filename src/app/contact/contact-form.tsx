"use client";

import { FormEvent, useState } from "react";
import { SUPPORT_EMAIL } from "@/lib/support";

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
    <form onSubmit={submit} className="fp-contact-form">
      <label>
        <span>Name</span>
        <input required value={name} onChange={e=>setName(e.target.value)} />
      </label>
      <label>
        <span>Email</span>
        <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} />
      </label>
      <label>
        <span>How can we help?</span>
        <textarea required rows={6} value={message} onChange={e=>setMessage(e.target.value)} />
      </label>
      <button type="submit" className="fp-marketing-button primary">Open Email Draft →</button>
      <small>
        Fallback delivery uses your device&apos;s email app and sends the
        message to {SUPPORT_EMAIL}.
      </small>
    </form>
  );
}
