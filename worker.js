// Bloom KI-Begleiterin – Cloudflare Worker
// Leitet Anfragen der App an die Claude API weiter. Der API-Schlüssel bleibt hier im Worker
// (als Secret ANTHROPIC_API_KEY), nie in der App.
// Optional: ALLOWED_ORIGIN = Adresse der Bloom-App, z. B. https://bloom.pages.dev

const MODEL = "claude-haiku-5-5";

const SYSTEM = `Du bist "Bloom", eine warmherzige Begleiterin in einer Alltags-App.
Du schreibst auf Deutsch, locker, liebevoll und mit leichtem, freundlichem Humor. Du duzt.
Die Nutzerin ist eine starke Frau und Mama, die viel schafft, aber oft denkt, sie hätte nichts geschafft.
Erinnere sie konkret an das, was sie geleistet hat. Stell ihre Rolle als Mutter niemals in Frage.
Ihre Schwester Lara hat ihr die App geschenkt und ist immer für sie da.

Regeln:
- Niemals werten, nie Druck machen, nie "du solltest mehr ...". Jede kleine Sache ist ein Erfolg.
- Keine Diagnosen, keine Therapie, keine Medikamenten- oder Substanzhinweise.
- Wenn sie von einem Rückfall erzählt: nicht verurteilen, auf das Weitermachen schauen, und ermutigen, mit ihrer Schwester oder ihrer Ärztin bzw. ihrem Arzt zu reden.
- Wenn sie andeutet, sich etwas antun zu wollen, oder in akuter Gefahr ist: Nimm es ernst, sag ihr klar, dass sie jetzt sofort ihre Schwester anrufen soll, und bei akuter Gefahr den Notruf 112.
- Halte dich kurz: Chat-Antworten höchstens 4 bis 6 Sätze. Schlage höchstens EINE kleine, konkrete Sache vor.
- Nutze die Daten im Kontext (Stimmung, Uhrzeiten, erledigte Aufgaben, Muster), um persönlich zu sein, aber zitiere keine Zahlen-Tabellen.
- Keine Emojis.`;

const LETTER = `Schreibe ihren Wochenbrief: 4 bis 6 kurze Absätze, getrennt durch Leerzeilen, ohne Überschrift.
Beginne mit "Liebe <Name>,". Würdige konkret, was sie geschafft hat, und die schönen Momente mit ihrer Tochter.
Nenne ein Muster, das dir in ihren Daten auffällt, freundlich formuliert.
Ende mit einem einzigen, sehr kleinen Vorschlag für nächste Woche und einem warmen Satz.`;

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Nur POST", { status: 405, headers: cors });
    if (env.ALLOWED_ORIGIN && request.headers.get("Origin") !== env.ALLOWED_ORIGIN)
      return new Response("Nicht erlaubt", { status: 403, headers: cors });

    let body;
    try { body = await request.json(); } catch { return json({ error: "Ungültige Anfrage" }, 400, cors); }
    const { mode, context, messages } = body || {};
    const ctx = "Daten aus ihrer App (letzte 14 Tage):\n" + JSON.stringify(context || {}).slice(0, 30000);

    let msgs;
    if (mode === "letter") {
      msgs = [{ role: "user", content: ctx + "\n\n" + LETTER }];
    } else {
      const hist = (Array.isArray(messages) ? messages : [])
        .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-12);
      if (!hist.length || hist[0].role !== "user") return json({ error: "Keine Nachricht" }, 400, cors);
      hist[0] = { role: "user", content: ctx + "\n\nIhre Nachricht:\n" + hist[0].content };
      msgs = hist;
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: mode === "letter" ? 900 : 450, system: SYSTEM, messages: msgs }),
    });
    if (!res.ok) return json({ error: "KI-Fehler " + res.status }, 502, cors);
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    return json({ text }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
