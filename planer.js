/* SV-Trainer - Lernstand und Wiederholungsplaner

   Ein Planer fuer alle Karten: FSRS-5. Er schaetzt je Karte Stabilitaet und
   Schwierigkeit und legt die Wiederholung dorthin, wo du sie gerade so noch
   weisst. Nach aussen bleiben die gewohnten fuenf Boxen sichtbar, sie werden
   aus der Stabilitaet abgeleitet.

   Quelle der Formeln und Gewichte: open-spaced-repetition, FSRS-5.
*/

const SCHLUESSEL = 'sv-trainer-v1';
const ALT_PRUEFUNG = 'gutachten_trainer_v1';        // App "Pruefungstrainer"
const ALT_RECHENWEGE = 'immowertv-rechenwege-v1';   // App "Rechenwege"

const W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192,
           1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
const DECAY = -0.5, FACTOR = 19 / 81, ZIEL_R = 0.9;

/* Boxen nur zur Anzeige: aus der Stabilitaet in Tagen. Box 4 und 5 gelten als sicher. */
const BOX_GRENZEN = [2, 5, 12, 30];
const SICHER_AB = 4;
const ZIEL_TAGE = 60;
const MIN_NEU_PRO_TAG = 5;

/* Eine Runde ist bewusst kurz und hat ein sichtbares Ende. Grund: Bei ADHS ist
   nicht das Lernen das Problem, sondern das Anfangen und das Warten auf die
   Belohnung. Eine Runde, deren Ziellinie von der ersten Sekunde an zu sehen ist,
   nimmt beides weg. Konzentration ueber 30 Minuten ist ohnehin selten haltbar;
   10 Minuten gelten als realistischer Start. */
const RUNDE_STANDARD = 7;

/* ------------------------------------------------------------------ Datum */
const heute = () => new Date().toISOString().slice(0, 10);
function tagPlus(basis, n) {
  const d = new Date(basis + 'T12:00:00');
  d.setDate(d.getDate() + Math.round(n));
  return d.toISOString().slice(0, 10);
}
const tagePlusHeute = (n) => tagPlus(heute(), Math.max(0, n));
const tageZwischen = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
function datumText(s) {
  if (!s) return '-';
  const [j, m, t] = s.split('-');
  return t + '.' + m + '.' + j;
}

/* ------------------------------------------------------------------ FSRS */
const klemm = (x, a, b) => Math.min(b, Math.max(a, x));
const fsrsR = (t, s) => Math.pow(1 + FACTOR * t / s, DECAY);
const fsrsD0 = (g) => klemm(W[4] - Math.exp(W[5] * (g - 1)) + 1, 1, 10);
function fsrsD(d, g) {
  const d1 = d + (-W[6] * (g - 3)) * (10 - d) / 9;
  return klemm(W[7] * fsrsD0(4) + (1 - W[7]) * d1, 1, 10);
}
function fsrsSErfolg(d, s, r, g) {
  const hart = g === 2 ? W[15] : 1, leicht = g === 4 ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hart * leicht);
}
function fsrsSVergessen(d, s, r) {
  return Math.min(W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)), s);
}
const abstand = (s) => Math.max(1, s / FACTOR * (Math.pow(ZIEL_R, 1 / DECAY) - 1));

function boxVon(k) {
  if (!k || !k.s) return 0;
  let b = 1;
  for (const g of BOX_GRENZEN) { if (k.s < g) break; b++; }
  return Math.min(5, b);
}

/* ------------------------------------------------------------- Lernstand */
function leererStand() {
  const h = heute();
  return {
    version: 2,
    einst: { fach: 'alle', stil: 'mc', pruefAnzahl: 45, pruefMinuten: 60, bestehen: 60,
             rundenGroesse: RUNDE_STANDARD, belohnung: 'deutlich', eigeneAn: false,
             startDatum: h, zielDatum: tagPlus(h, ZIEL_TAGE) },
    karten: {},          // id -> {s, d, due, last, reps, lapses, ok, fail, seen}
    stufen: {},          // Kette -> erreichte Stufe im Rechnen-Teil
    pruefungen: [],      // {datum, anzahl, punkte, prozent, bestanden}
    tage: {},            // 'YYYY-MM-DD' -> bewertete Karten
    punkte: 0,
    laufendePruefung: null,
    laufendeRunde: null, // angefangene Lernrunde, damit eine Unterbrechung nichts kostet
    palastGesehen: {},   // Station -> true, sobald sie im Rundgang angesehen wurde
    blpGesehen: false,   // Kapitel der zwei Bauleitplaene einmal angesehen
    eigeneKarten: [],    // eingelesene eigene Karten, bleiben nur auf diesem Geraet
    eigenePruefungen: [],// ganze Originalpruefungen: Name und Fragenfolge, nur hier
    uebernommen: {}
  };
}

