# CST Class Matrix

Offline-first PWA class routine (Computer Technology · Sem 4 · Group B) with class alerts.

## Files
```
index.html  routine.json  manifest.webmanifest  sw.js
icons/  scripts/schedule-alerts.mjs  .github/workflows/class-alerts.yml
```
`routine.json` is the single source for both the app and the alert script. Edit it to change the routine,
then bump the version in `sw.js` (`cst-matrix-v2` → `v3`) so phones pick up the update.

## 1. Go live (GitHub Pages)
Push everything to `main` → Settings → Pages → Deploy from a branch → `main` / root.
Open `https://<username>.github.io/<repo>/` once while online, then install it (Android: Install app, iPhone: Share → Add to Home Screen).

## 2. Alerts inside the app
Tap **Enable alerts** in the app. It notifies before start, at start, before end and at end, with the teacher's name.
They fire while the app is open, in a background tab, and (Android / installed PWA) when the app is minimised — the
service worker + `notificationclick` handle the tap-to-open. A browser cannot wake a **closed** static web app, so for
alerts with the phone locked use ntfy (section 3).

iPhone/iOS: notifications only work from the installed Home Screen app (Share → Add to Home Screen) on iOS 16.4+,
and the app must have been opened at least once after installing.

## 3. Alerts that always arrive (phone closed, screen off) — ntfy
1. Install the free **ntfy** app (Android / iPhone) and subscribe to a long random topic, e.g. `cst-sem4-k8f3q9x2z7`.
2. GitHub repo → Settings → Secrets and variables → Actions → New repository secret: name `NTFY_TOPIC`, value = that topic.
3. Actions tab → **class-alerts** → Run workflow (once, to test). After that it runs by itself at 06:00 Dhaka time every day
   and schedules that day's alerts on ntfy, which delivers them at the exact minute.

Notes: keep the topic secret (anyone who knows it can read it). Running the workflow twice in a day sends duplicates.
GitHub pauses scheduled workflows after 60 days without repo activity; re-enable it from the Actions tab or push any commit.
Turn off one of the two alert types if you get doubles.

Dry run on your computer: `DAY=3 ALL=1 DRY_RUN=1 node scripts/schedule-alerts.mjs`
