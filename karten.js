/* SV-Trainer - der gemeinsame Kartenstapel

   Zwei Herkuenfte, ein Stapel:
   - Pruefungskatalog (P-S Sachkunde, P-B Bautechnik) aus daten-pruefung.js, Kennungen unveraendert
   - Rechenwege (RW) werden aus den Ketten in daten-rechenwege.js erzeugt

   Die Kennungen beissen sich nicht: der Katalog benutzt vierstellige Zahlen,
   die Rechenwege benutzen Kennungen mit einem senkrechten Strich darin.
*/

let KARTEN = [];
let NACH_ID = {};

function bauKarten() {
  const k = [];

  for (const c of PRUEFKARTEN) {
    k.push({ id: c.id, fach: c.fach, f: c.f, a: c.a, thema: FAECHER[c.fach].lang,
             warum: c.warum, bruecke: c.bruecke });
  }

  for (const kette of KETTEN) {
    for (let i = 0; i < kette.schritte.length; i++) {
      const s = kette.schritte[i], t = kette.name;
      const bild = MERKBILDER[s.pnr];
      const bruecke = bild ? (SYMBOLE[s.pnr] || '') + ' ' + bild.wort + ': ' + bild.szene : null;
      /* pnr wandert in die Karte: nur so weiss die Ansicht spaeter, welcher
         Paragraf hinter ihr steht, und kann ihn zum Nachlesen anbieten. */
      const z = (id, f, a) => k.push({ id: kette.id + '|' + s.id + '|' + id, fach: 'RW', f, a, thema: t,
                                       kette: kette.id, pnr: s.pnr, warum: s.warum, bruecke: bruecke });
      z('par', 'Welche Fundstelle regelt: ' + s.name + '?', s.paragraf);
      z('fml', (s.rechnen ? 'Woraus rechnest du ' : 'Was steckt hinter ') + s.name + '?', s.formel);
      const n = kette.schritte[i + 1];
      if (n) z('nxt', 'Kette ' + kette.name + ': Was kommt direkt nach ' + s.name + '?', n.name + '  —  ' + n.paragraf);
      if (s.stufe !== 'eingang') {
        const st = STUFEN.find(x => x.id === s.stufe);
        z('stf', 'In welchem Schritt des Paragrafen 6 Absatz 3 steckt ' + s.name + '?', st.kurz + ': ' + st.name);
      }
      if (s.falle) z('fal', 'Welcher Fehler lauert bei ' + s.name + '?', s.falle);
    }
  }

  const gesehen = {};
  for (const kette of KETTEN) for (const s of kette.schritte) {
    const b = MERKBILDER[s.pnr];
    if (!b || gesehen[s.pnr]) continue;
    gesehen[s.pnr] = 1;
    k.push({ id: 'bild|' + s.pnr + '|a', fach: 'RW', thema: 'Merkbilder', pnr: s.pnr,
             f: 'Welches Merkbild gehoert zu Paragraf ' + s.pnr + '?', a: b.wort + '  —  ' + b.szene });
    k.push({ id: 'bild|' + s.pnr + '|b', fach: 'RW', thema: 'Merkbilder', pnr: s.pnr,
             f: 'Merkbild ' + b.wort + ': welcher Paragraf, und was regelt er?', a: 'Paragraf ' + s.pnr + '. ' + b.szene });
  }

  /* Der Rundgang wird in drei Richtungen abgefragt: vom Ort zum Inhalt, vom Bild
     zum Ort, und von Station zu Station. Erst die dritte Richtung macht aus
     Einzelbildern eine abrufbare Reihenfolge - das ist der Sinn eines Palastes. */
  for (let i = 0; i < PALAST.length; i++) {
    const s = PALAST[i], m = MERKBILDER[s.paragraf], sym = SYMBOLE[s.paragraf] || '';
    const abschnitt = PALAST_ABSCHNITTE.find(a => s.nr >= a.von && s.nr <= a.bis);
    const t = 'Rundgang: ' + abschnitt.name;
    k.push({ id: 'palast|' + s.nr + '|ort', fach: 'PAL', thema: t, station: s.nr, paragraf: s.paragraf,
             f: 'Rundgang, Station ' + s.nr + ': ' + s.ort + '. Was liegt dort, und welcher Paragraf?',
             a: sym + '  ' + m.wort + '  —  Paragraf ' + s.paragraf + ', ' + s.kurz + '.\n\n' + s.verbindung });
    k.push({ id: 'palast|' + s.nr + '|wort', fach: 'PAL', thema: t, station: s.nr, paragraf: s.paragraf,
             f: 'Wo im Rundgang steht ' + m.wort + '?',
             a: 'Station ' + s.nr + ': ' + s.ort + '. Paragraf ' + s.paragraf + ', ' + s.kurz + '.' });
    const n = PALAST[i + 1];
    if (n) {
      const nm = MERKBILDER[n.paragraf];
      k.push({ id: 'palast|' + s.nr + '|next', fach: 'PAL', thema: t, station: s.nr, paragraf: s.paragraf,
               f: 'Du stehst bei Station ' + s.nr + ', ' + s.ort + '. Wohin gehst du als Nächstes, und was findest du dort?',
               a: 'Station ' + n.nr + ': ' + n.ort + '. Dort ' + (SYMBOLE[n.paragraf] || '') + ' ' + nm.wort +
                  ', Paragraf ' + n.paragraf + ', ' + n.kurz + '.' });
    }
  }

  /* Kapitel Bauleitplanung. Alle Karten entstehen aus denselben Tabellen, aus
     denen auch die Kapitelseite gebaut wird - Seite und Abfrage koennen so gar
     nicht auseinanderlaufen. Die Fundstelle steht in der Antwort, damit die
     Paragrafenmarke ueber der Frage erscheint und man nachlesen kann. */
  if (typeof BLP_VERGLEICH !== 'undefined') {
    const tb = (x) => 'Bauleitplanung';

    /* Drei Karten je Merkmal: einmal die eine Seite, einmal die andere, einmal
       beide nebeneinander. Die ersten beiden sind sich so aehnlich, dass die
       Ablenker-Auswahl sie einander zuspielt - genau die Verwechslung, um die
       es geht, steht dann in der Runde zur Wahl. */
    for (const v of BLP_VERGLEICH) {
      k.push({ id: 'blp|v|' + v.id + '|f', fach: 'BLP', thema: 'Die zwei Pläne',
               f: 'Flächennutzungsplan — ' + v.merkmal,
               a: v.fnp + '\n\n' + v.fund, warum: v.warum, bruecke: BLP_BILDER.fnp.sym + ' ' + BLP_BILDER.fnp.szene });
      k.push({ id: 'blp|v|' + v.id + '|b', fach: 'BLP', thema: 'Die zwei Pläne',
               f: 'Bebauungsplan — ' + v.merkmal,
               a: v.bplan + '\n\n' + v.fund, warum: v.warum, bruecke: BLP_BILDER.bplan.sym + ' ' + BLP_BILDER.bplan.szene });
      /* nurFrei: Diese Karte traegt BEIDE Antworten. Als Ablenker waere sie
         zugleich richtig - deshalb nie zur Auswahl stellen und nie ankreuzen
         lassen, sondern selbst sagen und aufdecken. */
      k.push({ id: 'blp|v|' + v.id + '|x', fach: 'BLP', thema: 'Gegenüberstellung', nurFrei: true,
               f: 'Stelle beide gegenüber: ' + v.merkmal,
               a: 'Flächennutzungsplan: ' + v.fnp + '\n\nBebauungsplan: ' + v.bplan + '\n\n' + v.fund,
               warum: v.warum });
    }

    for (const p of BLP_PAARE) {
      k.push({ id: 'blp|p|' + p.a.slice(0, 12) + '|a', fach: 'BLP', thema: 'Begriffe, die man verwechselt',
               f: 'Was ist ' + p.a + '?', a: p.erklaerungA + '\n\n' + p.fund,
               warum: 'Der Gegenbegriff ist ' + p.b + ': ' + p.erklaerungB });
      k.push({ id: 'blp|p|' + p.a.slice(0, 12) + '|b', fach: 'BLP', thema: 'Begriffe, die man verwechselt',
               f: 'Was ist ' + p.b + '?', a: p.erklaerungB + '\n\n' + p.fund,
               warum: 'Der Gegenbegriff ist ' + p.a + ': ' + p.erklaerungA });
    }

    for (const z of BLP_ZULAESSIG) {
      k.push({ id: 'blp|z|' + z.pnr + '|w', fach: 'BLP', thema: 'Wo darf gebaut werden',
               f: 'Wann gilt § ' + z.pnr + ' BauGB?', a: z.wann + '\n\n§ ' + z.pnr + ' BauGB',
               warum: z.fein });
      k.push({ id: 'blp|z|' + z.pnr + '|m', fach: 'BLP', thema: 'Wo darf gebaut werden',
               f: 'Welcher Maßstab gilt nach § ' + z.pnr + ' BauGB?', a: z.massstab + '\n\n§ ' + z.pnr + ' BauGB',
               warum: z.fein });
      k.push({ id: 'blp|z|' + z.pnr + '|r', fach: 'BLP', thema: 'Wo darf gebaut werden',
               f: 'Nach welcher Vorschrift richtet sich die Zulässigkeit: ' + z.wann,
               a: '§ ' + z.pnr + ' BauGB — ' + z.name + '.\n\n' + z.massstab, warum: z.fein });
    }

    for (const g of BLP_GEBIETE) {
      k.push({ id: 'blp|g|' + g.kuerzel, fach: 'BLP', thema: 'Baugebiete der BauNVO',
               f: 'Welches Baugebiet steckt hinter dem Kürzel ' + g.kuerzel + '?',
               a: g.name + ' — § ' + g.pnr + ' BauNVO.\n\n' + g.zweck,
               warum: 'Baugebiete setzt der Bebauungsplan fest. Im Flächennutzungsplan stehen meist nur die groben Bauflächen W, M, G und S.' });
    }

    for (const m of BLP_MASS) {
      k.push({ id: 'blp|m|' + m.pnr + '|' + m.begriff.slice(0, 10), fach: 'BLP', thema: 'Maß der baulichen Nutzung',
               f: 'Was besagt: ' + m.begriff + '?',
               a: m.was + '\n\nBeispiel: ' + m.beispiel + '\n\n§ ' + m.pnr + ' BauNVO',
               warum: 'Das Maß der baulichen Nutzung ist der Teil des Bebauungsplans, der direkt in den Bodenwert durchschlägt.' });
    }

    for (const w of BLP_WERT) {
      k.push({ id: 'blp|w|' + w.zustand.slice(0, 12) + '|a', fach: 'BLP', thema: 'Vom Plan zum Bodenwert',
               f: 'Welcher Planungsstand führt zu: ' + w.zustand + '?',
               a: w.planung + '\n\n' + w.abs, warum: w.merken });
      k.push({ id: 'blp|w|' + w.zustand.slice(0, 12) + '|b', fach: 'BLP', thema: 'Vom Plan zum Bodenwert',
               f: 'Welcher Entwicklungszustand liegt vor? ' + w.planung,
               a: w.zustand + ' — ' + w.abs + '.\n\n' + w.merken, warum: w.merken });
    }

    BLP_FAELLE.forEach((x, i) => {
      k.push({ id: 'blp|f|' + i, fach: 'BLP', thema: 'Fälle',
               f: x.fall + '\n\n' + x.frage, a: x.antwort, warum: x.falle });
    });

    for (const s of BLP_STUFEN) {
      k.push({ id: 'blp|s|' + s.nr, fach: 'BLP', thema: 'Die Reihenfolge',
               f: 'Stufe ' + s.nr + ' der Bauleitplanung: was passiert dort?',
               a: s.name + '.\n\n' + s.kurz + '\n\n' + s.fund,
               warum: 'Die Reihenfolge ist der rote Faden: Land, dann Gemeinde grob, dann Gemeinde fein, dann das einzelne Vorhaben, dann der Wert.' });
    }
    k.push({ id: 'blp|s|folge', fach: 'BLP', thema: 'Die Reihenfolge',
             f: 'Nenne die fünf Stufen von der Landesplanung bis zum Bodenwert.',
             a: BLP_STUFEN.map(s => s.nr + '. ' + s.name + ' (' + s.fund + ')').join('\n'),
             warum: 'Wer die Reihenfolge kann, kann jede Frage der Art „darf hier gebaut werden" von oben nach unten durchgehen.' });

    k.push({ id: 'blp|b|leitsatz', fach: 'BLP', thema: 'Das Bild',
             f: 'Welcher Satz trennt die beiden Pläne?', a: BLP_LEITSATZ +
             '\n\nHubschrauber: der Flächennutzungsplan, grob und unverbindlich.\nBauzaun: der Bebauungsplan, genau und verbindlich.' });
    k.push({ id: 'blp|b|fnp', fach: 'BLP', thema: 'Das Bild',
             f: 'Welches Bild gehört zum Flächennutzungsplan, und warum?',
             a: BLP_BILDER.fnp.sym + ' ' + BLP_BILDER.fnp.wort + '\n\n' + BLP_BILDER.fnp.szene });
    k.push({ id: 'blp|b|bplan', fach: 'BLP', thema: 'Das Bild',
             f: 'Welches Bild gehört zum Bebauungsplan, und warum?',
             a: BLP_BILDER.bplan.sym + ' ' + BLP_BILDER.bplan.wort + '\n\n' + BLP_BILDER.bplan.szene });
  }

  /* Eigene Karten. Sie stehen nicht im Programm, sondern kommen aus einer Datei,
     die nur auf diesem Geraet liegt. Deshalb werden sie hier nur angehaengt. */
  for (const c of (STAND.eigeneKarten || [])) {
    if (c && c.id && c.f && c.a) k.push(Object.assign({ fach: 'D1P', thema: 'Eigene Karten' }, c));
  }

  EXTRA_KARTEN.forEach((x, i) => k.push({ id: 'extra|' + i, fach: 'RW', thema: x.t, f: x.f, a: x.a }));
  VERFAHRENSFAELLE.forEach((x, i) => k.push({ id: 'wahl|' + i, fach: 'RW', thema: 'Verfahrenswahl',
             f: 'Welches Verfahren, und warum? ' + x.fall, a: x.verfahren + '. ' + x.grund }));

  KARTEN = k;
  NACH_ID = {};
  for (const c of k) NACH_ID[c.id] = c;
  return k;
}

