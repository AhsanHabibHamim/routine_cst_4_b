// Schedules today's class alerts on ntfy.sh. Runs once a day from GitHub Actions.
// ntfy holds each message and delivers it to your phone at the exact time.
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync(new URL("../routine.json", import.meta.url)));
const TOPIC = process.env.NTFY_TOPIC, DRY = !!process.env.DRY_RUN || !TOPIC;
const LEAD = 5, TZ = 6 * 3600e3; // Dhaka is UTC+6, no daylight saving
const now = Date.now(), dh = new Date(now + TZ);
const day = process.env.DAY !== undefined ? +process.env.DAY : dh.getUTCDay();
const midnight = Date.UTC(dh.getUTCFullYear(), dh.getUTCMonth(), dh.getUTCDate()) - TZ;
const hm = m => { const h = Math.floor(m / 60), n = m % 60; return (h > 12 ? h - 12 : h) + ":" + String(n).padStart(2, "0"); };
if (day > 4) { console.log("No classes today (Fri/Sat)."); process.exit(0); }
const slots = R.slots[day].map(([p, n, k]) => ({ a: R.start + p * R.period, b: R.start + (p + n) * R.period, k }));
async function send(m, title, message, tags) {
  const ts = midnight + m * 60000;
  if (!process.env.ALL && (ts < now + 15000 || ts > now + 72 * 3600e3)) return;
  if (DRY) { console.log(hm(m).padStart(5), "|", title, "|", message); return; }
  const r = await fetch("https://ntfy.sh/", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: TOPIC, title, message, tags, priority: 4, delay: String(Math.round(ts / 1000)) }) });
  if (!r.ok) throw new Error(r.status + " " + await r.text());
}
for (const [i, s] of slots.entries()) {
  const back = slots[i - 1] && slots[i - 1].b === s.a; // previous class ends right as this one starts
  const sub = R.subjects[s.k], tm = hm(s.a) + " – " + hm(s.b);
  const nx = slots.find(x => x.a >= s.b), nn = nx && R.subjects[nx.k];
  if (!back) await send(s.a - LEAD, `${sub.name} in ${LEAD} min`, `${tm} · ${sub.teacher}`, ["alarm_clock"]);
  await send(s.a, `${sub.name} has started`, `${tm} · ${sub.teacher} · ends ${hm(s.b)}`, ["arrow_forward"]);
  await send(s.b - LEAD, `${LEAD} min left: ${sub.name}`, sub.teacher + (nn ? ` · next: ${nn.name} at ${hm(nx.a)}` : ""), ["hourglass_flowing_sand"]);
  if (!(nx && nx.a === s.b)) await send(s.b, `${sub.name} ended`, nn ? `Next: ${nn.name} at ${hm(nx.a)} · ${nn.teacher}` : "No more classes today.", ["white_check_mark"]);
}
console.log(DRY ? "Dry run done." : "Scheduled today's alerts on ntfy.");
