"use client";

import { useState } from "react";

type ParsedLoad = {
  loadNumber?: string;
  broker?: string;
  pickup?: string;
  delivery?: string;
  pickupDate?: string;
  deliveryDate?: string;
  rate?: string;
};

function clean(text: string) {
  return text.replace(/\*\*/g, "").replace(/\r/g, "").trim();
}

function parseDispatcher(text: string): ParsedLoad {
  const raw = clean(text);

  const loadNumber = raw.match(/LOAD\s*ID\s*:\s*([A-Z0-9\-]+)/i)?.[1]?.trim();
  const rate = raw.match(/RATE\s*:\s*\$?\s*([\d,]+(?:\.\d+)?)/i)?.[1]?.replaceAll(",", "");

  const pickupLine = raw.match(/PU\s+(?:ADRESS|ADDRESS)(?:\s*\/\s*TIME)?\s*:\s*([^\n]+)/i)?.[1];
  const deliveryLine = raw.match(/DEL\s+(?:ADRESS|ADDRESS)(?:\s*\/\s*TIME)?\s*:\s*([^\n]+)/i)?.[1];

  function dateFrom(v?: string) {
    if (!v) return undefined;
    const m = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) return undefined;
    const mm = m[1].padStart(2, "0");
    const dd = m[2].padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }

  const lines = raw.split("\n").map((x) => x.trim()).filter(Boolean);

  function cityState(afterPattern: RegExp) {
    const idx = lines.findIndex((line) => afterPattern.test(line));
    if (idx < 0) return undefined;

    for (let i = idx + 1; i < Math.min(lines.length, idx + 8); i++) {
      const m = lines[i].match(/^(.+?)\s+([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/i);
      if (m) return `${m[1].replace(/\b\w/g, c => c.toUpperCase())}, ${m[2].toUpperCase()}`;
    }
    return undefined;
  }

  const pickup = cityState(/PU\s+(?:ADRESS|ADDRESS)/i);
  const delivery = cityState(/DEL\s+(?:ADRESS|ADDRESS)/i);

  let broker: string | undefined;
  if (/FEDEX/i.test(raw)) broker = "FEDEX";
  else if (/\bUPS\b/i.test(raw)) broker = "UPS";
  else if (/AMAZON/i.test(raw)) broker = "Amazon";
  else if (/WALMART/i.test(raw)) broker = "Walmart";

  return {
    loadNumber,
    broker,
    pickup,
    delivery,
    pickupDate: dateFrom(pickupLine),
    deliveryDate: dateFrom(deliveryLine),
    rate,
  };
}

export default function SmartLoadImport({
  onParsed,
}: {
  onParsed: (data: ParsedLoad) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  function parse() {
    const parsed = parseDispatcher(text);
    onParsed(parsed);
    setOpen(false);
  }

  return (
    <div className="md:col-span-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-[6px] border border-[#0787ff]/25 bg-[#1188ff]/10 px-3 py-2 text-[10px] font-black text-[#1188ff]"
      >
        {open ? "Close Smart Import" : "Smart Load Import"}
      </button>

      {open && (
        <div className="mt-4 rounded-[8px] border border-[#dce5ef] bg-[#f8fbfe] p-4">
          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste dispatcher message here..."
            className="w-full resize-y fp-field text-[11px]"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={parse}
              className="rounded-[6px] bg-[#1188ff] px-3 py-2 text-[10px] font-black"
            >
              Parse & Fill Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
