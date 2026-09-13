"use client";

import { useEffect, useState } from "react";

type ParsedLoad = {
  loadNumber?: string;
  referenceNumber?: string;
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
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const loadNumber =
    raw.match(/LOAD\s*(?:ID|#)\s*:\s*([A-Z0-9\-]+)/i)?.[1]?.trim();

  const referenceNumber =
    raw.match(/REF(?:ERENCE)?\s*#?\s*:\s*([^\n]+)/i)?.[1]?.trim();

  const rate = raw
    .match(/RATE\s*:\s*\$?\s*([\d,]+(?:\.\d+)?)/i)?.[1]
    ?.replaceAll(",", "");

  const pickupHeaderIndex = lines.findIndex((line) =>
    /^(?:PU|PICKUP)\s+(?:ADRESS|ADDRESS)(?:\s*\/\s*TIME)?\s*:/i.test(line)
  );
  const deliveryHeaderIndex = lines.findIndex((line) =>
    /^(?:DEL|DELIVERY)\s+(?:ADRESS|ADDRESS)(?:\s*\/\s*TIME)?\s*:/i.test(line)
  );

  function dateFromHeader(index: number) {
    if (index < 0) return undefined;
    const header = lines[index];
    const match = header.match(
      /(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+\d{1,2}:\d{2})?/
    );
    if (!match) return undefined;
    return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(
      2,
      "0"
    )}`;
  }

  function sectionLines(startIndex: number, endIndex: number) {
    if (startIndex < 0) return [];
    const end =
      endIndex > startIndex ? endIndex : Math.min(lines.length, startIndex + 9);
    return lines.slice(startIndex + 1, end);
  }

  function cityState(section: string[]) {
    for (const line of [...section].reverse()) {
      const match = line.match(
        /^(.+?)\s+([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/i
      );
      if (!match) continue;

      const city = match[1]
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

      return `${city}, ${match[2].toUpperCase()}`;
    }
    return undefined;
  }

  const pickupSection = sectionLines(
    pickupHeaderIndex,
    deliveryHeaderIndex
  );
  const deliverySection = sectionLines(deliveryHeaderIndex, lines.length);

  const pickup = cityState(pickupSection);
  const delivery = cityState(deliverySection);

  const companyCandidates = [
    ...pickupSection,
    ...deliverySection,
  ].filter(
    (line) =>
      !/^\d/.test(line) &&
      !/^[A-Z0-9 .'-]+\s+[A-Z]{2}(?:\s+\d{5})?$/i.test(line)
  );

  let broker: string | undefined;
  const companyText = companyCandidates.join(" ");

  if (/FEDEX(?:\s+GROUND)?/i.test(companyText)) {
    broker = "FedEx Ground";
  } else if (/\bUPS\b/i.test(companyText)) {
    broker = "UPS";
  } else if (/AMAZON/i.test(companyText)) {
    broker = "Amazon";
  } else if (/WALMART/i.test(companyText)) {
    broker = "Walmart";
  }

  return {
    loadNumber,
    referenceNumber,
    broker,
    pickup,
    delivery,
    pickupDate: dateFromHeader(pickupHeaderIndex),
    deliveryDate: dateFromHeader(deliveryHeaderIndex),
    rate,
  };
}

export default function SmartLoadImport({
  onParsed,
  openSignal = 0,
}: {
  onParsed: (data: ParsedLoad) => void;
  openSignal?: number;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (openSignal > 0) setOpen(true);
  }, [openSignal]);

  function parse() {
    const parsed = parseDispatcher(text);
    onParsed(parsed);
    setOpen(false);
  }

  return (
    <div className="fp-smart-load-import md:col-span-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fp-smart-load-trigger"
      >
        {open ? "Close Telegram Import" : "Paste Telegram Load"}
      </button>

      {open && (
        <div className="fp-smart-load-panel">
          <div className="fp-telegram-import-help">
            Paste the dispatcher load message from Telegram. FleetPilot will extract the load ID, route, dates, customer and rate automatically.
          </div>
          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste the Telegram load message here…

Example:
Load ID : 012814
REF # 12705518 / 23465407
PU ADRESS / TIME : 07/30/2026 09:00
...
DEL ADRESS / TIME : 08/01/2026 14:29
...
RATE : $7500.00`}
            className="fp-smart-load-textarea"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={parse}
              className="fp-smart-load-parse"
            >
              Read Message & Fill Load
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