const fachName = (f) => (FAECHER[f] ? FAECHER[f].name : f);

/* Eine Karte zum Rundgang wird erst gefragt, wenn die Station auch abgelaufen
   wurde. Vorher waere sie reines Raten: Welcher Raum welchen Paragrafen haelt,
   kann man nicht herleiten, man muss den Weg gegangen sein. Alles andere ist
   von Anfang an verfuegbar, denn dort ist die erste Begegnung selbst schon
   das Lernen. */
function verfuegbar(c) {
  /* Eigene Karten sind standardmaessig aus. Fuer die D1-Pruefung am 5. Oktober
     waere der D1Plus-Stoff nur Ballast; anschalten laesst er sich jederzeit. */
  if (c.fach === 'D1P') return !!STAND.einst.eigeneAn;
  /* Das Kapitel der zwei Plaene wird erst abgefragt, wenn es einmal offen war.
     Ohne das Bild vorher sind die Karten nur zwei Wortlisten, die man
     verwechselt - und genau das war ja das Problem. */
  if (c.fach === 'BLP') return !!STAND.blpGesehen;
  if (c.fach !== 'PAL') return true;
  return !!(STAND.palastGesehen && STAND.palastGesehen[c.station]);
}
const stapel = (fach) => ((!fach || fach === 'alle') ? KARTEN : KARTEN.filter(c => c.fach === fach))
  .filter(verfuegbar);

