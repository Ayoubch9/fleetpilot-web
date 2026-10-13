"use client";

import {
  createEmptyLoadStop,
  LoadStop,
  LoadStopKind,
} from "@/lib/load-stops";
import UsCityStateAutocomplete from "./us-city-state-autocomplete";

export default function LoadStopsEditor({
  stops,
  onChange,
}: {
  stops: LoadStop[];
  onChange: (stops: LoadStop[]) => void;
}) {
  function update(index: number, patch: Partial<LoadStop>) {
    onChange(stops.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (index <= 0 || index >= stops.length - 1 || target <= 0 || target >= stops.length - 1) return;
    const next = [...stops];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addStop() {
    const next = [...stops];
    next.splice(next.length - 1, 0, createEmptyLoadStop());
    onChange(next);
  }

  function removeStop(index: number) {
    if (index <= 0 || index >= stops.length - 1) return;
    onChange(stops.filter((_, i) => i !== index));
  }

  return (
    <section className="mv-load-stop-editor" aria-label="Load route stops">
      <div className="mv-load-stop-heading">
        <div>
          <span>ROUTE</span>
          <strong>{stops.length} stops</strong>
        </div>
        <button type="button" onClick={addStop} disabled={stops.length >= 20}>
          + Add stop
        </button>
      </div>

      {stops.map((stop, index) => {
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;
        return (
          <article className="mv-load-stop-card" key={stop.id}>
            <div className="mv-load-stop-card-heading">
              <span className="mv-load-stop-number">{index + 1}</span>
              <strong>{isFirst ? "Pickup" : isLast ? "Final delivery" : "Stop"}</strong>
              <div className="mv-load-stop-actions">
                {!isFirst && !isLast && (
                  <>
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 1} aria-label={`Move stop ${index + 1} up`}>↑</button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === stops.length - 2} aria-label={`Move stop ${index + 1} down`}>↓</button>
                    <button type="button" onClick={() => removeStop(index)} aria-label={`Remove stop ${index + 1}`}>Remove</button>
                  </>
                )}
              </div>
            </div>

            <div className="mv-load-stop-fields">
              {!isFirst && !isLast && (
                <label className="fp-add-load-field">
                  <span>Stop type</span>
                  <select
                    value={stop.kind}
                    onChange={(event) => update(index, { kind: event.target.value as LoadStopKind })}
                    className="fp-add-load-control"
                  >
                    <option value="STOP">Intermediate stop</option>
                    <option value="PICKUP">Pickup</option>
                    <option value="DELIVERY">Delivery</option>
                  </select>
                </label>
              )}
              <label className="fp-add-load-field">
                <span>Facility / customer</span>
                <input
                  value={stop.facility}
                  onChange={(event) => update(index, { facility: event.target.value })}
                  className="fp-add-load-control"
                  placeholder="Company or facility name"
                />
              </label>
              <UsCityStateAutocomplete
                name={`route-stop-${stop.id}-location`}
                label="City/state *"
                value={stop.location}
                setValue={(value) => update(index, { location: value })}
                className="mv-load-stop-location"
                inputClassName="mv-load-stop-city-input"
                required
              />
              <label className="fp-add-load-field">
                <span>Appointment date{isFirst || isLast ? " *" : ""}</span>
                <input
                  type="date"
                  value={stop.appointmentDate}
                  onChange={(event) => update(index, { appointmentDate: event.target.value })}
                  className="fp-add-load-control"
                  required={isFirst || isLast}
                />
              </label>
              <label className="fp-add-load-field mv-load-stop-location">
                <span>Handling instructions</span>
                <input
                  value={stop.instructions}
                  onChange={(event) => update(index, { instructions: event.target.value })}
                  className="fp-add-load-control"
                  placeholder="Example: Drop empty trailer, hook loaded trailer"
                />
              </label>
            </div>
          </article>
        );
      })}
    </section>
  );
}