let STAND = leererStand();

function sichern() {
  try { localStorage.setItem(SCHLUESSEL, JSON.stringify(STAND)); } catch (e) {}
}
function laden() {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (roh) {
      const s = JSON.parse(roh);
      const l = leererStand();
      s.einst = Object.assign(l.einst, s.einst || {});
      for (const k of ['karten', 'stufen', 'tage', 'uebernommen', 'palastGesehen']) if (!s[k]) s[k] = {};
      if (!Array.isArray(s.pruefungen)) s.pruefungen = [];
      if (!('laufendePruefung' in s)) s.laufendePruefung = null;
      if (!('laufendeRunde' in s)) s.laufendeRunde = null;
      if (typeof s.punkte !== 'number') s.punkte = 0;
      if (!Array.isArray(s.eigeneKarten)) s.eigeneKarten = [];
      STAND = s;
    }
  } catch (e) {}
  uebernehmen();
  return STAND;
}

const karte = (id) => (STAND.karten[id] = STAND.karten[id] || { s: 0, d: 0, due: null, last: null, reps: 0, lapses: 0, ok: 0, fail: 0, seen: 0 });
const istFaellig = (id) => { const k = STAND.karten[id]; return !k || !k.s || !k.due || k.due <= heute(); };
const istNeu = (id) => { const k = STAND.karten[id]; return !k || !k.s; };

/* Note: 1 nicht gewusst, 2 unsicher, 3 gewusst, 4 sofort gewusst */
function bewerten(id, note) {
  const k = karte(id), h = heute();
  k.seen++;
  if (note === 1) k.fail++; else k.ok++;
  if (!k.s) {
    k.s = W[note - 1];
    k.d = fsrsD0(note);
    k.reps = 1;
    k.lapses = note === 1 ? 1 : 0;
  } else {
    const tage = Math.max(0, tageZwischen(k.last || h, h));
    const r = fsrsR(tage, k.s);
    k.s = note === 1 ? fsrsSVergessen(k.d, k.s, r) : fsrsSErfolg(k.d, k.s, r, note);
    k.d = fsrsD(k.d, note);
    k.reps++;
    if (note === 1) k.lapses++;
  }
  k.s = klemm(k.s, 0.01, 36500);
  k.last = h;
  k.due = note === 1 ? h : tagePlusHeute(abstand(k.s));
  STAND.tage[h] = (STAND.tage[h] || 0) + 1;
  k.punkte = note === 1 ? 1 : note;        // auch ein Fehlversuch zaehlt, er war Arbeit
  STAND.punkte = (STAND.punkte || 0) + k.punkte;
  sichern();
  return k;
}

/* Wie viele Tage hintereinander wurde geuebt, heute mitgezaehlt. Der gestrige Tag
   zaehlt noch mit, solange heute noch nichts gemacht wurde - sonst waere die Serie
   jeden Morgen scheinbar gerissen. */
function serie() {
  let n = 0, tag = heute();
  if (!STAND.tage[tag]) tag = tagPlus(tag, -1);
  while (STAND.tage[tag]) { n++; tag = tagPlus(tag, -1); }
  return n;
}

/* ------------------------------------------------------- Zahlen fuer oben */
function zahlen(ids) {
  const h = heute();
  const boxen = [0, 0, 0, 0, 0, 0];
  let faellig = 0, neu = 0, sicher = 0, lernen = 0;
  for (const id of ids) {
    const k = STAND.karten[id];
    const b = boxVon(k);
    boxen[b]++;
    if (b === 0) neu++;
    else if (b >= SICHER_AB) sicher++;
    else lernen++;
    if (istFaellig(id) && b > 0) faellig++;
  }
  const gesamt = ids.length;
  const prozent = gesamt ? Math.round(100 * sicher / gesamt) : 0;
  const tageBis = Math.max(1, tageZwischen(h, STAND.einst.zielDatum));
  const proTag = Math.ceil((gesamt - sicher) / tageBis);
  return { gesamt, faellig, neu, sicher, lernen, boxen, prozent, tageBis, proTag,
           heuteGemacht: STAND.tage[h] || 0 };
}

/* --------------------------------------------------------- Uebernahme
   Zwei Wege, beide laufen genau einmal:
   1. Gleiche Herkunft: liegt der alte Stand noch im selben Browser, wird er gelesen.
   2. Bruecke: die alten Adressen haengen ihren Stand an die Adresse an
      (Raute, also nie an einen Server geschickt) und leiten hierher weiter.        */

/* Alte Leitner-Box in eine Stabilitaet umrechnen. Gewaehlt ist rund das Doppelte
   des alten Abstands dieser Box: vorsichtig genug, um nichts zu behaupten, was die
   alten Daten nicht hergeben, und so gelegt, dass jede Box dieselbe Nummer behaelt. */