function faecherMitAnzahl() {
  const z = {};
  for (const c of KARTEN) if (verfuegbar(c)) z[c.fach] = (z[c.fach] || 0) + 1;
  return Object.keys(FAECHER).map(f => ({ id: f, name: FAECHER[f].name, anzahl: z[f] || 0, farbe: FAECHER[f].farbe }))
    .filter(f => f.anzahl > 0);
}

/* ------------------------------------------------- Ablenker fuer die Wahl

   Die Ablenker muessen vom SELBEN Thema sein. Sonst erkennt man die richtige
   Antwort, ohne sie zu wissen - und dann misst die Frage nichts.

   Der erste Anlauf hat nach Wortueberlappung in den Antworten gesucht und
   aehnliche Laenge belohnt. Das ging schief: Haeufige Woerter wie "Grundstueck"
   stehen in fast jeder Antwort und sagen nichts ueber das Thema, waehrend die
   Laengenstrafe bei Antworten zwischen 21 und 6806 Zeichen alles andere
   ueberdeckte. Heraus kamen Ablenker ueber Daemmung und Statik zu einer Frage
   ueber Erschliessung.

   Jetzt zaehlt ein gemeinsames Wort so viel, wie es selten ist: "Erschliessung"
   kommt in wenigen Karten vor und wiegt schwer, "Grundstueck" in fast allen und
   wiegt fast nichts. Gesucht wird ausserdem in Frage UND Antwort, denn das Thema
   steht meist schon in der Frage. */
