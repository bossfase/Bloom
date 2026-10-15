# Bloom

Alltags-Web-App (PWA) für deine Schwester. Läuft komplett im Browser, Daten bleiben auf ihrem Handy.

## Vor dem Hochladen

In `index.html` ganz oben im Block `BLOOM_CONFIG`:
- `laraPhone`: deine Nummer eintragen, z. B. `"+491701234567"` (sonst funktioniert der Anruf-Button nicht)
- `loveNote`: deine Nachricht an sie, gerne persönlicher umschreiben

## Hosten (Cloudflare Pages, wie bei Mein Kompass)

1. Neues GitHub-Repo, z. B. `Bloom`, alle Dateien aus diesem Ordner hochladen (ohne `ki-worker`).
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → mit dem Repo verbinden.
   Kein Build-Befehl, Ausgabeordner: `/`.
3. Link auf ihrem iPhone in Safari öffnen → Teilen → „Zum Home-Bildschirm“.
   Wichtig: über das Home-Bildschirm-Icon öffnen, nicht im normalen Safari-Tab. Dann bleiben die Daten zuverlässiger erhalten.

## Optional: KI-Begleiterin (Wochenbrief + Chat)

Standardmäßig aus. Sie schaltet es selbst unter „Ich“ an.

1. Cloudflare → Workers → Create Worker → Inhalt von `ki-worker/worker.js` einfügen → Deploy.
2. Worker → Settings → Variables:
   - Secret `ANTHROPIC_API_KEY` = dein Schlüssel von console.anthropic.com
   - Variable `ALLOWED_ORIGIN` = Adresse der App, z. B. `https://bloom.pages.dev` (ohne Schrägstrich am Ende)
3. Worker-Adresse (`https://….workers.dev`) entweder in `BLOOM_CONFIG.aiUrl` eintragen oder später in der App unter „Ich“.

Wenn die KI an ist, gehen ihre Check-ins, Notizen und Aufgaben der letzten 14 Tage an die Claude API.

## Updates

Nach Änderungen in `sw.js` die Zeile `const CACHE = "bloom-v1"` hochzählen (v2, v3 …), damit das Handy die neue Version lädt. Ihre Daten bleiben dabei erhalten.