function boxNachStabilitaet(box) {
  return [0, 1.0, 3.0, 7.0, 15.0, 30.0][klemm(box | 0, 0, 5)];
}

function uebernehmePruefung(alt, quelle) {
  if (!alt || STAND.uebernommen[quelle]) return 0;
  let n = 0;
  for (const [id, c] of Object.entries(alt.cards || {})) {
    if (STAND.karten[id] && STAND.karten[id].s) continue;
    const box = c.box | 0;
    if (!box) continue;
    const versuche = (c.ok || 0) + (c.fail || 0);
    const k = karte(id);
    k.s = boxNachStabilitaet(box);
    k.d = klemm(4 + 6 * (c.fail || 0) / (versuche + 1), 1, 10);
    k.due = c.due || heute();
    k.last = c.due ? tagPlus(c.due, -Math.round(abstand(k.s))) : heute();
    k.reps = versuche; k.lapses = c.fail || 0;
    k.ok = c.ok || 0; k.fail = c.fail || 0; k.seen = c.seen || versuche;
    n++;
  }
  /* Der Stand kann auf zwei Wegen ankommen: direkt aus dem Browserspeicher und
     zusaetzlich ueber die Bruecke. Deshalb wird hier nach Inhalt abgeglichen und
     nicht einfach angehaengt, sonst steht jede Pruefung doppelt in der Liste. */
  if (Array.isArray(alt.exams)) {
    for (const e of alt.exams) {
      const schon = STAND.pruefungen.some(p => p.datum === e.datum && p.anzahl === e.count && p.punkte === e.p);
      if (!schon) {
        STAND.pruefungen.push({ datum: e.datum, anzahl: e.count, punkte: e.p,
                                prozent: e.pct, bestanden: !!e.passed });
      }
    }
    STAND.pruefungen.sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0));
  }
  for (const [t, z] of Object.entries(alt.reviewsByDay || {})) {
    STAND.tage[t] = Math.max(STAND.tage[t] || 0, z);
  }
  if (alt.settings) {
    const s = alt.settings;
    if (s.examCount) STAND.einst.pruefAnzahl = s.examCount;
    if (s.examMinutes) STAND.einst.pruefMinuten = s.examMinutes;
    if (s.passPct) STAND.einst.bestehen = s.passPct;
    if (s.stil) STAND.einst.stil = s.stil;
    if (s.zielDatum) STAND.einst.zielDatum = s.zielDatum;
    if (s.startDatum) STAND.einst.startDatum = s.startDatum;
  }
  STAND.uebernommen[quelle] = heute();
  return n;
}

function uebernehmeRechenwege(alt, quelle) {
  if (!alt || STAND.uebernommen[quelle]) return 0;
  let n = 0;
  for (const [id, c] of Object.entries(alt.planer || {})) {
    if (STAND.karten[id] && STAND.karten[id].s) continue;
    if (!c || !c.s) continue;
    const k = karte(id);
    k.s = c.s; k.d = c.d || fsrsD0(3); k.due = c.due || heute(); k.last = c.last || heute();
    k.reps = c.reps || 0; k.lapses = c.lapses || 0; k.seen = c.reps || 0;
    n++;
  }
  for (const [kette, st] of Object.entries(alt.stufen || {})) {
    STAND.stufen[kette] = Math.max(STAND.stufen[kette] || 0, st);
  }
  STAND.uebernommen[quelle] = heute();
  return n;
}

let UEBERNAHME_MELDUNG = null;

function uebernehmen() {
  let n = 0;
  // Weg 1: derselbe Browser, andere App auf derselben Herkunft
  try {
    const a = localStorage.getItem(ALT_PRUEFUNG);
    if (a) n += uebernehmePruefung(JSON.parse(a), 'lokal-pruefung');
  } catch (e) {}
  try {
    const a = localStorage.getItem(ALT_RECHENWEGE);
    if (a) n += uebernehmeRechenwege(JSON.parse(a), 'lokal-rechenwege');
  } catch (e) {}

  // Weg 2: Bruecke von der alten Adresse, Stand haengt hinter der Raute
  try {
    const m = /[#&]umzug=([^&]+)/.exec(location.hash);
    if (m) {
      const paket = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1]).replace(/-/g, '+').replace(/_/g, '/')))));
      const quelle = 'bruecke-' + (paket.quelle || 'unbekannt');
      if (paket.quelle === 'pruefung') n += uebernehmePruefung(paket.stand, quelle);
      else if (paket.quelle === 'rechenwege') n += uebernehmeRechenwege(paket.stand, quelle);
      history.replaceState(null, '', location.pathname + location.search);
    }
  } catch (e) {}

  if (n) { UEBERNAHME_MELDUNG = n + ' Karten aus deiner alten App übernommen.'; sichern(); }
  return n;
}

laden();