const STOPP = new Set(['und', 'oder', 'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'eines',
  'ist', 'sind', 'wird', 'werden', 'wer', 'wie', 'was', 'bei', 'mit', 'von', 'vom', 'zum', 'zur', 'fuer', 'für',
  'auf', 'aus', 'nach', 'nicht', 'auch', 'sich', 'dass', 'als', 'man', 'kann', 'nur', 'zwei', 'drei',
  'sowie', 'diese', 'dieser', 'dieses', 'einem', 'einen', 'beim', 'durch', 'unter', 'über', 'welche', 'welcher',
  'nennen', 'erläutern', 'versteht', 'beschreiben', 'gemäß', 'jeweils', 'sollte', 'sollten', 'müssen']);
const WORT_CACHE = {};
let HAEUFIGKEIT = null;     // in wie vielen Karten kommt ein Wort vor

function woerter(id) {
  if (WORT_CACHE[id]) return WORT_CACHE[id];
  const c = NACH_ID[id];
  const s = new Set(((c.f + ' ' + c.a).toLowerCase().match(/[a-zäöüß]{5,}/g) || []).filter(w => !STOPP.has(w)));
  return (WORT_CACHE[id] = s);
}
function seltenheit(w) {
  if (!HAEUFIGKEIT) {
    HAEUFIGKEIT = {};
    for (const c of KARTEN) for (const x of woerter(c.id)) HAEUFIGKEIT[x] = (HAEUFIGKEIT[x] || 0) + 1;
  }
  return Math.log(KARTEN.length / (HAEUFIGKEIT[w] || 1));
}
/* Wie nah sind sich zwei Karten thematisch? */
function aehnlichkeit(a, b) {
  const ma = woerter(a), mb = woerter(b);
  let s = 0;
  for (const w of ma) if (mb.has(w)) s += seltenheit(w);
  /* Innerhalb einer Rechenkette gehoert ohnehin alles zusammen. */
  const ca = NACH_ID[a], cb = NACH_ID[b];
  if (ca.kette && ca.kette === cb.kette) s += 4;
  if (ca.station && cb.station) s += 4 - Math.min(4, Math.abs(ca.station - cb.station) * 0.5);
  return s;
}
/* Die drei naechsten Verwandten einer Karte, fuer den Hinweis nach der Antwort. */
function nachbarn(id, anzahl) {
  const mich = NACH_ID[id];
  return KARTEN.filter(c => c.id !== id && c.fach === mich.fach)
    .map(c => ({ id: c.id, p: aehnlichkeit(id, c.id) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, anzahl || 3)
    .filter(x => x.p > 3)
    .map(x => x.id);
}
/* Ein Ablenker darf nicht selbst richtig sein. Das passiert schneller, als man
   denkt: "Verfahren waehlen - Paragraf 6 Absatz 1" beantwortet auch die Frage
   nach der blossen Fundstelle, und zwei Karten koennen dieselbe Antwort tragen.
   Wer so etwas ankreuzt, bekommt zu Unrecht einen Fehler - und lernt, seiner
   richtigen Antwort zu misstrauen. */
function deckungsgleich(a, b) {
  const x = String(a || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const y = String(b || '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.indexOf(y) >= 0) return true;                 // der Ablenker enthaelt die richtige Antwort
  if (y.indexOf(x) >= 0 && x.length >= 15) return true; // oder steckt als ganzes Stueck darin
  return false;
}

function mcOptionen(id, anzahl) {
  const mich = NACH_ID[id], lang = mich.a.length;
  const wieviel = (anzahl || 4) - 1;          // so viele Ablenker werden gebraucht
  /* Karten mit nurFrei tragen mehr als eine richtige Antwort in sich und
     duerfen deshalb nie als Moeglichkeit erscheinen. */
  const kandidaten = KARTEN.filter(c => c.id !== id && c.fach === mich.fach && !c.nurFrei && verfuegbar(c))
    .filter(c => !deckungsgleich(c.a, mich.a));
  if (kandidaten.length < wieviel) return [id];
  const bewertet = kandidaten.map(c => ({
    id: c.id,
    /* Thema zaehlt, Laenge nur noch als leichter Ausgleich und gedeckelt. */
    punkte: aehnlichkeit(id, c.id) - Math.min(3, Math.abs(c.a.length - lang) / 400)
  })).sort((a, b) => b.punkte - a.punkte);
  /* Der naechste Verwandte ist IMMER dabei - er macht die Frage erst schwer.
     Die beiden anderen kommen zufaellig aus den Plaetzen zwei bis sechs, damit
     dieselbe Frage nicht jedes Mal genau gleich aussieht. */
  const gewaehlt = [bewertet[0].id]
    .concat(mischen(bewertet.slice(1, Math.max(6, wieviel + 3))).slice(0, wieviel - 1).map(x => x.id));
  return mischen([id].concat(gewaehlt));
}

function mischen(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ------------------------------------------------------------ Warteschlange
   Erst was faellig ist, schwerste Boxen zuerst, dann neue Karten bis zum
   Tagespensum. "Frei" mischt einfach alles durch. */
function warteschlange(fach, modus, grenze) {
  const p = stapel(fach), h = heute();
  let reihe;
  if (modus === 'frei') {
    reihe = mischen(p.map(c => c.id));
  } else {
    const faellig = [], neu = [];
    for (const c of p) {
      if (istNeu(c.id)) neu.push(c.id);
      else if (STAND.karten[c.id].due <= h) faellig.push(c.id);
    }
    /* Schwerste zuerst: niedrige Box, viele Fehlversuche. */
    faellig.sort((a, b) => boxVon(STAND.karten[a]) - boxVon(STAND.karten[b])
                        || (STAND.karten[b].fail || 0) - (STAND.karten[a].fail || 0));
    const z = zahlen(p.map(c => c.id));
    /* Neue Karten werden so weit nachgelegt, dass die Runde wirklich so lang wird
       wie versprochen. Wie viel Neues am Tag dazukommt, steuerst du ohnehin ueber
       die Zahl der Runden - und ein Knopf, der 7 sagt und 5 liefert, ist schlimmer
       als einer, der gleich 5 sagt. */
    reihe = faellig.concat(mischen(neu).slice(0, Math.max(z.proTag, MIN_NEU_PRO_TAG, grenze || 0)));
  }
  /* Eine Runde ist so lang wie versprochen, nicht laenger. Der Rest wartet
     einfach auf die naechste Runde - das ist der ganze Trick an der Ziellinie. */
  return grenze ? reihe.slice(0, grenze) : reihe;
}
