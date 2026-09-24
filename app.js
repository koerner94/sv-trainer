/* SV-Trainer - Oberflaeche und Ablauf

   Vier Bereiche unter einem Dach:
     Lernen    Karten aus Pruefungskatalog und Rechenwegen, gemischt oder nach Fach
     Rechnen   die Rechenketten in fuenf Stufen mit verblassenden Stuetzen
     Pruefung  Simulation mit Uhr, Bestehensgrenze und Ruecklauf der Fehler ins Lernen
     Mehr      Spickzettel, Merkbilder, Einstellungen
*/

const $ = (s, w) => (w || document).querySelector(s);
const el = (tag, klasse, text) => {
  const n = document.createElement(tag);
  if (klasse) n.className = klasse;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
};

/* ------------------------------------------------------- Zahlen und Text */
function zahl(n, nk) {
  if (typeof n !== 'number' || !isFinite(n)) return String(n);
  return n.toLocaleString('de-DE', { minimumFractionDigits: nk, maximumFractionDigits: nk });
}
function fmt(wert, einheit) {
  if (wert === undefined || wert === null) return '?';
  switch (einheit) {
    case 'eur': return zahl(Math.round(wert), 0) + ' €';
    case 'eur_jahr': return zahl(Math.round(wert), 0) + ' €/Jahr';
    case 'eur_qm': return zahl(wert, wert % 1 ? 2 : 0) + ' €/m²';
    case 'eur_qm_monat': return zahl(wert, 2) + ' €/m²·Monat';
    case 'qm': return zahl(wert, 0) + ' m²';
    case 'jahre': return zahl(wert, 0) + ' Jahre';
    case 'prozent': return zahl(wert, 1) + ' %';
    case 'faktor': return zahl(wert, Math.abs(wert * 100 % 1) < 1e-9 ? 2 : (Math.abs(wert * 1000 % 1) < 1e-9 ? 3 : 4));
    default: return String(wert);
  }
}
const einheitKurz = (e) => ({ eur: '€', eur_jahr: '€ im Jahr', eur_qm: '€ je m²',
  eur_qm_monat: '€ je m² und Monat', qm: 'm²', jahre: 'Jahre', prozent: '%', faktor: 'Faktor' }[e] || '');

function leseZahlen(s) {
  s = String(s).trim().replace(/[\s €%]/g, '');
  if (s === '') return [];
  const raus = [];
  if (s.indexOf(',') >= 0) raus.push(parseFloat(s.replace(/\./g, '').replace(',', '.')));
  else {
    raus.push(parseFloat(s.replace(/\./g, '')));
    if ((s.match(/\./g) || []).length === 1) raus.push(parseFloat(s));
  }
  return raus.filter(x => !isNaN(x));
}
function toleranz(einheit, soll) {
  switch (einheit) {
    case 'eur': case 'eur_jahr': return Math.max(1, Math.abs(soll) * 0.005);
    case 'eur_qm': case 'eur_qm_monat': return Math.max(0.01, Math.abs(soll) * 0.005);
    case 'faktor': return 0.005;
    case 'prozent': return 0.05;
    default: return 0.5;
  }
}
function uhr(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
/* Alles, was nach der Antwort beim Merken hilft: die Begruendung, die
   Eselsbruecke, die Merkbilder zu den erwaehnten Paragrafen und die naechsten
   Verwandten im Katalog. Das Meiste entsteht von selbst - handgeschrieben sind
   nur "warum" und "bruecke", und die gibt es noch nicht ueberall. */
function merkhilfe(c) {
  const d = el('div', 'merkhilfe');
  let leer = true;

  if (c.warum) {
    const e = el('div', 'mh');
    e.appendChild(el('b', null, 'Warum das stimmt'));
    e.appendChild(el('p', null, c.warum));
    d.appendChild(e); leer = false;
  }
  if (c.bruecke) {
    const e = el('div', 'mh eselsbruecke');
    e.appendChild(el('b', null, '\u{1F9E0}  Eselsbrücke'));
    e.appendChild(el('p', null, c.bruecke));
    d.appendChild(e); leer = false;
  }

  /* Merkbilder zu den Paragrafen, die in Frage oder Antwort vorkommen. */
  const genannt = [];
  const txt = c.f + ' ' + c.a;
  let m;
  const re = new RegExp('(?:\\u00a7+\\s*|Paragrafen?\\s+)(\\d{1,3})', 'g');   // auch der ausgeschriebene Paragraf
  while ((m = re.exec(txt)) !== null) {
    const nr = +m[1];
    if (MERKBILDER[nr] && genannt.indexOf(nr) < 0) genannt.push(nr);
  }
  if (genannt.length) {
    const e = el('div', 'mh');
    e.appendChild(el('b', null, 'Dazu kennst du schon Bilder'));
    genannt.slice(0, 4).forEach(nr => {
      const mb = MERKBILDER[nr], st = PALAST.find(x => x.paragraf === nr);
      const z = el('button', 'merkzeile');
      z.appendChild(el('span', 'sym', SYMBOLE[nr] || ''));
      const rechts = el('span', 'txt');
      rechts.appendChild(el('b', null, mb.wort + '  \u00B7  Paragraf ' + nr));
      rechts.appendChild(el('span', null, st ? st.kurz + '  \u00B7  Station ' + st.nr + ', ' + st.ort : mb.szene.slice(0, 80)));
      z.appendChild(rechts);
      if (st) z.onclick = () => zeige('palast-gang', st.nr);
      e.appendChild(z);
    });
    d.appendChild(e); leer = false;
  }

  /* Was thematisch danebenliegt - hilft beim Einordnen. */
  const nb = nachbarn(c.id, 3);
  if (nb.length) {
    const e = el('div', 'mh');
    e.appendChild(el('b', null, 'Hängt zusammen mit'));
    nb.forEach(x => {
      const n = NACH_ID[x];
      const z = el('button', 'merkzeile schlicht');
      z.appendChild(el('span', 'txt', n.f.replace(/\s+/g, ' ').slice(0, 95)));
      z.onclick = () => fenster(n.f, n.a);
      e.appendChild(z);
    });
    d.appendChild(e); leer = false;
  }

  return leer ? null : d;
}

/* Das Sinnbild zu einer Karte, sofern es eines gibt. Bilder werden nachweislich
   besser behalten als Wörter, deshalb steht es überall dort, wo das Merkwort steht. */
function symbolFuer(c) {
  if (!c) return '';
  if (c.fach === 'PAL') {
    const s = PALAST.find(x => x.nr === c.station);
    return s ? (SYMBOLE[s.paragraf] || '') : '';
  }
  const m = /(?:^bild\|(\d+))/.exec(c.id);
  if (m) return SYMBOLE[+m[1]] || '';
  if (c.fach === 'RW' && c.kette) {
    const kette = KETTEN.find(k => k.id === c.kette);
    if (!kette) return '';
    const teil = c.id.split('|')[1];
    const schritt = kette.schritte.find(s => s.id === teil);
    return schritt ? (SYMBOLE[schritt.pnr] || '') : '';
  }
  return '';
}

function hinweis(text) {
  const t = $('#hinweis');
  t.textContent = text;
  t.classList.add('an');
  clearTimeout(t._z);
  t._z = setTimeout(() => t.classList.remove('an'), 2600);
}

/* Die Belohnung kommt im selben Augenblick wie die Antwort, nicht am Rundenende.
   Das ist der Punkt, an dem die Studienlage zu ADHS am deutlichsten ist. */
function punkteZeigen(n) {
  if (!n || STAND.einst.belohnung !== 'deutlich') return;
  const e = el('div', 'punkteflug', '+' + n);
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 900);
}

/* ------------------------------------------------------------- Zustand */
let ANSICHT = 'start';
let GESETZ_ARG = null;   // Beigabe der laufenden Ansicht, fuer den Rueckweg
let LERN = null, L = null, PR = null, PRUHR = null;

const NOTEN = [
  { g: 1, t: 'Nicht gewusst', u: 'nochmal' },
  { g: 2, t: 'Unsicher', u: 'mit Mühe' },
  { g: 3, t: 'Gewusst', u: 'saß' },
  { g: 4, t: 'Sofort', u: 'im Schlaf' }
];
const STUFENNAMEN = [
  { n: 'Vorgerechnet', b: 'Du siehst jeden Schritt mit Zahl und Erklaerung. Nur lesen und verstehen.' },
  { n: 'Letzter Schritt selbst', b: 'Alles vorgerechnet bis auf den Schluss. Der erste kleine Sprung.' },
  { n: 'Zweite Haelfte selbst', b: 'Die Stuetzen verschwinden von hinten nach vorn.' },
  { n: 'Alles selbst', b: 'Nur die Eingangsdaten stehen da. Du rechnest die ganze Kette.' },
  { n: 'Blind', b: 'Du musst vor jedem Schritt auch sagen, welcher Schritt jetzt dran ist.' }
];

/* ----------------------------------------------------------- Wegweiser */
function zeige(ziel, arg) {
  if (ANSICHT === 'pruefung-frage' && ziel !== 'pruefung-frage') stoppUhr();
  ANSICHT = ziel;
  GESETZ_ARG = arg;
  const b = $('#buehne');
  b.innerHTML = '';
  window.scrollTo(0, 0);
  const haupt = { start: 'start', karte: 'start', lernen: 'start', 'lern-karte': 'start', 'lern-ende': 'start',
    rechnen: 'rechnen', 'rechnen-stufe': 'rechnen', lauf: 'rechnen', 'lauf-ende': 'rechnen', uebersicht: 'rechnen',
    pruefung: 'pruefung', 'pruefung-frage': 'pruefung', 'pruefung-pruefen': 'pruefung', 'pruefung-ergebnis': 'pruefung',
    mehr: 'mehr', bilder: 'mehr', einstellungen: 'mehr', hilfe: 'mehr', palast: 'mehr', 'palast-gang': 'mehr',
    gesetz: 'mehr', 'gesetz-text': 'mehr', plaene: 'start' }[ziel] || 'start';
  document.querySelectorAll('#leiste button').forEach(x => x.classList.toggle('an', x.dataset.ziel === haupt));
  $('#zurueck').hidden = ['start', 'rechnen', 'pruefung', 'mehr'].indexOf(ziel) >= 0;
  ({ start: vStart, lernen: vLernen, 'lern-karte': vLernKarte, 'lern-ende': vLernEnde,
     rechnen: vRechnen, 'rechnen-stufe': vRechnenStufe, lauf: vLauf, 'lauf-ende': vLaufEnde, uebersicht: vUebersicht,
     pruefung: vPruefung, 'pruefung-frage': vPruefungFrage, 'pruefung-pruefen': vPruefungPruefen,
     'pruefung-ergebnis': vPruefungErgebnis, palast: vPalast, 'palast-gang': vPalastGang,
     mehr: vMehr, bilder: vBilder, einstellungen: vEinstellungen, hilfe: vHilfe,
     karte: vKarte, gesetz: vGesetz, 'gesetz-text': vGesetzText,
     plaene: vKapitelPlaene })[ziel](b, arg);
  faelligZaehlen();
}
function kopf(titel, sub) { $('#kopftitel').textContent = titel; $('#kopfsub').textContent = sub || ''; }
function faelligZaehlen() {
  const n = stapel(STAND.einst.fach).filter(c => istFaellig(c.id) && !istNeu(c.id)).length;
  const m = $('#faellig');
  if (m) m.textContent = n > 99 ? '99+' : (n || '');
}

/* Serie, Punkte und heutige Karten in einer Zeile. Sie steht direkt unter dem
   Startknopf, weil die Rückmeldung sofort sichtbar sein muss: Bei ADHS werden
   späte Belohnungen stärker abgewertet, und genau das lässt sich durch dichte,
   unmittelbare Rückmeldung ausgleichen. */
function belohnungsZeile() {
  const d = el('div', 'belohnung');
  const s = serie(), h = STAND.tage[heute()] || 0;
  [[s ? '\u{1F525}' : '\u{1F331}', s, s === 1 ? 'Tag in Folge' : 'Tage in Folge'],
   ['✓', h, 'heute'],
   ['★', STAND.punkte || 0, 'Punkte']].forEach(([sym, wert, txt]) => {
    const e = el('div');
    e.appendChild(el('span', 'sym', sym));
    e.appendChild(el('b', null, String(wert)));
    e.appendChild(el('span', 'txt', txt));
    d.appendChild(e);
  });
  return d;
}

/* ================================================================ HEUTE */
/* Der Startbildschirm hat genau eine Aufgabe: ohne eine einzige Entscheidung
   ins Lernen führen. Alles, was nicht dazu beiträgt, liegt zugeklappt oder
   eine Ebene tiefer. Grund: Bei ADHS ist die Hürde das Anfangen, und jede
   sichtbare Wahlmöglichkeit davor ist eine Hürde mehr. */
function vStart(b) {
  kopf('Heute', 'Ein Knopf, dann bist du drin');
  const z = zahlen(stapel(STAND.einst.fach).map(c => c.id));

  if (UEBERNAHME_MELDUNG) { hinweis(UEBERNAHME_MELDUNG); UEBERNAHME_MELDUNG = null; }

  const g = STAND.einst.rundenGroesse;
  if (STAND.laufendeRunde) {
    const kn = el('button', 'losknopf weiter');
    const r = STAND.laufendeRunde;
    kn.appendChild(el('b', null, 'Weiter in der Runde'));
    kn.appendChild(el('span', null, 'Karte ' + (r.i + 1) + ' von ' + r.gesamt + '  ·  da warst du stehengeblieben'));
    kn.onclick = () => { LERN = STAND.laufendeRunde; zeige('lern-karte'); };
    b.appendChild(kn);
  } else {
    /* Die Zahl auf dem Knopf wird vorher wirklich ausgerechnet. Steht dort 7,
       kommen auch 7 - sonst waere die Ziellinie schon vor dem Start gelogen. */
    const echt = warteschlange(STAND.einst.fach, 'plan', g).length;
    const kn = el('button', 'losknopf');
    kn.disabled = !echt;
    kn.appendChild(el('b', null, echt ? 'Los geht’s' : 'Heute ist alles erledigt'));
    kn.appendChild(el('span', null, echt
      ? echt + (echt === 1 ? ' Karte' : ' Karten') + '  ·  rund ' + Math.max(1, Math.round(echt * 0.45)) + ' Minuten'
      : 'Morgen geht es weiter. Zu frueh zu wiederholen bringt weniger.'));
    if (echt) kn.onclick = () => starteLernen(STAND.einst.fach, 'plan', STAND.einst.stil);
    b.appendChild(kn);
  }

  /* Die eine Zeile, die der Startbildschirm vorher nicht hatte: sie sagt, dass
     dieser Knopf das Lernen IST und alles andere Zubehör. */
  const satz = el('p', 'satz');
  satz.appendChild(document.createTextNode('Das hier ist das Lernen. Mehr musst du nicht anfassen. '));
  const lnk = el('a', null, 'Wofür ist der Rest da?');
  lnk.href = '#';
  lnk.onclick = (e) => { e.preventDefault(); zeige('karte'); };
  satz.appendChild(lnk);
  b.appendChild(satz);

  /* Ein neues Kapitel steht so lange offen sichtbar, bis es einmal offen war.
     Danach wandert es zu den anderen Wegen ins Zugeklappte - ein Startbildschirm
     darf nicht mit jeder Neuerung wachsen. */
  if (!STAND.blpGesehen) {
    const kn = el('button', 'kachel');
    kn.style.borderLeftColor = 'var(--m-gruen)';
    const kz = el('div', 'kachelkopf');
    kz.appendChild(el('b', null, 'Neues Kapitel: die zwei Pläne'));
    kz.appendChild(el('span', 'marke gruen', 'einmal ansehen'));
    kn.appendChild(kz);
    kn.appendChild(el('small', null, 'Flächennutzungsplan und Bebauungsplan — mit Bild, Gegenüberstellung und Fällen. Danach kommen die Karten in deinen Plan.'));
    kn.onclick = () => zeige('plaene');
    b.appendChild(kn);
  }

  if (STAND.laufendePruefung) {
    const kn = el('button', 'kachel');
    kn.style.borderLeftColor = 'var(--akzent)';
    kn.appendChild(el('b', null, 'Angefangene Prüfung fortsetzen'));
    kn.appendChild(el('small', null, 'Frage ' + (STAND.laufendePruefung.i + 1) + ' von ' + STAND.laufendePruefung.anzahl));
    kn.onclick = () => { PR = STAND.laufendePruefung; zeige(PR.noten ? 'pruefung-pruefen' : 'pruefung-frage'); };
    b.appendChild(kn);
  }

  if (STAND.einst.belohnung === 'deutlich') b.appendChild(belohnungsZeile());

  /* Fortschritt zum Zieldatum: eine Zeile, ein Balken. Die fünf Boxen waren an
     dieser Stelle fünf Zahlen, die nichts entscheiden - sie liegen jetzt unten
     zugeklappt. */
  const k = el('div', 'schritt');
  const kz = el('div', 'kopfz');
  kz.appendChild(el('span', 'wort', z.prozent + ' % sitzen sicher'));
  kz.appendChild(el('span', 'lt', z.sicher + ' von ' + z.gesamt));
  k.appendChild(kz);
  const fo = el('div', 'fortschritt');
  const fi = el('i'); fi.style.width = z.prozent + '%';
  fo.appendChild(fi); k.appendChild(fo);
  k.appendChild(el('p', 'formel', z.tageBis <= 1 ? 'Zieldatum ist heute: ' + datumText(STAND.einst.zielDatum)
    : 'Noch ' + z.tageBis + ' Tage bis ' + datumText(STAND.einst.zielDatum) + '. Dafür ' + z.proTag + ' Karten am Tag.'));
  /* Das Zieldatum bestimmt das Tagespensum. Steht dort der falsche Tag, rechnet
     die App am Ziel vorbei - deshalb fuehrt ein Tipp darauf direkt dorthin. */
  k.style.cursor = 'pointer';
  k.title = 'Zieldatum aendern';
  k.onclick = () => zeige('einstellungen');
  b.appendChild(k);

  /* Zugeklappt: die Zahlen. Wer sie sehen will, sieht sie; wer nur lernen will,
     wird nicht von ihnen angesprungen. */
  const d1 = el('details', 'aufklapp');
  d1.appendChild(el('summary', null, 'Zahlen zum Lernstand'));
  const bx = el('div', 'boxen');
  ['neu', '1', '2', '3', 'sicher'].forEach((t, i) => {
    const n = i === 4 ? (z.boxen[4] + z.boxen[5]) : z.boxen[i];
    const d = el('div', i === 4 ? 'gut' : (i === 0 ? 'leise' : ''));
    d.appendChild(el('b', null, String(n)));
    d.appendChild(el('span', null, i === 0 ? 'neu' : (i === 4 ? 'sicher' : 'Box ' + t)));
    bx.appendChild(d);
  });
  d1.appendChild(bx);
  d1.appendChild(el('p', 'hin', 'Eine Karte wandert mit jeder richtigen Antwort eine Box weiter, und der Abstand bis zur nächsten Frage wächst mit. Box 4 und 5 heißen sicher.'));
  d1.appendChild(el('p', 'hin', 'Heute schon ' + z.heuteGemacht + ' Karten bewertet. Im Vorrat: ' + z.faellig + ' fällig, ' + z.neu + ' noch nie gesehen.'));
  if (STAND.pruefungen.length) {
    const t = el('table', 'tabelle');
    STAND.pruefungen.slice(-6).reverse().forEach(p => {
      const r = el('tr');
      r.appendChild(el('td', null, datumText(p.datum)));
      r.appendChild(el('td', null, p.anzahl + ' Fragen'));
      const e = el('td', null, p.prozent + ' %  ' + (p.bestanden ? 'bestanden' : 'nicht bestanden'));
      e.style.color = p.bestanden ? 'var(--gut)' : 'var(--schlecht)';
      r.appendChild(e);
      t.appendChild(r);
    });
    d1.appendChild(t);
  }
  b.appendChild(d1);

  /* Zugeklappt: die anderen Wege. Jeder mit einer ehrlichen Marke, ob er zum
     Kartenplan zählt oder daneben läuft - genau das war vorher nicht zu sehen. */
  const d2 = el('details', 'aufklapp');
  d2.appendChild(el('summary', null, 'Heute mal etwas anderes'));
  nebenwege().forEach(x => d2.appendChild(x));
  b.appendChild(d2);

  const f = el('div', 'fuss');
  f.innerHTML = 'Alles liegt nur auf diesem Gerät. Fachliche Grundlage der Rechenwege: amtlicher Text der ImmoWertV. ' +
    'Die Merkbilder sind dieselben wie im <a href="https://koerner94.github.io/immowertv-hoerbuch/">ImmoWertV-Podcast</a>. ' +
    '<a href="#" id="zurHilfe">Wie diese App funktioniert</a>';
  b.appendChild(f);
  $('#zurHilfe').onclick = (e) => { e.preventDefault(); zeige('hilfe'); };
}

/* Die vier Nebenwege als Kacheln. Steht an einer Stelle, damit Startbildschirm
   und Übersicht nie auseinanderlaufen. */
function nebenwege() {
  const raus = [];
  [['Rundgang durchs Haus', 'einmal vorbereiten', 'gelb',
    'Die 28 Paragrafen an festen Stationen. Einmal ablaufen, danach fragt dich das Lernen dazu ab.', () => zeige('palast')],
   ['Rechenwege üben', 'eigenes Training', 'rot',
    'Bodenwert, Vergleich, Ertrag, Sachwert Schritt für Schritt. Läuft neben dem Kartenplan, nicht darin.', () => zeige('rechnen')],
   ['Prüfung simulieren', 'Messung, kein Lernen', 'blau',
    'Mit Uhr und Punkten. Zeigt dir, wo du stehst. Einmal in der Woche reicht.', () => zeige('pruefung')],
   ['Kapitel: die zwei Pläne', 'zählt mit', 'gruen',
    'Flächennutzungsplan und Bebauungsplan nebeneinander — Bild, Gegenüberstellung, Fälle.', () => zeige('plaene')],
   ['Nur ein Fach lernen', 'zählt mit', 'gruen',
    'Sonst entscheidet der Plan, und gemischt ist nachweislich wirksamer. Aber manchmal muss man gezielt ran.', () => zeige('lernen')]
  ].forEach(([t, marke, farbe, u, fn]) => {
    const k = el('button', 'kachel');
    k.style.borderLeftColor = 'var(--m-' + farbe + ')';
    const kopfz = el('div', 'kachelkopf');
    kopfz.appendChild(el('b', null, t));
    kopfz.appendChild(el('span', 'marke ' + farbe, marke));
    k.appendChild(kopfz);
    k.appendChild(el('small', null, u));
    k.onclick = fn;
    raus.push(k);
  });
  return raus;
}

/* ========================================================= WAS IST WAS? */
/* Eine Seite, die nichts kann ausser erklären, was wofür da ist - und die die
   Frage beantwortet, ob Herumklicken schon Lernen ist. */
function vKarte(b) {
  kopf('Was ist was?', 'Die ganze App auf einer Seite');

  b.appendChild(el('p', 'satz', 'Die App hat vier Teile. Einer davon ist das Lernen. Die anderen drei kannst du ignorieren, bis du sie brauchst.'));

  const haupt = el('div', 'bildkarte');
  const hk = el('div', 'kachelkopf');
  hk.appendChild(el('div', 'wort', '1. Heute'));
  hk.appendChild(el('span', 'marke gruen', 'das ist das Lernen'));
  haupt.appendChild(hk);
  haupt.appendChild(el('p', null, 'Ein Knopf. Er entscheidet alles vor: welche Karten, welche Frageart, wie viele. Du tippst und bist drin. Wenn du in dieser App nie etwas anderes anfasst, lernst du trotzdem richtig — das hier ist der Weg, alles andere ist Zubehör.'));
  haupt.appendChild(el('p', 'hin', 'Warum ausgerechnet so: Abrufen statt Nachlesen und verteiltes Wiederholen sind die beiden einzigen Techniken, die in den grossen Übersichtsarbeiten die Bestnote bekommen. Genau diese beiden stecken in dem Knopf.'));
  b.appendChild(haupt);

  [['2. Rechnen', 'eigenes Training', 'rot',
    'Die vier Rechenwege der ImmoWertV, Schritt für Schritt. Stufe 0 rechnet dir alles vor, danach verschwinden die Stützen von hinten nach vorn, bis du die Kette allein rechnest.',
    'Das ist Training für die Rechenaufgaben in der Prüfung. Es läuft neben dem Kartenplan her und ersetzt ihn nicht.'],
   ['3. Prüfung', 'Messung, kein Lernen', 'blau',
    'Simulation mit Uhr, Punkten und Bestehensgrenze — im Format der DEKRA-Prüfung.',
    'Eine Messung ist kein Lernen. Sie sagt dir, wo du stehst, und schickt hinterher alles Falsche zurück in den Kartenstapel. Einmal in der Woche reicht.'],
   ['4. Mehr', 'Nachschlagen', 'grau',
    'Der Rundgang durchs Haus, alle Merkbilder, die Spickzettel zu den vier Rechenwegen, die Einstellungen.',
    'Hier wird nichts abgefragt. Das ist zum Anschauen, wenn du etwas suchst.']
  ].forEach(([t, marke, farbe, was, wann]) => {
    const d = el('div', 'bildkarte');
    const kz = el('div', 'kachelkopf');
    kz.appendChild(el('div', 'wort', t));
    kz.appendChild(el('span', 'marke ' + farbe, marke));
    d.appendChild(kz);
    d.appendChild(el('p', null, was));
    d.appendChild(el('p', 'hin', wann));
    b.appendChild(d);
  });

  b.appendChild(el('h2', null, 'Lerne ich, wenn ich einfach irgendwo hinklicke?'));
  const a = el('div', 'bildkarte');
  a.appendChild(el('p', null, 'Teils. Jedes Mal, wenn du eine Antwort erst selbst versuchst und dann aufdeckst, lernst du wirklich — egal an welcher Stelle der App. Das ist der bestbelegte Effekt, den es gibt.'));
  a.appendChild(el('p', null, 'Was beim Herumklicken aber verlorengeht, ist der Plan: welche Karte wann wieder drankommt. Diesen Teil macht nur der Knopf auf dem Startbildschirm. Er sucht genau die Karten heraus, die du gerade fast vergessen hättest.'));
  a.appendChild(el('p', null, 'Kurz: Klicken schadet nie. Aber eine Runde am Tag über den Knopf bringt mehr als eine Stunde Herumstöbern.'));
  b.appendChild(a);

  b.appendChild(el('h2', null, 'Wenn du nur eine Sache mitnimmst'));
  const o = el('div', 'bildkarte');
  ['Einmal am Tag die App öffnen und den grossen Knopf drücken. Fertig.',
   'Den Rundgang einmal ganz ablaufen — danach fragt dich das Lernen die Paragrafen ab.',
   'Einmal in der Woche eine Prüfung, damit du siehst, wo du stehst.'
  ].forEach((t, i) => o.appendChild(el('p', null, (i + 1) + '. ' + t)));
  b.appendChild(o);

  const w = el('button', 'knopf breit', 'Verstanden — zum Lernen');
  w.style.marginTop = '1rem';
  w.onclick = () => { STAND.einst.karteGesehen = true; sichern(); zeige('start'); };
  b.appendChild(w);

  const mehr = el('p', 'hin');
  mehr.style.marginTop = '.8rem';
  const l2 = el('a', null, 'Ausführlich: warum die App so gebaut ist');
  l2.href = '#';
  l2.onclick = (e) => { e.preventDefault(); zeige('hilfe'); };
  mehr.appendChild(l2);
  b.appendChild(mehr);
}

/* =============================================================== LERNEN */
function fachWahl(aktuell, beiWahl, mitAlle) {
  const w = el('div', 'knoepfe');
  const faecher = faecherMitAnzahl();
  /* "Alle" muss dasselbe zaehlen wie die Faecher darunter - ruhende eigene
     Karten und noch nicht begangene Palast-Stationen gehoeren nicht dazu. */
  const alleAnzahl = faecher.reduce((s, f) => s + f.anzahl, 0);
  const eintraege = (mitAlle === false ? [] : [{ id: 'alle', name: 'Alle Fächer', anzahl: alleAnzahl }]).concat(faecher);
  eintraege.forEach(f => {
    const kn = el('button', null, f.name + '  ' + f.anzahl);
    kn.setAttribute('aria-pressed', String(f.id === aktuell));
    kn.onclick = () => beiWahl(f.id);
    w.appendChild(kn);
  });
  return w;
}

function vLernen(b) {
  kopf('Die Lernrunde einstellen', 'Nur nötig, wenn du gezielt etwas willst');
  const e = STAND.einst;
  b.appendChild(el('p', 'satz', 'Diese Seite brauchst du normalerweise nicht. Der Knopf auf dem Startbildschirm entscheidet das alles schon.'));

  b.appendChild(el('h2', null, 'Fach'));
  b.appendChild(fachWahl(e.fach, f => { e.fach = f; sichern(); zeige('lernen'); }));

  b.appendChild(el('h2', null, 'Wie fragen?'));
  const st = el('div', 'knoepfe');
  [['mc', 'Vier zur Auswahl'], ['frei', 'Freie Antwort']].forEach(([id, t]) => {
    const kn = el('button', null, t);
    kn.setAttribute('aria-pressed', String(e.stil === id));
    kn.onclick = () => { e.stil = id; sichern(); zeige('lernen'); };
    st.appendChild(kn);
  });
  b.appendChild(st);

  b.appendChild(el('h2', null, 'Wie lang soll eine Runde sein?'));
  b.appendChild(el('p', 'hin', 'Kurz ist besser als viel. Eine Runde mit sichtbarem Ende fängt man an; ein offener Stapel nicht.'));
  const rg = el('div', 'knoepfe');
  [5, 7, 10, 15, 20].forEach(n => {
    const kn = el('button', null, n + ' Karten');
    kn.setAttribute('aria-pressed', String(e.rundenGroesse === n));
    kn.onclick = () => { e.rundenGroesse = n; sichern(); zeige('lernen'); };
    rg.appendChild(kn);
  });
  b.appendChild(rg);

  const z = zahlen(stapel(e.fach).map(c => c.id));
  b.appendChild(el('p', 'hin', z.faellig + ' fällig, ' + z.neu + ' noch nie gesehen, ' + z.sicher + ' sitzen sicher.'));

  const k1 = el('button', 'kachel');
  k1.style.borderLeftColor = 'var(--gut)';
  k1.appendChild(el('b', null, 'Runde starten'));
  k1.appendChild(el('small', null, e.rundenGroesse + ' Karten, schwerste zuerst. Was nicht hineinpasst, wartet auf die nächste Runde.'));
  k1.onclick = () => starteLernen(e.fach, 'plan', e.stil);
  b.appendChild(k1);

  const k2 = el('button', 'kachel');
  k2.style.borderLeftColor = 'var(--leise)';
  k2.appendChild(el('b', null, 'Freies Üben'));
  k2.appendChild(el('small', null, 'Auch ' + e.rundenGroesse + ' Karten, aber quer durch das Fach statt nach Plan. Zählt ganz normal mit.'));
  k2.onclick = () => starteLernen(e.fach, 'frei', e.stil);
  b.appendChild(k2);
}

function starteLernen(fach, modus, stil, grenze) {
  const g = grenze || STAND.einst.rundenGroesse;
  const q = warteschlange(fach, modus, g);
  if (!q.length) { hinweis('Nichts fällig — heute ist alles erledigt.'); return; }
  LERN = { q, i: 0, auf: false, wahl: null, opts: {}, stil, fach, modus, gesamt: q.length,
           gezaehlt: { 1: 0, 2: 0, 3: 0, 4: 0 }, punkte: 0, start: Date.now() };
  /* Die Runde wird mitgespeichert. Eine Unterbrechung darf nie Arbeit kosten —
     genau daran scheitert sonst der zweite Anlauf. */
  STAND.laufendeRunde = LERN;
  sichern();
  zeige('lern-karte');
}

function vLernKarte(b) {
  if (!LERN || LERN.i >= LERN.q.length) { zeige('lern-ende'); return; }
  const id = LERN.q[LERN.i], c = NACH_ID[id], k = STAND.karten[id];
  kopf('Lernen', (LERN.i + 1) + ' von ' + LERN.gesamt + '  ·  ' + fachName(c.fach));

  /* Ziellinie: ein Punkt je Karte, gefüllte liegen hinter dir. Anders als ein
     Balken zeigt das auf einen Blick, wie wenige es noch sind. */
  const zl = el('div', 'ziellinie');
  for (let n = 0; n < LERN.gesamt; n++) {
    const p = el('i', n < LERN.i ? 'voll' : (n === LERN.i ? 'jetzt' : ''));
    zl.appendChild(p);
  }
  b.appendChild(zl);

  /* Eine Karte, die du noch nie gesehen hast, wird NICHT abgefragt, sondern
     gezeigt. Vier Antworten zu einer Sache, von der man noch nichts gehoert
     hat, sind reines Raten - das lehrt nichts und aergert nur. Beim naechsten
     Mal kommt sie dann als richtige Frage. */
  const neuling = istNeu(id);
  if (neuling) LERN.auf = true;

  const kf = el('div', 'karte-frage' + (neuling ? ' neuling' : ''));
  const marken = el('div', 'marken');
  const sym = symbolFuer(c);
  if (sym) marken.appendChild(el('span', 'marke sym', sym));
  marken.appendChild(el('span', 'marke', c.thema));
  marken.appendChild(el('span', 'marke', neuling ? 'zum ersten Mal' : 'Box ' + boxVon(k)));
  kf.appendChild(marken);
  /* Die Paragrafen der Karte, zum Antippen. Nachschlagen muss billiger sein als
     Weiterraten - sonst liest man den Wortlaut nie. */
  const gm = gesetzesMarken(c);
  if (gm) kf.appendChild(gm);
  if (neuling) kf.appendChild(el('div', 'neuhinweis', 'Neue Karte — einmal in Ruhe ansehen. Abgefragt wird sie beim nächsten Mal.'));
  kf.appendChild(el('div', 'f', c.f));

  if (neuling) {
    kf.appendChild(el('div', 'a', c.a));
  } else if (LERN.stil === 'mc' && !c.nurFrei) {
    if (!LERN.opts[id]) LERN.opts[id] = mcOptionen(id);
    const w = el('div', 'wahl');
    LERN.opts[id].forEach((oid, i) => {
      const kn = el('button');
      const kopfzeile = el('div', 'obuchstabe', 'ABCD'[i]);
      kn.appendChild(kopfzeile);
      const txt = NACH_ID[oid].a.replace(/\s+/g, ' ');
      /* Voller Text, immer. Abgeschnittene Antworten zwingen zum Antippen,
         und Antippen ist hier die Antwort - man kann dann nicht lesen, ohne
         sich festzulegen. */
      kn.appendChild(el('div', 'otext', txt));
      if (LERN.auf) {
        if (oid === id) kn.classList.add('gut');
        else if (oid === LERN.wahl) kn.classList.add('schlecht');
        kn.disabled = true;
      } else {
        kn.onclick = () => { LERN.wahl = oid; LERN.auf = true; zeige('lern-karte'); };
      }
      w.appendChild(kn);
    });
    kf.appendChild(w);
    if (LERN.auf && LERN.wahl !== id) {
      const r = el('div', 'rueck schlecht');
      r.appendChild(el('b', null, 'Daneben. Die Karte kommt heute noch einmal.'));
      r.appendChild(el('span', null, 'Lies die richtige Antwort oben in Ruhe durch.'));
      kf.appendChild(r);
    }
  } else if (!LERN.auf) {
    const kn = el('button', 'knopf breit', 'Antwort zeigen');
    kn.style.marginTop = '1rem';
    kn.onclick = () => { LERN.auf = true; zeige('lern-karte'); };
    kf.appendChild(kn);
    kf.appendChild(el('p', 'hin', 'Sag die Antwort erst laut. Der Versuch ist der Teil, der wirkt — auch wenn er danebengeht.'));
  } else {
    kf.appendChild(el('div', 'a', c.a));
  }

  if (LERN.auf) {
    const mh = merkhilfe(c);
    if (mh) kf.appendChild(mh);

    /* Karte abhaken. Wichtig: Die Runde bleibt genau so lang, wie sie versprochen
       war. Eine nicht gewusste Karte kommt noch einmal dran, dafür rutscht die
       letzte noch nicht gezeigte Karte heraus — sonst wäre die Ziellinie gelogen,
       und eine Ziellinie, die sich verschiebt, ist schlimmer als keine. */
    const abhaken = (note) => {
      const k = bewerten(id, note);
      LERN.gezaehlt[note]++;
      LERN.punkte = (LERN.punkte || 0) + (k.punkte || 0);
      /* Zwei Faelle kommen in derselben Runde noch einmal dran:
         was du nicht wusstest, und was du gerade zum ersten Mal gesehen hast.
         Gerade bei neuen Karten ist das der Kern der Sache - erst ansehen, dann
         kurz darauf wirklich abrufen. Jede Karte aber nur EIN zweites Mal, und
         die Runde bleibt genau so lang wie versprochen: fuer jede nachgereichte
         Karte faellt hinten eine noch nicht gezeigte heraus. */
      LERN.nochmal = LERN.nochmal || {};
      const wiederholen = (note === 1 || neuling) && !LERN.nochmal[id];
      if (wiederholen && LERN.q.indexOf(id, LERN.i + 1) < 0 && LERN.q.length - LERN.i > 2) {
        LERN.nochmal[id] = 1;
        LERN.q.pop();
        LERN.q.splice(Math.min(LERN.i + 3, LERN.q.length), 0, id);
      }
      LERN.i++; LERN.auf = false; LERN.wahl = null; LERN.vertippt = false;
      punkteZeigen(k.punkte);        // auch bei der letzten Karte der Runde
      if (LERN.i >= LERN.q.length) { STAND.laufendeRunde = null; sichern(); zeige('lern-ende'); }
      else { sichern(); zeige('lern-karte'); }
    };

    if (!neuling && LERN.stil === 'mc' && !c.nurFrei && LERN.wahl !== id && !LERN.vertippt) {
      /* Falsch angetippt: die Note steht damit fest, es gibt nichts zu bewerten. */
      const w = el('button', 'knopf breit', 'Weiter');
      w.style.marginTop = '1rem';
      w.onclick = () => abhaken(1);
      kf.appendChild(w);
      /* Ausweg fuer den Fehlgriff: wer danebengetippt hat, obwohl er es wusste,
         soll das sagen duerfen. Sonst bestraft die App das Tippen statt das
         Nichtwissen - und der Plan rechnet mit falschen Zahlen weiter. */
      const v = el('button', 'knopf stumm breit', 'Vertippt — ich bewerte selbst');
      v.style.marginTop = '.6rem';
      v.onclick = () => { LERN.vertippt = true; zeige('lern-karte'); };
      kf.appendChild(v);
    } else {
      if (neuling) kf.appendChild(el('p', 'hin', 'Wie gut kanntest du das schon?'));
      const n = el('div', 'noten');
      NOTEN.forEach(x => {
        const kn = el('button');
        kn.appendChild(document.createTextNode(x.t));
        kn.appendChild(el('small', null, x.u));
        kn.onclick = () => abhaken(x.g);
        n.appendChild(kn);
      });
      kf.appendChild(n);
      if (!neuling && LERN.stil === 'mc' && !c.nurFrei) {
        const df = el('button', 'knopf stumm breit', 'Doch nicht gewusst, nur geraten');
        df.style.marginTop = '.6rem';
        df.onclick = () => abhaken(1);
        kf.appendChild(df);
      }
    }
  }
  b.appendChild(kf);

  const bd = el('button', 'knopf stumm breit', 'Runde hier beenden');
  bd.style.marginTop = '1.2rem';
  bd.onclick = () => { STAND.laufendeRunde = null; sichern(); zeige('lern-ende'); };
  b.appendChild(bd);
}

const PAUSENIDEEN = [
  'Steh einmal auf und streck dich. Eine Minute reicht.',
  'Geh kurz ans Fenster und schau in die Ferne.',
  'Hol dir ein Glas Wasser, bevor du weitermachst.',
  'Lauf einmal durch den Flur und wieder zurück.',
  'Schüttel die Hände aus und roll die Schultern.'
];

function vLernEnde(b) {
  const g = LERN ? LERN.gezaehlt : { 1: 0, 2: 0, 3: 0, 4: 0 };
  const summe = g[1] + g[2] + g[3] + g[4];
  const rundenPunkte = LERN ? (LERN.punkte || 0) : 0;
  const dauer = LERN && LERN.start ? Math.round((Date.now() - LERN.start) / 1000) : 0;
  const fach = LERN ? LERN.fach : STAND.einst.fach;
  kopf('Geschafft', summe + (summe === 1 ? ' Karte' : ' Karten'));

  /* Zuerst der Haken, dann die Zahlen. Die Runde soll sich abgeschlossen
     anfühlen, nicht wie eine Zwischenbilanz auf dem Weg zu 450. */
  const k = el('div', 'schritt abschluss');
  k.appendChild(el('div', 'haken', '✓'));
  k.appendChild(el('h3', null, 'Runde fertig'));
  const gewusst = g[3] + g[4];
  k.appendChild(el('p', 'formel', gewusst + ' von ' + summe + ' saßen' +
    (dauer ? '  ·  ' + (dauer >= 60 ? Math.floor(dauer / 60) + ' Minuten ' + (dauer % 60) + ' Sekunden' : dauer + ' Sekunden') : '')));

  if (STAND.einst.belohnung === 'deutlich') {
    const s = serie();
    const r = el('div', 'rueck gut');
    r.appendChild(el('b', null, '+' + rundenPunkte + ' Punkte'));
    r.appendChild(el('span', null, s > 1
      ? s + ' Tage in Folge. Morgen wieder eine Runde, dann reißt die Serie nicht.'
      : 'Das ist Tag 1 deiner Serie. Eine Runde morgen genügt, um sie zu halten.'));
    k.appendChild(r);
  }
  b.appendChild(k);

  const p = el('div', 'bildkarte');
  p.appendChild(el('div', 'lt', 'Kurz aufstehen'));
  p.appendChild(el('p', null, PAUSENIDEEN[Math.floor(Math.random() * PAUSENIDEEN.length)]));
  b.appendChild(p);

  const z = zahlen(stapel(fach).map(c => c.id));
  LERN = null;

  if (z.faellig || z.neu) {
    const kn = el('button', 'kachel');
    kn.style.borderLeftColor = 'var(--gut)';
    kn.appendChild(el('b', null, 'Noch eine Runde'));
    kn.appendChild(el('small', null, 'Wieder ' + STAND.einst.rundenGroesse + ' Karten. Nur wenn du magst — die Runde eben hat schon gezählt.'));
    kn.onclick = () => starteLernen(fach, 'plan', STAND.einst.stil);
    b.appendChild(kn);
  }
  const z2 = el('button', 'kachel');
  z2.style.borderLeftColor = 'var(--leise)';
  z2.appendChild(el('b', null, 'Für jetzt reicht es'));
  z2.appendChild(el('small', null, 'Zurück zu Heute. Aufhören, solange es noch leicht fällt, ist keine Schwäche.'));
  z2.onclick = () => zeige('start');
  b.appendChild(z2);
}

/* ============================================================== RECHNEN */
function sollWerte(kette) {
  const w = {};
  kette.schritte.forEach(s => { w[s.id] = s.rechnen ? s.rechnen(w) : s.wert; });
  return w;
}
const stufeVon = (kid) => STAND.stufen[kid] || 0;

function vRechnen(b) {
  kopf('Rechnen', 'Die Rechenwege Schritt für Schritt');
  b.appendChild(el('p', 'hin', 'Wähle eine Kette. Ein Schritt je Bildschirm, mit Fundstelle, Merkbild und Erklärung daneben.'));
  KETTEN.forEach(kt => {
    const st = stufeVon(kt.id);
    const k = el('button', 'kachel');
    k.style.borderLeftColor = kt.farbe;
    k.appendChild(el('b', null, kt.name));
    k.appendChild(el('small', null, kt.untertitel));
    k.appendChild(el('div', 'zeile2', kt.schritte.length + ' Schritte  ·  Stufe ' + st + ': ' + STUFENNAMEN[st].n));
    k.onclick = () => zeige('rechnen-stufe', kt.id);
    b.appendChild(k);
  });
}

function vRechnenStufe(b, kid) {
  const kt = KETTEN.find(x => x.id === kid);
  kopf(kt.name, kt.untertitel);
  b.appendChild(el('p', 'hin', kt.kurz));
  const o = el('div', 'bildkarte');
  o.appendChild(el('div', 'lt', 'Das Beispielobjekt'));
  o.appendChild(el('p', null, kt.objekt));
  b.appendChild(o);

  b.appendChild(el('h2', null, 'Stufe wählen'));
  b.appendChild(el('p', 'hin', 'Die Stützen verschwinden von hinten nach vorn. Fang oben an und geh erst weiter, wenn eine Stufe ohne Fehler sitzt.'));
  const erreicht = stufeVon(kid);
  const max = kt.ohneZahlen ? 2 : 5;
  for (let s = 0; s < max; s++) {
    const nm = kt.ohneZahlen
      ? [{ n: 'Durchlesen', b: 'Die sechs Stationen mit Erklärung.' }, { n: 'Reihenfolge selbst', b: 'Du sagst vor jeder Station, was jetzt dran ist.' }][s]
      : STUFENNAMEN[s];
    const k = el('button', 'kachel');
    k.style.borderLeftColor = s <= erreicht ? kt.farbe : 'var(--linie)';
    k.appendChild(el('b', null, 'Stufe ' + s + ': ' + nm.n + (s === erreicht ? '   ◀ hier stehst du' : '')));
    k.appendChild(el('small', null, nm.b));
    k.onclick = () => { starteLauf(kid, s); zeige('lauf'); };
    b.appendChild(k);
  }

  b.appendChild(el('h2', null, 'Dazu passend'));
  const u = el('button', 'kachel');
  u.style.borderLeftColor = 'var(--leise)';
  u.appendChild(el('b', null, 'Die Karte dieser Kette'));
  u.appendChild(el('small', null, 'Alle Schritte auf einen Blick, mit Werten und Fundstellen.'));
  u.onclick = () => zeige('uebersicht', kid);
  b.appendChild(u);

  const p = el('a', 'kachel');
  p.style.borderLeftColor = 'var(--leise)';
  p.href = 'https://koerner94.github.io/immowertv-hoerbuch/rechenwege-' + String(kt.folge).padStart(2, '0') + '-085.mp3';
  p.appendChild(el('b', null, 'Podcast-Folge ' + kt.folge + ' zum Hören'));
  p.appendChild(el('small', null, 'Dieselbe Kette, dieselben Zahlen, dieselben Bilder. Tempo 0,85.'));
  b.appendChild(p);
}

function starteLauf(kid, stufe) {
  const kt = KETTEN.find(x => x.id === kid);
  const rechen = kt.schritte.filter(s => s.rechnen);
  let offenAb;
  if (kt.ohneZahlen || stufe === 0) offenAb = rechen.length;
  else if (stufe === 1) offenAb = Math.max(0, rechen.length - 1);
  else if (stufe === 2) offenAb = Math.max(0, rechen.length - Math.ceil(rechen.length / 2));
  else offenAb = 0;
  L = { kt, stufe, i: 0, soll: sollWerte(kt), werte: {},
        offen: new Set(rechen.slice(offenAb).map(s => s.id)),
        ordnungsfrage: (stufe >= 4) || (kt.ohneZahlen && stufe >= 1),
        fehler: 0, versuch: 0, gezeigt: false, ordnungOk: false, zettelGanz: false, start: Date.now() };
}

function vLauf(b) {
  const kt = L.kt, s = kt.schritte[L.i];
  kopf(kt.name, 'Schritt ' + (L.i + 1) + ' von ' + kt.schritte.length + '  ·  Stufe ' + L.stufe);

  const band = el('div', 'band');
  const idx = STUFEN.findIndex(x => x.id === s.stufe);
  STUFEN.forEach((st, i) => {
    const d = el('div', i === idx ? 'an' : (i < idx ? 'war' : ''), st.kurz);
    d.title = st.name;
    band.appendChild(d);
  });
  b.appendChild(band);
  b.appendChild(el('div', 'bandtext', STUFEN[idx].name));

  const fo = el('div', 'fortschritt');
  const fi = el('i'); fi.style.width = (L.i / kt.schritte.length * 100) + '%';
  fo.appendChild(fi); b.appendChild(fo);

  const z = el('div', 'zettel');
  const fertig = kt.schritte.slice(0, L.i);
  const ab = (L.zettelGanz || fertig.length <= 6) ? 0 : fertig.length - 5;
  if (ab > 0) {
    const auf = el('button', 'zettel-auf', '▸ ' + ab + ' weitere Schritte anzeigen');
    auf.onclick = () => { L.zettelGanz = true; zeige('lauf'); };
    z.appendChild(auf);
  }
  fertig.slice(ab).forEach((x, i) => {
    const r = el('button', 'zeile-fertig' + (x.id === kt.ergebnisId ? ' hoehepunkt' : ''));
    r.appendChild(el('span', 'nr', (ab + i + 1) + ''));
    r.appendChild(el('span', 'nm', x.name));
    r.appendChild(el('span', 'wt', fmt(L.werte[x.id], x.einheit)));
    r.onclick = () => zeigeSchrittFenster(x, L.werte[x.id]);
    z.appendChild(r);
  });
  b.appendChild(z);

  if (L.ordnungsfrage && !L.ordnungOk) { b.appendChild(ordnungsKarte(s)); return; }
  b.appendChild(schrittKarte(s));

  if (L.stufe <= 2 && !L.ordnungsfrage) {
    const rest = kt.schritte.slice(L.i + 1);
    if (rest.length) {
      b.appendChild(el('div', 'gruppe', 'was noch kommt'));
      rest.forEach((x, i) => {
        const r = el('div', 'zeile-kommend');
        r.appendChild(el('span', 'nr', (L.i + 2 + i) + ''));
        r.appendChild(el('span', 'nm', x.name));
        b.appendChild(r);
      });
    }
  }
}

function ordnungsKarte(s) {
  const kt = L.kt;
  const karte = el('div', 'schritt');
  karte.appendChild(el('h3', null, 'Was kommt jetzt?'));
  karte.appendChild(el('p', 'formel', 'Sag es dir zuerst selbst, dann tippe.'));
  const falsch = mischen(kt.schritte.filter(x => x.id !== s.id)).slice(0, 3);
  const w = el('div', 'wahl');
  mischen([s].concat(falsch)).forEach(x => {
    const kn = el('button');
    kn.appendChild(el('div', 'otext', x.name));
    kn.onclick = () => {
      if (x.id === s.id) { kn.classList.add('gut'); L.ordnungOk = true; setTimeout(() => zeige('lauf'), 260); }
      else { kn.classList.add('schlecht'); L.fehler++; kn.disabled = true; }
    };
    w.appendChild(kn);
  });
  karte.appendChild(w);
  return karte;
}

function schrittKarte(s) {
  const karte = el('div', 'schritt');
  const m = el('div', 'marken');
  m.appendChild(gesetzLink(s.paragraf, 'iw', String(s.pnr)));
  const bild = MERKBILDER[s.pnr];
  if (bild) {
    const mb = el('span', 'marke bild', 'Merkbild: ' + bild.wort);
    mb.onclick = () => fenster(bild.wort + '  ·  Paragraf ' + s.pnr, bild.szene);
    m.appendChild(mb);
  }
  karte.appendChild(m);
  karte.appendChild(el('h3', null, s.name));
  karte.appendChild(el('p', 'formel', s.formel));

  const offen = L.offen.has(s.id) && !L.gezeigt;

  if (s.zeile) {
    const r = el('div', 'rechnung');
    const rz = el('div', 'rz');
    const erl = [];
    s.zeile.forEach(tok => {
      if (typeof tok === 'string' && L.kt.schritte.some(x => x.id === tok)) {
        const q = L.kt.schritte.find(x => x.id === tok);
        const wert = L.werte[tok] !== undefined ? L.werte[tok] : L.soll[tok];
        const sp = el('span', 'zutat', fmt(wert, q.einheit));
        sp.title = q.name;
        sp.onclick = () => zeigeSchrittFenster(q, wert);
        rz.appendChild(sp);
        erl.push(q.name);
      } else if (typeof tok === 'object') {
        rz.appendChild(el('span', 'konst', zahl(tok.k, tok.k % 1 ? 2 : 0)));
        erl.push(tok.e);
      } else rz.appendChild(el('span', 'op', tok));
    });
    r.appendChild(rz);
    r.appendChild(el('span', 'erl', erl.join('  ·  ')));
    const e = el('div', 'ergebnis');
    e.appendChild(el('span', 'gl', '='));
    if (offen) {
      const inp = el('input');
      inp.type = 'text'; inp.inputMode = 'decimal'; inp.placeholder = 'dein Ergebnis'; inp.id = 'eingabe';
      inp.autocomplete = 'off';
      e.appendChild(inp);
      e.appendChild(el('span', 'eh', einheitKurz(s.einheit)));
    } else e.appendChild(el('span', 'wert', fmt(L.soll[s.id], s.einheit)));
    r.appendChild(e);
    karte.appendChild(r);
  } else if (s.wert !== undefined) {
    const r = el('div', 'rechnung');
    const e = el('div', 'ergebnis');
    e.style.cssText = 'border-top:0;padding-top:0;margin-top:0';
    e.appendChild(el('span', 'wert', fmt(s.wert, s.einheit)));
    r.appendChild(e);
    karte.appendChild(r);
  }

  const rueckPlatz = el('div');
  karte.appendChild(rueckPlatz);

  if (s.verweis) {
    const d = el('details', 'aufklapp');
    d.appendChild(el('summary', null, 'Wo kommt dieser Wert her?'));
    const i = el('div', 'inhalt');
    i.appendChild(el('span', null, 'Aus einer eigenen Rechenkette. '));
    i.appendChild(document.createElement('br'));
    const a = el('button', 'knopf stumm', 'Kette ' + KETTEN.find(x => x.id === s.verweis).name + ' ansehen');
    a.style.marginTop = '.4rem';
    a.onclick = () => zeige('uebersicht', s.verweis);
    i.appendChild(a);
    d.appendChild(i);
    karte.appendChild(d);
  }
  const dw = el('details', 'aufklapp');
  dw.appendChild(el('summary', null, 'Warum steht dieser Schritt hier?'));
  dw.appendChild(el('div', 'inhalt', s.warum));
  karte.appendChild(dw);
  if (s.weiter) {
    const d = el('details', 'aufklapp');
    d.appendChild(el('summary', null, 'Was passiert damit weiter?'));
    d.appendChild(el('div', 'inhalt', s.weiter));
    karte.appendChild(d);
  }
  if (s.falle) {
    const d = el('details', 'aufklapp warn');
    d.appendChild(el('summary', null, 'Typische Falle'));
    d.appendChild(el('div', 'inhalt', s.falle));
    karte.appendChild(d);
  }
  if (s.braucht && s.braucht.length) {
    const d = el('details', 'aufklapp');
    d.appendChild(el('summary', null, 'Womit hängt das zusammen?'));
    const i = el('div', 'inhalt');
    i.appendChild(el('div', null, 'Braucht: ' + s.braucht.map(x => L.kt.schritte.find(y => y.id === x).name).join(', ')));
    const fuettert = L.kt.schritte.filter(x => (x.braucht || []).indexOf(s.id) >= 0).map(x => x.name);
    i.appendChild(el('div', null, 'Geht weiter in: ' + (fuettert.length ? fuettert.join(', ') : 'nichts mehr, das ist ein Endwert')));
    d.appendChild(i);
    karte.appendChild(d);
  }

  const kr = el('div', 'knopfreihe');
  if (offen) {
    const pr = el('button', 'knopf', 'Prüfen');
    pr.onclick = () => pruefeEingabe(s, rueckPlatz, kr);
    kr.appendChild(pr);
    const zg = el('button', 'knopf stumm', 'Ich weiß nicht');
    zg.onclick = () => { L.gezeigt = true; L.fehler++; zeige('lauf'); };
    kr.appendChild(zg);
    setTimeout(() => { const i = $('#eingabe'); if (i) { i.focus(); i.onkeydown = (ev) => { if (ev.key === 'Enter') pr.click(); }; } }, 30);
  } else {
    const w = el('button', 'knopf breit', L.i + 1 < L.kt.schritte.length ? 'Weiter' : 'Kette abschließen');
    w.onclick = () => weiter(s);
    kr.appendChild(w);
  }
  karte.appendChild(kr);
  return karte;
}

function pruefeEingabe(s, rueckPlatz, kr) {
  const inp = $('#eingabe');
  const kandidaten = leseZahlen(inp.value);
  const soll = L.soll[s.id];
  if (!kandidaten.length) { inp.classList.add('falsch'); return; }
  if (kandidaten.some(g => Math.abs(g - soll) <= toleranz(s.einheit, soll))) {
    inp.classList.remove('falsch'); inp.classList.add('richtig'); inp.disabled = true;
    L.gezeigt = true;
    const r = el('div', 'rueck gut');
    r.appendChild(el('b', null, 'Richtig: ' + fmt(soll, s.einheit)));
    r.appendChild(el('span', null, 'Sag dir jetzt laut, warum ' + s.name + ' genau an dieser Stelle steht. Danach aufklappen und vergleichen.'));
    rueckPlatz.appendChild(r);
    kr.innerHTML = '';
    const w = el('button', 'knopf breit', L.i + 1 < L.kt.schritte.length ? 'Weiter' : 'Kette abschließen');
    w.onclick = () => weiter(s);
    kr.appendChild(w);
  } else {
    L.versuch++; L.fehler++;
    inp.classList.add('falsch');
    rueckPlatz.innerHTML = '';
    const r = el('div', 'rueck schlecht');
    if (L.versuch === 1) {
      r.appendChild(el('b', null, 'Noch nicht.'));
      r.appendChild(el('span', null, 'Prüfe die Formel: ' + s.formel + '. Und achte auf die Einheit: ' + (einheitKurz(s.einheit) || 'siehe oben') + '.'));
    } else {
      r.appendChild(el('b', null, 'Die Lösung: ' + fmt(soll, s.einheit)));
      r.appendChild(el('span', null, s.warum));
      L.gezeigt = true;
      inp.disabled = true;
      kr.innerHTML = '';
      const w = el('button', 'knopf breit', 'Verstanden, weiter');
      w.onclick = () => weiter(s);
      kr.appendChild(w);
    }
    rueckPlatz.appendChild(r);
  }
}

function weiter(s) {
  L.werte[s.id] = L.soll[s.id];
  L.i++; L.versuch = 0; L.gezeigt = false; L.ordnungOk = false; L.zettelGanz = false;
  if (L.i >= L.kt.schritte.length) {
    const alt = stufeVon(L.kt.id), maxSt = L.kt.ohneZahlen ? 1 : 4;
    if (L.fehler === 0 && L.stufe >= alt && alt < maxSt) { STAND.stufen[L.kt.id] = alt + 1; sichern(); }
    zeige('lauf-ende');
  } else zeige('lauf');
}

function vLaufEnde(b) {
  const kt = L.kt;
  kopf(kt.name, 'geschafft');
  const dauer = Math.round((Date.now() - L.start) / 1000);
  const k = el('div', 'schritt');
  k.appendChild(el('h3', null, L.fehler === 0 ? 'Ohne Fehler durch.' : 'Durch, mit ' + L.fehler + (L.fehler === 1 ? ' Fehler.' : ' Fehlern.')));
  const erg = kt.schritte.find(x => x.id === kt.ergebnisId) || kt.schritte[kt.schritte.length - 1];
  k.appendChild(el('p', 'formel', erg.name + ': ' + fmt(L.soll[erg.id], erg.einheit) + '   ·   ' + Math.floor(dauer / 60) + ' Minuten ' + (dauer % 60) + ' Sekunden'));
  const neu = stufeVon(kt.id), maxSt = kt.ohneZahlen ? 1 : 4;
  if (L.fehler === 0 && neu > L.stufe) {
    const r = el('div', 'rueck gut');
    r.appendChild(el('b', null, 'Stufe ' + neu + ' ist jetzt frei.'));
    r.appendChild(el('span', null, 'Mach sie aber nicht heute. Ein Tag Abstand bringt mehr als eine zweite Runde jetzt.'));
    k.appendChild(r);
  } else if (L.fehler > 0) {
    const r = el('div', 'rueck schlecht');
    r.appendChild(el('b', null, 'Diese Stufe noch einmal.'));
    r.appendChild(el('span', null, 'Erst wenn eine Stufe ohne Fehler durchläuft, wird die nächste frei.'));
    k.appendChild(r);
  }
  b.appendChild(k);
  [['Jetzt Karten abfragen', 'Fünf Minuten. Genau jetzt sitzt es am besten.', 'var(--gut)', () => starteLernen('RW', 'plan', STAND.einst.stil)],
   ['Die ganze Kette ansehen', 'Alle Schritte mit Werten, als Spickzettel.', kt.farbe, () => zeige('uebersicht', kt.id)],
   ['Zurück zur Stufenwahl', '', 'var(--leise)', () => zeige('rechnen-stufe', kt.id)]].forEach(([t, u, f, fn]) => {
    const kn = el('button', 'kachel');
    kn.style.borderLeftColor = f;
    kn.appendChild(el('b', null, t));
    if (u) kn.appendChild(el('small', null, u));
    kn.onclick = fn;
    b.appendChild(kn);
  });
}

function vUebersicht(b, kid) {
  const kt = KETTEN.find(x => x.id === kid);
  const w = sollWerte(kt);
  kopf(kt.name, 'die ganze Kette');
  b.appendChild(el('p', 'hin', kt.objekt));
  let letzte = null;
  kt.schritte.forEach((s, i) => {
    if (s.stufe !== letzte) {
      const st = STUFEN.find(x => x.id === s.stufe);
      b.appendChild(el('div', 'gruppe', st.kurz + ' — ' + st.name));
      letzte = s.stufe;
    } else if (i > 0) b.appendChild(el('div', 'pfeil', '↓'));
    const r = el('button', 'uebersicht-schritt');
    if (s.id === kt.ergebnisId) r.style.borderColor = kt.farbe;
    const kz = el('div', 'k');
    kz.appendChild(el('span', 'n', (i + 1) + '. ' + s.name));
    kz.appendChild(el('span', 'v', fmt(w[s.id], s.einheit)));
    r.appendChild(kz);
    const bild = MERKBILDER[s.pnr];
    r.appendChild(el('div', 'u', s.paragraf + (bild ? '  ·  ' + bild.wort : '')));
    r.onclick = () => zeigeSchrittFenster(s, w[s.id]);
    b.appendChild(r);
  });
  const kn = el('button', 'knopf breit', 'Diese Kette üben');
  kn.style.marginTop = '1.2rem';
  kn.onclick = () => zeige('rechnen-stufe', kid);
  b.appendChild(kn);
}

/* ============================================================= PRUEFUNG

   Nachgebaut nach der DEKRA-Originalpruefung:
     - Mehrfachauswahl mit fuenf Moeglichkeiten A bis E
     - bei vielen Fragen ist MEHR ALS EINE richtig
     - jedes richtige Kreuz gibt +1 Punkt, jedes falsche -1
     - je Frage kann man nicht unter null rutschen
     - offene Fragen und Rechenaufgaben zaehlen mit ihrer eigenen Punktzahl

   Das Minuszeichen ist der eigentliche Punkt: Raten kostet. Wer unsicher ist,
   laesst das Kreuz besser weg. Genau diese Zurueckhaltung wird hier geuebt -
   im Lernen dagegen bleibt alles wie gehabt, dort darf man ruhig raten. */

function pruefungsFrage(id, stil) {
  const c = NACH_ID[id];
  if (c.optionen && c.richtig) {
    return { id, optionen: c.optionen, richtig: c.richtig,
             mehrere: c.richtig.length > 1, max: c.richtig.length, art: 'wahl' };
  }
  /* Eine eigene Karte mit eigener Punktzahl ist eine offene Frage oder eine
     Rechenaufgabe. Die laesst sich nicht ankreuzen, auch nicht im Wahl-Modus. */
  if (c.punkte && !c.optionen) return { id, max: c.punkte, art: 'frei' };
  if (stil === 'mc' && !c.nurFrei) {
    const o = mcOptionen(id, 5);
    return { id, optionen: o.map(x => NACH_ID[x].a), richtig: [o.indexOf(id)],
             mehrere: false, max: 1, art: 'wahl' };
  }
  return { id, max: 1, art: 'frei' };
}

/* Eine Originalpruefung laeuft NICHT wie die Simulation aus dem Katalog: keine
   Auswahl, keine Mischung, keine Zufallsablenker. Die Fragen kommen in der
   Reihenfolge der Vorlage, mit ihren eigenen Moeglichkeiten und ihrer eigenen
   Punktzahl. Nur so misst der Durchlauf das, was die Vorlage misst. */
function starteOriginalPruefung(p) {
  const ids = (p.fragen || []).filter(id => NACH_ID[id]);
  if (!ids.length) { hinweis('Zu dieser Prüfung fehlen die Fragen.'); return; }
  const fragen = ids.map(id => {
    const c = NACH_ID[id];
    if (c.optionen && c.richtig) {
      return { id, optionen: c.optionen, richtig: c.richtig,
               mehrere: c.richtig.length > 1, max: c.punkte || c.richtig.length, art: 'wahl' };
    }
    return { id, max: c.punkte || 1, art: 'frei' };
  });
  const e = STAND.einst;
  PR = { fragen, ids, i: 0, antworten: {}, notizen: {}, noten: null, anzahl: ids.length,
         minuten: e.pruefMinuten, ende: Date.now() + e.pruefMinuten * 60000, bestehen: e.bestehen,
         original: p.name, originalId: p.id,
         maxPunkte: fragen.reduce((s, f) => s + f.max, 0) };
  STAND.laufendePruefung = PR;
  sichern();
  zeige('pruefung-frage');
}

function starteRPruefung() {
  const e = STAND.einst;
  const p = stapel(e.fach);
  const n = Math.min(e.pruefAnzahl, p.length);
  const ids = mischen(p.map(c => c.id)).slice(0, n);
  const fragen = ids.map(id => pruefungsFrage(id, e.stil));
  PR = { fragen, ids, i: 0, antworten: {}, notizen: {}, noten: null, anzahl: n,
         minuten: e.pruefMinuten, ende: Date.now() + e.pruefMinuten * 60000, bestehen: e.bestehen,
         maxPunkte: fragen.reduce((s, f) => s + f.max, 0) };
  STAND.laufendePruefung = PR;
  sichern();
  zeige('pruefung-frage');
}

function stoppUhr() { if (PRUHR) { clearInterval(PRUHR); PRUHR = null; } }

/* Punkte einer beantworteten Wahlfrage: richtig +1, falsch -1, nie unter null. */
function punkteFuerWahl(f, gekreuzt) {
  let p = 0;
  for (const i of (gekreuzt || [])) p += f.richtig.indexOf(i) >= 0 ? 1 : -1;
  return Math.max(0, p);
}

function vPruefungFrage(b) {
  if (!PR) { zeige('pruefung'); return; }
  if (PR.i >= PR.fragen.length) { beginneBewertung(); return; }
  const f = PR.fragen[PR.i], c = NACH_ID[f.id];
  kopf(PR.original || 'Prüfung', (c.nr ? c.nr + '  ·  ' : '') + 'Frage ' + (PR.i + 1) + ' von ' + PR.anzahl);

  const kopfz = el('div', 'pruefkopf');
  const u = el('div', 'uhr'); u.id = 'pruefuhr';
  kopfz.appendChild(u);
  const fo = el('div', 'fortschritt');
  const fi = el('i'); fi.style.width = (PR.i / PR.anzahl * 100) + '%';
  fo.appendChild(fi);
  kopfz.appendChild(fo);
  b.appendChild(kopfz);
  stoppUhr();
  const tick = () => {
    const rest = PR.ende - Date.now();
    const e = $('#pruefuhr');
    if (!e) { stoppUhr(); return; }
    e.textContent = uhr(rest);
    e.classList.toggle('knapp', rest < 5 * 60000);
    if (rest <= 0) { stoppUhr(); hinweis('Zeit ist um.'); beginneBewertung(); }
  };
  tick();
  PRUHR = setInterval(tick, 1000);

  const kf = el('div', 'karte-frage');
  const marken = el('div', 'marken');
  marken.appendChild(el('span', 'marke', c.thema));
  marken.appendChild(el('span', 'marke p', f.max + (f.max === 1 ? ' Punkt' : ' Punkte')));
  if (f.art === 'wahl') marken.appendChild(el('span', 'marke', f.mehrere ? 'mehrere richtig' : 'eine richtig'));
  kf.appendChild(marken);
  const gmp = gesetzesMarken(c);
  if (gmp) kf.appendChild(gmp);
  kf.appendChild(el('div', 'f', c.f));

  if (f.art === 'wahl') {
    const gewaehlt = PR.antworten[f.id] || [];
    const w = el('div', 'wahl');
    f.optionen.forEach((txt, i) => {
      const drin = gewaehlt.indexOf(i) >= 0;
      const kn = el('button', drin ? 'gewaehlt' : '');
      kn.appendChild(el('div', 'kreuz', drin ? '✕' : ''));
      kn.appendChild(el('div', 'obuchstabe', 'ABCDE'[i]));
      kn.appendChild(el('div', 'otext', String(txt).replace(/\s+/g, ' ')));
      kn.onclick = () => {
        const g = (PR.antworten[f.id] || []).slice();
        const k = g.indexOf(i);
        if (k >= 0) g.splice(k, 1); else g.push(i);
        PR.antworten[f.id] = g;
        sichern();
        zeige('pruefung-frage');
      };
      w.appendChild(kn);
    });
    kf.appendChild(w);
    kf.appendChild(el('p', 'hin', 'Kreuze alles an, was du für richtig hältst. Jedes richtige Kreuz gibt einen Punkt, '
      + 'jedes falsche zieht einen ab. Wenn du unsicher bist, lass das Kreuz lieber weg.'));
  } else {
    const ta = el('textarea');
    ta.id = 'notiz';
    ta.rows = 8;
    ta.placeholder = 'Deine Antwort. Du vergleichst sie gleich selbst mit der Musterlösung.';
    ta.value = PR.notizen[f.id] || '';
    ta.oninput = () => { PR.notizen[f.id] = ta.value; };
    ta.onblur = () => sichern();
    kf.appendChild(ta);
  }
  b.appendChild(kf);

  const kr = el('div', 'knopfreihe');
  if (PR.i > 0) {
    const z = el('button', 'knopf stumm', 'Zurück');
    z.onclick = () => { PR.i--; sichern(); zeige('pruefung-frage'); };
    kr.appendChild(z);
  }
  const w = el('button', 'knopf', PR.i + 1 < PR.anzahl ? 'Weiter' : 'Abgeben und auswerten');
  w.onclick = () => {
    PR.i++;
    sichern();
    if (PR.i >= PR.anzahl) beginneBewertung(); else zeige('pruefung-frage');
  };
  kr.appendChild(w);
  b.appendChild(kr);

  const ab = el('button', 'knopf stumm breit', 'Prüfung abbrechen');
  ab.style.marginTop = '1.5rem';
  ab.onclick = () => { if (confirm('Prüfung abbrechen? Der bisherige Stand bleibt gespeichert, du kannst später fortsetzen.')) { stoppUhr(); zeige('start'); } };
  b.appendChild(ab);
}

function beginneBewertung() {
  stoppUhr();
  PR.noten = {};
  /* Wahlfragen rechnet die App selbst ab. Offene Fragen und Rechenaufgaben
     bewertest du selbst gegen die Musterloesung. */
  for (const f of PR.fragen) {
    if (f.art === 'wahl') PR.noten[f.id] = punkteFuerWahl(f, PR.antworten[f.id]);
  }
  sichern();
  if (PR.fragen.some(f => f.art !== 'wahl')) { PR.bi = 0; zeige('pruefung-pruefen'); }
  else zeige('pruefung-ergebnis');
}

function vPruefungPruefen(b) {
  if (!PR || !PR.noten) { zeige('pruefung'); return; }
  const offen = PR.fragen.filter(f => f.art !== 'wahl');
  if (PR.bi === undefined) PR.bi = 0;
  if (PR.bi >= offen.length) { zeige('pruefung-ergebnis'); return; }
  const f = offen[PR.bi], c = NACH_ID[f.id];
  kopf('Selbst bewerten', (PR.bi + 1) + ' von ' + offen.length);
  b.appendChild(el('p', 'hin', 'Sei streng mit dir. Was du in der Prüfung nicht hingeschrieben hättest, zählt nicht.'));

  const kf = el('div', 'karte-frage');
  kf.appendChild(el('div', 'thema', c.thema + '  ·  ' + f.max + (f.max === 1 ? ' Punkt' : ' Punkte')));
  kf.appendChild(el('div', 'f', c.f));
  const dn = el('details', 'aufklapp');
  dn.open = true;
  dn.appendChild(el('summary', null, 'Deine Antwort'));
  dn.appendChild(el('div', 'inhalt notiz', PR.notizen[f.id] || '(nichts notiert)'));
  kf.appendChild(dn);
  kf.appendChild(el('div', 'a', c.a));
  b.appendChild(kf);

  b.appendChild(el('h2', null, 'Wie viele Punkte gibst du dir?'));
  const w = el('div', 'wahl');
  /* Bei kleinen Punktzahlen jeder Schritt einzeln, bei groesseren fuenf Stufen -
     elf Knoepfe waeren keine Hilfe, sondern eine weitere Entscheidung. */
  const stufen = f.max <= 5
    ? Array.from({ length: f.max + 1 }, (_, i) => f.max - i)
    : [f.max, Math.round(f.max * 0.75), Math.round(f.max * 0.5), Math.round(f.max * 0.25), 0];
  for (const p of stufen) {
    const kn = el('button');
    const anteil = f.max ? p / f.max : 0;
    kn.appendChild(el('div', 'otext', p + ' von ' + f.max + '  —  ' +
      (anteil === 1 ? 'vollständig' : anteil >= 0.5 ? 'im Kern getroffen' : anteil > 0 ? 'Ansatz stimmte' : 'nicht gewusst')));
    kn.onclick = () => {
      PR.noten[f.id] = p;
      PR.bi++;
      sichern();
      zeige(PR.bi >= offen.length ? 'pruefung-ergebnis' : 'pruefung-pruefen');
    };
    w.appendChild(kn);
  }
  b.appendChild(w);
}

function vPruefungErgebnis(b, fertig) {
  if (!fertig && PR && PR.noten) {
    let p = 0;
    for (const f of PR.fragen) p += PR.noten[f.id] || 0;
    const prozent = PR.maxPunkte ? Math.round(100 * p / PR.maxPunkte) : 0;
    const bestanden = prozent >= PR.bestehen;
    /* Was nicht voll gepunktet hat, wandert zurueck ins Lernen. Volle Punkte
       lassen den Lernstand unberuehrt: eine Messung ist keine Lernrunde. */
    const falsch = [], halb = [];
    for (const f of PR.fragen) {
      const erreicht = PR.noten[f.id] || 0;
      if (erreicht === 0) { bewerten(f.id, 1); falsch.push(f.id); }
      else if (erreicht < f.max) { bewerten(f.id, 2); halb.push(f.id); }
    }
    STAND.pruefungen.push({ datum: heute(), anzahl: PR.anzahl, punkte: p,
                            maxPunkte: PR.maxPunkte, prozent, bestanden, original: PR.original || null });
    fertig = { prozent, bestanden, p, max: PR.maxPunkte, anzahl: PR.anzahl,
               falsch, halb, fragen: PR.fragen, noten: PR.noten, antworten: PR.antworten,
               original: PR.original || null,
               ruhend: !!PR.original && !STAND.einst.eigeneAn };
    PR = null;
    STAND.laufendePruefung = null;
    sichern();
    LETZTES_ERGEBNIS = fertig;
  }
  fertig = fertig || LETZTES_ERGEBNIS;
  if (!fertig) { zeige('pruefung'); return; }

  kopf('Ergebnis', (fertig.original ? fertig.original + '  ·  ' : '') +
       (fertig.bestanden ? 'bestanden' : 'nicht bestanden'));
  const k = el('div', 'schritt');
  k.appendChild(el('div', 'grosszahl' + (fertig.bestanden ? ' gut' : ' schlecht'), fertig.prozent + ' %'));
  k.appendChild(el('p', 'formel', zahl(fertig.p, fertig.p % 1 ? 1 : 0) + ' von ' + fertig.max +
    ' Punkten bei ' + fertig.anzahl + ' Fragen  ·  bestanden ab ' + STAND.einst.bestehen + ' Prozent'));
  const r = el('div', 'rueck ' + (fertig.bestanden ? 'gut' : 'schlecht'));
  r.appendChild(el('b', null, fertig.bestanden ? 'Bestanden.' : 'Noch nicht bestanden.'));
  r.appendChild(el('span', null, fertig.ruhend
    ? (fertig.falsch.length + fertig.halb.length) + ' Fragen wären jetzt dran — die Karten dieser Prüfung ruhen aber, sie tauchen im täglichen Lernen nicht auf.'
    : (fertig.falsch.length + fertig.halb.length) + ' Fragen sind zurück ins Lernen gewandert und kommen dort als Erstes wieder dran.'));
  k.appendChild(r);
  b.appendChild(k);

  const listen = [['Keinen Punkt bekommen', fertig.falsch, 'var(--schlecht)'],
                  ['Nur teilweise', fertig.halb, 'var(--akzent)']];
  for (const eintrag of listen) {
    const titel = eintrag[0], liste = eintrag[1], farbe = eintrag[2];
    if (!liste.length) continue;
    b.appendChild(el('h2', null, titel));
    liste.forEach(id => {
      const c = NACH_ID[id], f = fertig.fragen.find(x => x.id === id);
      const kn = el('button', 'uebersicht-schritt');
      kn.style.borderLeftColor = farbe;
      const kz = el('div', 'k');
      kz.appendChild(el('span', 'n', c.f.replace(/\s+/g, ' ').slice(0, 90)));
      kz.appendChild(el('span', 'v', (fertig.noten[id] || 0) + ' von ' + f.max));
      kn.appendChild(kz);
      kn.appendChild(el('div', 'u', c.thema));
      kn.onclick = () => {
        let t = c.a;
        if (f.art === 'wahl') {
          const meine = fertig.antworten[id] || [];
          t = 'Richtig war: ' + (f.richtig.map(i => 'ABCDE'[i]).join(', ') || '-') +
              '\nDu hattest: ' + (meine.map(i => 'ABCDE'[i]).join(', ') || 'nichts angekreuzt') +
              '\n\n' + f.optionen.map((o, i) =>
                'ABCDE'[i] + ') ' + (f.richtig.indexOf(i) >= 0 ? '[richtig] ' : '') +
                (meine.indexOf(i) >= 0 ? '[angekreuzt] ' : '') + String(o).replace(/\s+/g, ' ')).join('\n\n');
        }
        fenster(c.f, t);
      };
      b.appendChild(kn);
    });
  }

  const l = el('button', 'kachel');
  l.style.borderLeftColor = 'var(--gut)';
  l.appendChild(el('b', null, 'Fehler jetzt nacharbeiten'));
  l.appendChild(el('small', null, 'Die Fragen ohne volle Punktzahl stehen ganz vorn in der Warteschlange.'));
  l.onclick = () => starteLernen(STAND.einst.fach, 'plan', STAND.einst.stil);
  b.appendChild(l);
  const s = el('button', 'kachel');
  s.style.borderLeftColor = 'var(--leise)';
  s.appendChild(el('b', null, 'Zum Start'));
  s.onclick = () => zeige('start');
  b.appendChild(s);
}
let LETZTES_ERGEBNIS = null;

function vPruefung(b) {
  kopf('Prüfung', 'Simulation mit Uhr');
  const e = STAND.einst;

  if (STAND.laufendePruefung) {
    const kn = el('button', 'kachel');
    kn.style.borderLeftColor = 'var(--akzent)';
    kn.appendChild(el('b', null, 'Angefangene Prüfung fortsetzen'));
    kn.appendChild(el('small', null, 'Frage ' + (STAND.laufendePruefung.i + 1) + ' von ' + STAND.laufendePruefung.anzahl));
    kn.onclick = () => { PR = STAND.laufendePruefung; zeige(PR.noten ? 'pruefung-pruefen' : 'pruefung-frage'); };
    b.appendChild(kn);
    const ab = el('button', 'knopf stumm breit', 'Angefangene Prüfung verwerfen');
    ab.onclick = () => { if (confirm('Die angefangene Prüfung wirklich verwerfen?')) { STAND.laufendePruefung = null; PR = null; sichern(); zeige('pruefung'); } };
    b.appendChild(ab);
    return;
  }

  /* Originalpruefungen stehen vor der Simulation aus dem Katalog: wer die echte
     Vorlage hat, will sie auch durchlaufen, und zwar unveraendert. */
  const eigen = STAND.eigenePruefungen || [];
  if (eigen.length) {
    b.appendChild(el('h2', null, 'Originalprüfung'));
    b.appendChild(el('p', 'hin', 'Genau die Fragen der Vorlage, in ihrer Reihenfolge, mit ihren Punkten. Die Musterlösung steht danach wörtlich daneben.'));
    eigen.forEach(p => {
      const da = (p.fragen || []).filter(id => NACH_ID[id]).length;
      const kn = el('button', 'kachel');
      kn.style.borderLeftColor = 'var(--m-gruen)';
      const kz = el('div', 'kachelkopf');
      kz.appendChild(el('b', null, p.name));
      kz.appendChild(el('span', 'marke gruen', 'Originalformat'));
      kn.appendChild(kz);
      kn.appendChild(el('small', null, da + ' Fragen  ·  ' + (p.punkte || '?') + ' Punkte  ·  ' +
        e.pruefMinuten + ' Minuten  ·  Quelle: ' + (p.quelle || 'eigene Datei')));
      kn.onclick = () => starteOriginalPruefung(p);
      b.appendChild(kn);
    });
    b.appendChild(el('h2', null, 'Oder eine Simulation aus dem Katalog'));
  }

  b.appendChild(el('h2', null, 'Woraus?'));
  b.appendChild(fachWahl(e.fach, f => { e.fach = f; sichern(); zeige('pruefung'); }));

  b.appendChild(el('h2', null, 'Wie fragen?'));
  const st = el('div', 'knoepfe');
  [['mc', 'Vier zur Auswahl'], ['frei', 'Frei, mit Selbstbewertung']].forEach(([id, t]) => {
    const kn = el('button', null, t);
    kn.setAttribute('aria-pressed', String(e.stil === id));
    kn.onclick = () => { e.stil = id; sichern(); zeige('pruefung'); };
    st.appendChild(kn);
  });
  b.appendChild(st);

  const max = stapel(e.fach).length;
  b.appendChild(el('h2', null, 'Umfang'));
  const g = el('div', 'gitter');
  [['Fragen', 'pruefAnzahl', 5, max, 5], ['Minuten', 'pruefMinuten', 5, 240, 5], ['Bestehen ab Prozent', 'bestehen', 10, 100, 5]]
    .forEach(([t, feld, min, maxW, schritt]) => {
      const d = el('div', 'regler');
      d.appendChild(el('label', null, t));
      const r = el('div', 'reglerzeile');
      const minus = el('button', null, '−');
      const wert = el('b', null, String(Math.min(e[feld], maxW)));
      const plus = el('button', null, '+');
      minus.onclick = () => { e[feld] = Math.max(min, e[feld] - schritt); sichern(); wert.textContent = e[feld]; };
      plus.onclick = () => { e[feld] = Math.min(maxW, e[feld] + schritt); sichern(); wert.textContent = e[feld]; };
      r.appendChild(minus); r.appendChild(wert); r.appendChild(plus);
      d.appendChild(r);
      g.appendChild(d);
    });
  b.appendChild(g);

  const anzahl = Math.min(e.pruefAnzahl, max);
  b.appendChild(el('p', 'hin', anzahl + ' Fragen aus ' + max + ' verfügbaren, ' + e.pruefMinuten + ' Minuten, bestanden ab ' +
    e.bestehen + ' Prozent. Das sind ' + (e.pruefMinuten * 60 / anzahl).toFixed(0) + ' Sekunden je Frage.'));

  const los = el('button', 'knopf breit', 'Prüfung starten');
  los.onclick = () => starteRPruefung();
  b.appendChild(los);

  b.appendChild(el('p', 'hin', 'Falsch beantwortete Fragen wandern hinterher automatisch zurück ins Lernen. Richtige lassen deinen Lernstand unberührt — die Prüfung ist eine Messung, keine Lernrunde.'));
}

/* ====================================================== GEDÄCHTNISPALAST */
function vPalast(b) {
  kopf('Der Rundgang', '28 Stationen, feste Reihenfolge');
  b.appendChild(el('p', 'hin', 'Ein Weg von draußen nach drinnen und dann nach oben. An jeder Station liegt ein Merkbild, und zwar genau dort, wo seine Szene ohnehin spielt. Du lernst keine neuen Bilder, nur den Weg.'));

  const z = zahlen(stapel('PAL').map(c => c.id));
  const k = el('div', 'schritt');
  const kz = el('div', 'kopfz');
  kz.appendChild(el('span', 'wort', z.prozent + ' % sitzen'));
  kz.appendChild(el('span', 'lt', z.sicher + ' von ' + z.gesamt + ' Fragen zum Rundgang'));
  k.appendChild(kz);
  const fo = el('div', 'fortschritt');
  const fi = el('i'); fi.style.width = z.prozent + '%';
  fo.appendChild(fi); k.appendChild(fo);
  b.appendChild(k);

  /* Abgefragt wird nur, was auch abgelaufen wurde. Sonst ist es Raten. */
  const frei = Object.keys(STAND.palastGesehen || {}).length;
  const ue = el('button', 'kachel');
  ue.style.borderLeftColor = frei ? '#6b5b95' : 'var(--linie)';
  ue.disabled = !frei;
  ue.appendChild(el('b', null, frei ? 'Rundgang abfragen' : 'Erst ablaufen, dann abfragen'));
  ue.appendChild(el('small', null, frei
    ? frei + ' von ' + PALAST.length + ' Stationen sind freigeschaltet. Gefragt wird: Wo stehst du, was liegt da, wohin gehst du weiter?'
    : 'Welcher Raum welchen Paragrafen hält, kann man nicht erraten — man muss den Weg gegangen sein. Geh unten einen Abschnitt durch, dann kommen seine Fragen dazu.'));
  if (frei) ue.onclick = () => starteLernen('PAL', 'plan', STAND.einst.stil);
  b.appendChild(ue);

  b.appendChild(el('h2', null, 'Den Weg ablaufen'));
  b.appendChild(el('p', 'hin', 'In vier Abschnitten, nicht am Stück. Geh einen Abschnitt durch und stell dir jede Station wirklich vor — das Vorstellen ist die Arbeit, nicht das Lesen.'));
  PALAST_ABSCHNITTE.forEach(a => {
    const kn = el('button', 'kachel');
    kn.style.borderLeftColor = '#6b5b95';
    kn.appendChild(el('b', null, a.symbol + '  ' + a.name));
    const drin = PALAST.filter(s => s.nr >= a.von && s.nr <= a.bis);
    const gelaufen = drin.filter(s => STAND.palastGesehen[s.nr]).length;
    kn.appendChild(el('small', null, 'Station ' + a.von + ' bis ' + a.bis +
      (gelaufen === drin.length ? '  ·  ganz gelaufen' : gelaufen ? '  ·  ' + gelaufen + ' von ' + drin.length + ' gelaufen' : '  ·  noch nicht gelaufen') +
      '  ·  ' + drin.map(s => SYMBOLE[s.paragraf]).join(' ')));
    kn.onclick = () => zeige('palast-gang', a.von);
    b.appendChild(kn);
  });

  b.appendChild(el('h2', null, 'Der ganze Weg auf einen Blick'));
  const t = el('table', 'tabelle');
  PALAST.forEach(s => {
    const m = MERKBILDER[s.paragraf];
    const r = el('tr');
    r.appendChild(el('td', null, String(s.nr)));
    r.appendChild(el('td', null, (SYMBOLE[s.paragraf] || '') + ' ' + s.ort));
    r.appendChild(el('td', null, m.wort + ', Paragraf ' + s.paragraf));
    r.onclick = () => zeige('palast-gang', s.nr);
    r.style.cursor = 'pointer';
    t.appendChild(r);
  });
  b.appendChild(t);
}

function vPalastGang(b, nr) {
  nr = Math.max(1, Math.min(PALAST.length, nr || 1));
  const s = PALAST.find(x => x.nr === nr);
  /* Ab jetzt darf diese Station auch abgefragt werden. Vorher waere sie Raten. */
  if (!STAND.palastGesehen[nr]) { STAND.palastGesehen[nr] = heute(); sichern(); }
  const m = MERKBILDER[s.paragraf];
  const a = PALAST_ABSCHNITTE.find(x => nr >= x.von && nr <= x.bis);
  kopf('Station ' + nr + ' von ' + PALAST.length, a.name);

  const zl = el('div', 'ziellinie');
  for (let n = a.von; n <= a.bis; n++) zl.appendChild(el('i', n < nr ? 'voll' : (n === nr ? 'jetzt' : '')));
  b.appendChild(zl);

  const k = el('div', 'schritt');
  k.appendChild(el('div', 'grosssymbol', SYMBOLE[s.paragraf] || ''));
  k.appendChild(el('h3', null, s.ort));
  const mk = el('div', 'marken');
  mk.appendChild(gesetzLink('Paragraf ' + s.paragraf, 'iw', String(s.paragraf)));
  mk.appendChild(el('span', 'marke', m.wort));
  mk.appendChild(el('span', 'marke', 'Laute ' + m.laute));
  k.appendChild(mk);
  k.appendChild(el('p', 'formel', s.kurz));
  k.appendChild(el('p', 'szene', s.verbindung));

  const d = el('details', 'aufklapp');
  d.appendChild(el('summary', null, 'Die ganze Szene aus dem Merktrainer'));
  d.appendChild(el('div', 'inhalt', m.szene));
  k.appendChild(d);
  b.appendChild(k);

  const kr = el('div', 'knopfreihe');
  if (nr > 1) {
    const v = el('button', 'knopf stumm', 'Zurück');
    v.onclick = () => zeige('palast-gang', nr - 1);
    kr.appendChild(v);
  }
  if (nr < PALAST.length) {
    const w = el('button', 'knopf', nr === a.bis ? 'Nächster Abschnitt' : 'Weitergehen');
    w.onclick = () => zeige('palast-gang', nr + 1);
    kr.appendChild(w);
  } else {
    const w = el('button', 'knopf', 'Rundgang abfragen');
    w.onclick = () => starteLernen('PAL', 'plan', STAND.einst.stil);
    kr.appendChild(w);
  }
  b.appendChild(kr);

  if (nr === a.bis) {
    const e = el('div', 'rueck gut');
    e.appendChild(el('b', null, 'Abschnitt „' + a.name + '“ durch.'));
    e.appendChild(el('span', null, 'Geh ihn jetzt einmal im Kopf rückwärts, ohne hinzusehen. Dann hast du ihn.'));
    b.appendChild(e);
    const ab = el('button', 'kachel');
    ab.style.borderLeftColor = '#6b5b95';
    ab.appendChild(el('b', null, 'Diesen Abschnitt abfragen'));
    ab.onclick = () => starteLernen('PAL', 'plan', STAND.einst.stil);
    b.appendChild(ab);
  }
}

/* ================================================================= MEHR */
function vMehr(b) {
  kopf('Mehr', 'Nachschlagen und Einstellungen');
  const wk = el('button', 'kachel');
  wk.style.borderLeftColor = 'var(--akzent)';
  wk.appendChild(el('b', null, 'Was ist was?'));
  wk.appendChild(el('small', null, 'Die ganze App auf einer Seite — und was davon wirklich Lernen ist'));
  wk.onclick = () => zeige('karte');
  b.appendChild(wk);
  b.appendChild(el('h2', null, 'Die Karte der Rechenwege'));
  b.appendChild(el('p', 'hin', 'Oben die Zutaten, dann die drei Schritte des Paragrafen 6 Absatz 3, unten das Ergebnis.'));
  KETTEN.forEach(kt => {
    const k = el('button', 'kachel');
    k.style.borderLeftColor = kt.farbe;
    k.appendChild(el('b', null, kt.name));
    k.appendChild(el('small', null, kt.untertitel));
    k.onclick = () => zeige('uebersicht', kt.id);
    b.appendChild(k);
  });
  b.appendChild(el('h2', null, 'Mehr'));
  [['Der Gedächtnispalast', '28 Stationen in fester Reihenfolge — der Rundgang durchs Haus', () => zeige('palast')],
   ['Merkbilder und Major-System', 'Alle Bilder, die Podcast und App gemeinsam benutzen', () => zeige('bilder')],
   ['Kapitel: die zwei Pläne', 'Flächennutzungsplan und Bebauungsplan — Bild, Gegenüberstellung, Fälle', () => zeige('plaene')],
   ['Das Gesetz im Wortlaut', 'ImmoWertV, BauGB und BauNVO — alles zum Nachschlagen', () => zeige('gesetz')],
   ['Die drei Schritte des Paragrafen 6', 'Das Gerüst, das in jedem Verfahren gleich ist', () => {
      let t = '';
      STUFEN.forEach(s => { t += s.kurz + ' — ' + s.name + '\n' + s.erklaerung + '\n\n'; });
      fenster('Paragraf 6 Absatz 3', t.trim());
   }],
   ['Die Lernrunde einstellen', 'Fach, Frageart und Länge der Runde — sonst entscheidet der Plan', () => zeige('lernen')],
   ['Einstellungen und Lernstand', 'Zieldatum, Sicherung, Zurücksetzen', () => zeige('einstellungen')],
   ['Wie diese App funktioniert', 'Die Lernsysteme dahinter, in einfachen Worten', () => zeige('hilfe')]
  ].forEach(([t, u, fn]) => {
    const k = el('button', 'kachel');
    k.style.borderLeftColor = 'var(--leise)';
    k.appendChild(el('b', null, t));
    k.appendChild(el('small', null, u));
    k.onclick = fn;
    b.appendChild(k);
  });
}

function vBilder(b) {
  kopf('Merkbilder', 'dieselben wie im Podcast');
  b.appendChild(el('p', 'hin', 'Jede Ziffer hat einen festen Laut, aus den Lauten wird ein Wort, aus dem Wort eine Szene. Vokale und H zählen nicht mit.'));
  const t = el('table', 'tabelle');
  const kz = el('tr');
  ['Ziffer', 'Laut', 'Eselsbrücke'].forEach(x => kz.appendChild(el('th', null, x)));
  t.appendChild(kz);
  MAJOR.forEach(m => {
    const r = el('tr');
    r.appendChild(el('td', null, String(m.z)));
    r.appendChild(el('td', null, m.laut));
    r.appendChild(el('td', null, m.bruecke));
    t.appendChild(r);
  });
  b.appendChild(t);
  b.appendChild(el('h2', null, 'Die Bilder zu den Rechenwegen'));
  const benutzt = {};
  KETTEN.forEach(kt => kt.schritte.forEach(s => { if (MERKBILDER[s.pnr]) benutzt[s.pnr] = 1; }));
  Object.keys(benutzt).map(Number).sort((a, c) => a - c).forEach(p => {
    const m = MERKBILDER[p];
    const st = PALAST.find(x => x.paragraf === p);
    const d = el('div', 'bildkarte mitsymbol');
    d.appendChild(el('div', 'sym', SYMBOLE[p] || ''));
    const rechts = el('div', 'text');
    const kz2 = el('div', 'kopfz');
    kz2.appendChild(el('span', 'wort', m.wort));
    kz2.appendChild(el('span', 'par', 'Paragraf ' + p));
    kz2.appendChild(el('span', 'lt', 'Laute ' + m.laute + '  ·  Merktrainer Folge ' + m.trainer +
      (st ? '  ·  Rundgang Station ' + st.nr : '')));
    rechts.appendChild(kz2);
    rechts.appendChild(el('p', 'szene', m.szene));
    d.appendChild(rechts);
    if (st) { d.style.cursor = 'pointer'; d.onclick = () => zeige('palast-gang', st.nr); }
    b.appendChild(d);
  });
}

function vEinstellungen(b) {
  kopf('Einstellungen', 'Zieldatum und Lernstand');
  const e = STAND.einst;

  b.appendChild(el('h2', null, 'Zieldatum'));
  b.appendChild(el('p', 'hin', 'Bis zu diesem Tag sollen alle Karten sicher sitzen. Daraus rechnet die App dein Tagespensum.'));
  const d = el('input');
  d.type = 'date'; d.value = e.zielDatum;
  d.onchange = () => { if (d.value) { e.zielDatum = d.value; sichern(); zeige('einstellungen'); } };
  b.appendChild(d);
  const z = zahlen(KARTEN.map(c => c.id));
  b.appendChild(el('p', 'hin', z.tageBis + ' Tage, ' + (z.gesamt - z.sicher) + ' Karten noch nicht sicher, macht ' + z.proTag + ' am Tag.'));

  b.appendChild(el('h2', null, 'Runde und Belohnung'));
  b.appendChild(el('p', 'hin', 'Wie viele Karten eine Runde hat, und ob Punkte und Serie sichtbar sind.'));
  const rg = el('div', 'knoepfe');
  [5, 7, 10, 15, 20].forEach(n => {
    const kn = el('button', null, n + ' Karten');
    kn.setAttribute('aria-pressed', String(e.rundenGroesse === n));
    kn.onclick = () => { e.rundenGroesse = n; sichern(); zeige('einstellungen'); };
    rg.appendChild(kn);
  });
  b.appendChild(rg);
  const bw = el('div', 'knoepfe');
  [['deutlich', 'Punkte und Serie zeigen'], ['dezent', 'Nur Fortschritt']].forEach(([id, t]) => {
    const kn = el('button', null, t);
    kn.setAttribute('aria-pressed', String(e.belohnung === id));
    kn.onclick = () => { e.belohnung = id; sichern(); zeige('einstellungen'); };
    bw.appendChild(kn);
  });
  b.appendChild(bw);

  b.appendChild(el('h2', null, 'Eigene Karten'));
  const anzahlEigen = (STAND.eigeneKarten || []).length;
  b.appendChild(el('p', 'hin', anzahlEigen
    ? anzahlEigen + ' eigene Karten sind eingelesen. Sie liegen nur auf diesem Gerät und stehen in keinem Repository.'
    : 'Karten, die nicht veröffentlicht werden dürfen — etwa eine Originalprüfung. Sie liegen als Datei im OneDrive, du liest sie hier einmal ein, und danach bleiben sie nur in diesem Browser.'));

  const eingabe = el('input');
  eingabe.type = 'file';
  eingabe.accept = '.json,application/json';
  eingabe.style.cssText = 'font-size:.85rem;width:100%;max-width:none';
  eingabe.onchange = () => {
    const datei = eingabe.files && eingabe.files[0];
    if (!datei) return;
    const leser = new FileReader();
    leser.onload = () => {
      try {
        const roh = JSON.parse(leser.result);
        const liste = Array.isArray(roh) ? roh : (roh.karten || []);
        const gut = liste.filter(c => c && c.id && c.f && c.a);
        if (!gut.length) throw new Error('keine brauchbaren Karten');
        STAND.eigeneKarten = gut;
        /* Fassung 2 bringt die Pruefungen als GANZES mit: Name und Fragenfolge.
           Nur damit laesst sich die Vorlage von vorn bis hinten durchlaufen. */
        const pr = (!Array.isArray(roh) && roh.pruefungen) || [];
        STAND.eigenePruefungen = pr.filter(p => p && p.id && p.name && (p.fragen || []).length);
        /* Mitlernen bleibt aus: der D1Plus-Stoff ist fuer den 5. Oktober nicht
           dran. Die Pruefung selbst laesst sich trotzdem jederzeit starten. */
        sichern();
        bauKarten();
        hinweis(gut.length + ' Karten eingelesen' +
          (STAND.eigenePruefungen.length ? ', dazu ' + STAND.eigenePruefungen.length + ' Originalprüfung' +
            (STAND.eigenePruefungen.length === 1 ? '' : 'en') : '') + '.');
        zeige(STAND.eigenePruefungen.length ? 'pruefung' : 'einstellungen');
      } catch (err) {
        hinweis('Die Datei ließ sich nicht lesen.');
      }
    };
    leser.readAsText(datei, 'utf-8');
  };
  b.appendChild(eingabe);

  if (anzahlEigen) {
    const an = el('div', 'knoepfe');
    an.style.marginTop = '.7rem';
    [[true, 'Mitlernen'], [false, 'Ruhen lassen']].forEach(paar => {
      const kn = el('button', null, paar[1]);
      kn.setAttribute('aria-pressed', String(!!e.eigeneAn === paar[0]));
      kn.onclick = () => { e.eigeneAn = paar[0]; sichern(); zeige('einstellungen'); };
      an.appendChild(kn);
    });
    b.appendChild(an);
    b.appendChild(el('p', 'hin', 'Das gilt nur für das tägliche Lernen. Die Originalprüfung kannst du jederzeit unter Prüfung starten, auch wenn die Karten hier ruhen — für den 5. Oktober ist der D1Plus-Stoff sonst nur Ballast.'));
    const weg = el('button', 'knopf stumm breit', 'Eigene Karten entfernen');
    weg.onclick = () => {
      if (!confirm('Die eingelesenen eigenen Karten entfernen? Die Datei im OneDrive bleibt, du kannst sie jederzeit wieder einlesen.')) return;
      STAND.eigeneKarten = [];
      STAND.eigenePruefungen = [];
      STAND.einst.eigeneAn = false;
      sichern();
      bauKarten();
      zeige('einstellungen');
    };
    b.appendChild(weg);
  }

  b.appendChild(el('h2', null, 'Lernstand sichern'));
  b.appendChild(el('p', 'hin', 'Der Lernstand liegt nur in diesem Browser. Beim Wechsel auf ein neues Gerät nimmst du ihn hiermit mit.'));
  const kr = el('div', 'knopfreihe');
  const ex = el('button', 'knopf', 'Sicherung anzeigen');
  ex.onclick = () => {
    const txt = JSON.stringify(STAND);
    fenster('Sicherung', 'Markiere den Text unten, kopiere ihn und bewahre ihn auf. Auf dem neuen Gerät gehst du auf Einstellungen und wählst Sicherung einlesen.\n\n' + txt, true);
  };
  kr.appendChild(ex);
  const im = el('button', 'knopf stumm', 'Sicherung einlesen');
  im.onclick = () => {
    const t = prompt('Sicherungstext hier einfügen:');
    if (!t) return;
    try {
      const neu = JSON.parse(t);
      if (!neu || !neu.karten) throw new Error('kein Lernstand');
      STAND = neu;
      sichern();
      hinweis('Lernstand eingelesen.');
      zeige('start');
    } catch (err) { hinweis('Das war kein gültiger Sicherungstext.'); }
  };
  kr.appendChild(im);
  b.appendChild(kr);

  b.appendChild(el('h2', null, 'Zurücksetzen'));
  const zr = el('button', 'knopf stumm breit', 'Allen Lernstand löschen');
  zr.style.borderColor = 'var(--schlecht)';
  zr.style.color = 'var(--schlecht)';
  zr.onclick = () => {
    if (!confirm('Wirklich den ganzen Lernstand löschen? Das lässt sich nicht rückgängig machen.')) return;
    if (!confirm('Ganz sicher? Boxen, Prüfungen und Stufen sind danach weg.')) return;
    STAND = leererStand();
    sichern();
    hinweis('Lernstand gelöscht.');
    zeige('start');
  };
  b.appendChild(zr);

  const f = el('div', 'fuss');
  const uq = Object.keys(STAND.uebernommen || {});
  f.textContent = 'Karten gesamt: ' + KARTEN.length + '. ' +
    (uq.length ? 'Übernommen aus: ' + uq.join(', ') + '.' : 'Bisher nichts übernommen.');
  b.appendChild(f);
}

function vHilfe(b) {
  kopf('Wie diese App funktioniert', 'in einfachen Worten');
  [['Eine Runde, ein sichtbares Ende', 'Der Knopf auf dem Startbildschirm entscheidet alles vor: Fach, Frageart, Umfang. Du musst nur tippen. Die Runde ist kurz und ihre Ziellinie ist von der ersten Sekunde an zu sehen — auch dann, wenn du Karten nicht weißt. Sie wird nie länger, als versprochen war. Das ist Absicht: Die Hürde ist das Anfangen, nicht das Lernen.'],
   ['Belohnung sofort, nicht am Ende', 'Jede Karte bewegt sofort etwas: die Ziellinie, die Punkte, die Serie. Späte Belohnungen werden bei ADHS stärker abgewertet als bei anderen, und Lernen bricht unter Verzögerung messbar ein — lässt sich aber durch dichte, unmittelbare Rückmeldung wieder ausgleichen. Wenn dir das zu viel ist: unter Mehr, Einstellungen auf dezent stellen.'],
   ['Unterbrechen kostet nichts', 'Eine angefangene Runde wird mitgespeichert. Wenn dich etwas wegholt, steht beim nächsten Öffnen „Weiter in der Runde“ statt „Los geht’s“, und du landest genau auf der Karte, bei der du aufgehört hast.'],
   ['Ein Stapel, drei Herkünfte', 'Im selben Stapel liegen die ' + stapel('P-S').length + ' Karten Sachkunde, die ' +
    stapel('P-B').length + ' Karten Bautechnik, die ' + stapel('RW').length +
    ' Karten zu den Rechenwegen und die ' + stapel('PAL').length +
    ' Fragen zum Rundgang. Du kannst nach Fach filtern, aber gemischt zu lernen ist wirksamer: Nur so übst du auch zu erkennen, worum es überhaupt geht.'],
   ['Bilder und der Rundgang', 'Jedes Merkbild hat ein Sinnbild, und die 28 Bilder hängen an festen Stationen eines Rundgangs durch ein Haus. Warum das wirkt: Bilder werden nachweislich besser behalten als Wörter, und beim Gedächtnispalast stieg die Merkleistung in einer kontrollierten Studie von 26 auf 62 von 72 Wörtern — mit einem Vorsprung, der vier Monate ohne weiteres Üben hielt. Einen „visuellen Lerntyp“ gibt es dagegen nicht; die Bilder wirken bei jedem.'],
   ['Abrufen statt Nachlesen', 'Erst antworten, dann aufdecken. Sich zu erinnern ist anstrengender als zu lesen, und genau deshalb bleibt es hängen. Zusammen mit dem verteilten Wiederholen sind das die beiden Techniken, die in den großen Übersichtsarbeiten als einzige die Bestnote bekommen.'],
   ['Verteiltes Wiederholen', 'Jede Karte bekommt ihren eigenen Termin. Der Planer schätzt, wann du sie fast vergessen hättest, und legt die Wiederholung genau dorthin. Wie fest eine Karte sitzt, steht auf dem Startbildschirm unter „Zahlen zum Lernstand“: Box 4 und 5 heißen sicher.'],
   ['Verblassende Musterlösungen', 'Im Bereich Rechnen zeigt Stufe 0 alles vor. Ab Stufe 1 verschwinden die Stützen von hinten nach vorn, bis du auf Stufe 4 auch noch sagen musst, welcher Schritt als Nächstes kommt. Eine Stufe wird erst frei, wenn die vorige fehlerfrei durchläuft.'],
   ['Selbst erklären', 'Nach jedem richtigen Rechenschritt kommt die Aufforderung, die Begründung erst laut zu sagen und dann erst aufzuklappen. Das Erklären in eigenen Worten ist einer der stärksten Einzeleffekte, die die Lernforschung kennt.'],
   ['Prüfen statt üben', 'Die Prüfungssimulation läuft mit Uhr und Bestehensgrenze. Falsche und halb richtige Antworten wandern hinterher ins Lernen zurück; richtige lassen den Lernstand unberührt, weil eine Messung keine Lernrunde ist.']
  ].forEach(([n, x]) => {
    const d = el('div', 'bildkarte');
    d.appendChild(el('div', 'wort', n));
    d.appendChild(el('p', null, x));
    b.appendChild(d);
  });
  b.appendChild(el('h2', null, 'So gehst du am besten vor'));
  const o = el('div', 'bildkarte');
  ['Eine Runde am Tag. Nur eine. Wenn mehr geht, ist das ein Geschenk, keine Pflicht.',
   'Lieber jeden Tag drei Minuten als einmal die Woche eine Stunde. Die Serie ist wichtiger als die Menge.',
   'Den Rundgang abschnittsweise ablaufen, vier Abschnitte, einer pro Tag. Danach reicht Abfragen.',
   'Eine Rechenkette pro Abend, am nächsten Tag die nächste Stufe. Nicht alles an einem Tag.',
   'Einmal in der Woche eine Prüfung über alles, damit du siehst, wo du wirklich stehst.',
   'Die Podcast-Folgen auf der Fahrt hören, sie benutzen dieselben Bilder und Zahlen.'
  ].forEach((t, i) => o.appendChild(el('p', null, (i + 1) + '. ' + t)));
  b.appendChild(o);
}

/* ------------------------------------------------------------- Fenster */
function fenster(titel, text, auswaehlbar) {
  const alt = $('#fenster'); if (alt) alt.remove();
  const hg = el('div');
  hg.id = 'fenster';
  const k = el('div', 'fensterkarte');
  k.appendChild(el('div', 'wort', titel));
  const p = el('p', auswaehlbar ? 'waehlbar' : null);
  p.textContent = text;
  k.appendChild(p);
  const z = el('button', 'knopf stumm breit', 'Schließen');
  z.style.marginTop = '1rem';
  z.onclick = () => hg.remove();
  k.appendChild(z);
  hg.appendChild(k);
  hg.onclick = (e) => { if (e.target === hg) hg.remove(); };
  document.body.appendChild(hg);
}
function zeigeSchrittFenster(s, wert) {
  const bild = MERKBILDER[s.pnr];
  let t = s.paragraf + '\n\n' + s.formel + '\n\nErgebnis: ' + fmt(wert, s.einheit) + '\n\nWarum: ' + s.warum;
  if (s.falle) t += '\n\nFalle: ' + s.falle;
  if (s.weiter) t += '\n\nWeiter: ' + s.weiter;
  if (bild) t += '\n\nMerkbild ' + bild.wort + ': ' + bild.szene;
  fenster(s.name, t);
}

/* =============================================================== GESETZ */
/* Der amtliche Text liegt in daten-gesetz.js. Jede Stelle in der App, an der
   ein Paragraf genannt wird, soll dorthin führen: Nachschlagen muss billiger
   sein als Weiterraten. */

let GESETZ_HER = null;   // wohin der Zurück-Knopf aus dem Gesetzestext führt

function gesetzEintrag(buch, nr) {
  if (buch === 'baunvo') return GESETZ_BAUNVO[nr];
  if (buch === 'baugb') return GESETZ_BAUGB[nr];
  if (buch === 'anlage') return GESETZ_ANLAGEN[nr];
  return GESETZ[nr];
}

function gesetzName(buch, nr) {
  if (buch === 'baunvo') return '§ ' + nr + ' BauNVO';
  if (buch === 'baugb') return '§ ' + nr + ' BauGB';
  if (buch === 'anlage') return 'Anlage ' + nr;
  return '§ ' + nr + ' ImmoWertV';
}

/* Von hier aus wird der Text aufgeschlagen. Die Stelle, an der man gerade war,
   wird gemerkt - sonst landet man nach dem Lesen nicht wieder in seiner Runde. */
function zeigeGesetz(buch, nr) {
  if (!gesetzEintrag(buch, nr)) { hinweis('Diesen Text habe ich nicht.'); return; }
  if (ANSICHT !== 'gesetz-text') GESETZ_HER = { ziel: ANSICHT, arg: GESETZ_ARG };
  zeige('gesetz-text', { buch, nr });
}

/* Alle Paragrafen, die in einem Text vorkommen - als Liste {buch, nr}.
   Erkannt werden "§ 40", "§§ 27", "Paragraf 40" und "Paragrafen 27".
   Steht BauGB in der Nähe oder gibt es die Nummer in der ImmoWertV gar nicht
   (die endet bei 54), wird im Baugesetzbuch nachgesehen. */
function paragrafenIn(txt) {
  const raus = [], gesehen = {};
  if (!txt) return raus;
  const re = /(§§?|Paragrafen?)\s*([0-9]{1,3})([a-z])?/g;
  let m;
  while ((m = re.exec(txt)) !== null) {
    const nr = m[2] + (m[3] || '');
    const umfeld = txt.slice(m.index, m.index + 70);
    let buch = 'iw';
    if (/BauNVO|Baunutzungsverordnung/i.test(umfeld)) buch = 'baunvo';
    else if (/BauGB|Baugesetzbuch/i.test(umfeld)) buch = 'baugb';
    else if (!GESETZ[nr]) buch = 'baugb';
    if (!gesetzEintrag(buch, nr)) continue;
    const schluessel = buch + nr;
    if (gesehen[schluessel]) continue;
    gesehen[schluessel] = 1;
    raus.push({ buch, nr });
  }
  /* Die Anlagen sind der zweite Teil des Gesetzes: Gesamtnutzungsdauer,
     Bewirtschaftungskosten, die Normalherstellungskosten. Sie werden im Text
     genauso genannt wie ein Paragraf und gehoeren deshalb auch dazu. */
  const ra = /Anlage[n]?\s*([1-9])/g;
  while ((m = ra.exec(txt)) !== null) {
    const nr = m[1];
    if (!GESETZ_ANLAGEN[nr]) continue;
    if (gesehen['anlage' + nr]) continue;
    gesehen['anlage' + nr] = 1;
    raus.push({ buch: 'anlage', nr });
  }
  return raus;
}

/* Die Marken über der Frage. Genau das hatte gefehlt: oben tippen und lesen. */
function gesetzesMarken(c) {
  const treffer = [];
  if (c.pnr && GESETZ[c.pnr]) treffer.push({ buch: 'iw', nr: String(c.pnr) });
  if (c.paragraf && GESETZ[c.paragraf]) treffer.push({ buch: 'iw', nr: String(c.paragraf) });
  paragrafenIn((c.f || '') + ' ' + (c.a || '')).forEach(p => {
    if (!treffer.some(x => x.buch === p.buch && x.nr === p.nr)) treffer.push(p);
  });
  if (!treffer.length) return null;
  const d = el('div', 'marken gesetzmarken');
  treffer.slice(0, 6).forEach(p => {
    const kn = el('button', 'marke gesetz', gesetzName(p.buch, p.nr).replace(' ImmoWertV', ''));
    kn.title = gesetzEintrag(p.buch, p.nr).titel;
    kn.onclick = () => zeigeGesetz(p.buch, p.nr);
    d.appendChild(kn);
  });
  return d;
}

/* Ein Knopf, der wie Text aussieht - für Stellen, an denen der Paragraf schon
   ausgeschrieben dasteht ("Paragraf 40 Absatz 1"). */
function gesetzLink(beschriftung, buch, nr) {
  const kn = el('button', 'gesetzlink', beschriftung);
  if (!gesetzEintrag(buch, nr)) { kn.disabled = true; return kn; }
  kn.onclick = () => zeigeGesetz(buch, nr);
  return kn;
}

function vGesetzText(b, arg) {
  const buch = (arg && arg.buch) || 'iw', nr = (arg && arg.nr) || '1';
  const e = gesetzEintrag(buch, nr);
  if (!e) { zeige('gesetz'); return; }
  kopf(gesetzName(buch, nr), e.titel);

  const k = el('div', 'gesetztext');
  k.appendChild(el('div', 'wort', gesetzName(buch, nr) + '  ' + e.titel));
  k.appendChild(el('p', null, e.text));
  b.appendChild(k);

  /* Was an diesem Paragrafen sonst noch hängt: das Merkbild, die Station im
     Rundgang, die Rechenschritte. Der Weg vom Gesetz zurück ins Lernen. */
  if (buch === 'iw') {
    const zahl = Number(nr);
    const bild = MERKBILDER[zahl];
    if (bild) {
      const d = el('div', 'bildkarte mitsymbol');
      d.appendChild(el('div', 'sym', SYMBOLE[zahl] || ''));
      const r = el('div', 'text');
      const kz = el('div', 'kopfz');
      kz.appendChild(el('span', 'wort', bild.wort));
      kz.appendChild(el('span', 'lt', 'Laute ' + bild.laute));
      r.appendChild(kz);
      r.appendChild(el('p', 'szene', bild.szene));
      d.appendChild(r);
      b.appendChild(d);
    }
    const st = PALAST.find(x => x.paragraf === zahl);
    if (st) {
      const kn = el('button', 'kachel');
      kn.style.borderLeftColor = 'var(--m-gelb)';
      kn.appendChild(el('b', null, 'Station ' + st.nr + ' im Rundgang'));
      kn.appendChild(el('small', null, st.ort));
      kn.onclick = () => zeige('palast-gang', st.nr);
      b.appendChild(kn);
    }
    const schritte = [];
    KETTEN.forEach(kt => kt.schritte.forEach(s => { if (s.pnr === zahl) schritte.push({ kt, s }); }));
    schritte.slice(0, 4).forEach(x => {
      const kn = el('button', 'kachel');
      kn.style.borderLeftColor = x.kt.farbe;
      kn.appendChild(el('b', null, x.s.name));
      kn.appendChild(el('small', null, x.kt.name + '  ·  ' + x.s.formel));
      kn.onclick = () => zeige('uebersicht', x.kt.id);
      b.appendChild(kn);
    });
  }

  const f = el('div', 'fuss');
  f.textContent = GESETZ_STAND;
  b.appendChild(f);
}

function vGesetz(b) {
  kopf('Das Gesetz', 'ImmoWertV, BauGB und BauNVO');
  b.appendChild(el('p', 'satz', 'Der amtliche Text, ohne Netz: ImmoWertV mit Anlagen, dazu die Paragrafen aus BauGB und BauNVO, die in der Wertermittlung vorkommen. Tippe auf einen, um ihn zu lesen.'));

  const suche = el('input');
  suche.type = 'search';
  suche.placeholder = 'Suchen: Nummer, Überschrift oder ein Wort im Text';
  suche.style.cssText = 'width:100%;max-width:none';
  b.appendChild(suche);

  const liste = el('div');
  b.appendChild(liste);

  const alle = [];
  Object.keys(GESETZ).forEach(nr => alle.push({ buch: 'iw', nr, e: GESETZ[nr] }));
  Object.keys(GESETZ_BAUGB).forEach(nr => alle.push({ buch: 'baugb', nr, e: GESETZ_BAUGB[nr] }));
  Object.keys(GESETZ_BAUNVO).forEach(nr => alle.push({ buch: 'baunvo', nr, e: GESETZ_BAUNVO[nr] }));
  Object.keys(GESETZ_ANLAGEN).forEach(nr => alle.push({ buch: 'anlage', nr, e: GESETZ_ANLAGEN[nr] }));

  const zeichnen = () => {
    liste.innerHTML = '';
    const w = suche.value.trim().toLowerCase();
    let gezeigt = 0;
    alle.forEach(x => {
      if (w) {
        const passt = x.nr === w || x.e.titel.toLowerCase().indexOf(w) >= 0 ||
                      x.e.text.toLowerCase().indexOf(w) >= 0 ||
                      gesetzName(x.buch, x.nr).toLowerCase().indexOf(w) >= 0;
        if (!passt) return;
      }
      gezeigt++;
      const kn = el('button', 'uebersicht-schritt');
      kn.style.borderLeftColor = x.buch === 'iw' ? 'var(--akzent)'
                               : (x.buch === 'baugb' ? 'var(--m-blau)'
                               : (x.buch === 'baunvo' ? 'var(--m-gruen)' : 'var(--m-gelb)'));
      const kz = el('div', 'k');
      kz.appendChild(el('span', 'n', gesetzName(x.buch, x.nr).replace(' ImmoWertV', '')));
      if (x.buch === 'iw' && SYMBOLE[Number(x.nr)]) kz.appendChild(el('span', 'v', SYMBOLE[Number(x.nr)]));
      kn.appendChild(kz);
      kn.appendChild(el('div', 'u', x.e.titel));
      kn.onclick = () => zeigeGesetz(x.buch, x.nr);
      liste.appendChild(kn);
    });
    if (!gezeigt) liste.appendChild(el('p', 'hin', 'Nichts gefunden.'));
  };
  suche.oninput = zeichnen;
  zeichnen();
}

/* ====================================================== KAPITEL: DIE PLÄNE */
/* Ein eigenes Kapitel für Flächennutzungsplan und Bebauungsplan. Es beginnt
   nicht mit Text, sondern mit einem Bild: André konnte sich unter den beiden
   Plänen nichts vorstellen, und ohne Vorstellung bleibt jede Definition ein
   Wortpaar, das man verwechselt. Erst das Bild, dann die Gegenüberstellung,
   dann die Abfrage. Deshalb sind die Karten auch gesperrt, bis diese Seite
   einmal offen war - dieselbe Regel wie beim Rundgang. */

function blpBild() {
  const d = el('div', 'planbild');
  d.innerHTML = [
    '<svg viewBox="0 0 320 430" role="img" aria-label="Flächennutzungsplan und Bebauungsplan im Vergleich">',
    /* ---------------- oben: Flächennutzungsplan ---------------- */
    '<text x="10" y="16" class="pb-titel">🚁 Flächennutzungsplan</text>',
    '<text x="10" y="30" class="pb-klein">die ganze Gemeinde aus der Luft</text>',
    '<rect x="10" y="38" width="300" height="120" rx="6" class="pb-rahmen"/>',
    '<path d="M18 46 h120 v52 h-120 z" fill="#d99f95" opacity=".75"/>',
    '<path d="M146 46 h70 v34 h-70 z" fill="#b6bcc6" opacity=".8"/>',
    '<path d="M224 46 h78 v52 h-78 z" fill="#a9c3a1" opacity=".8"/>',
    '<path d="M18 106 h96 v44 h-96 z" fill="#d6c08a" opacity=".8"/>',
    '<path d="M146 88 h70 v62 h-70 z" fill="#d99f95" opacity=".55"/>',
    '<path d="M224 106 h78 v44 h-78 z" fill="#a9c3a1" opacity=".5"/>',
    '<path d="M138 42 v114 M18 100 h284" class="pb-strasse"/>',
    '<text x="24" y="70" class="pb-marke">W</text>',
    '<text x="152" y="66" class="pb-marke">G</text>',
    '<text x="230" y="70" class="pb-marke">Grün</text>',
    '<text x="24" y="130" class="pb-marke">S</text>',
    '<text x="152" y="112" class="pb-marke">W</text>',
    '<rect x="146" y="88" width="70" height="62" class="pb-lupe"/>',
    '<text x="10" y="174" class="pb-klein">Darstellungen · nicht parzellenscharf · bindet nur die Behörden</text>',
    /* ---------------- Pfeil ---------------- */
    '<path d="M160 182 v26" class="pb-pfeil"/>',
    '<path d="M154 202 l6 8 l6 -8" class="pb-pfeil"/>',
    '<text x="172" y="200" class="pb-klein">daraus entwickelt, § 8 Abs. 2 BauGB</text>',
    /* ---------------- unten: Bebauungsplan ---------------- */
    '<text x="10" y="232" class="pb-titel">🚧 Bebauungsplan</text>',
    '<text x="10" y="246" class="pb-klein">ein Ausschnitt, Grundstück für Grundstück</text>',
    '<rect x="10" y="254" width="300" height="150" rx="6" class="pb-rahmen"/>',
    '<path d="M18 262 h284 v104 h-284 z" fill="#d99f95" opacity=".35"/>',
    '<path d="M18 366 h284 v30 h-284 z" fill="#b6bcc6" opacity=".55"/>',
    '<text x="140" y="386" class="pb-klein">Verkehrsfläche</text>',
    '<path d="M89 262 v104 M160 262 v104 M231 262 v104" class="pb-grenze"/>',
    '<rect x="26" y="276" width="55" height="66" class="pb-baugrenze"/>',
    '<rect x="97" y="276" width="55" height="66" class="pb-baugrenze"/>',
    '<rect x="168" y="276" width="55" height="66" class="pb-baugrenze"/>',
    '<rect x="239" y="276" width="55" height="66" class="pb-baugrenze"/>',
    '<rect x="36" y="292" width="35" height="34" class="pb-haus"/>',
    '<rect x="107" y="292" width="35" height="34" class="pb-haus"/>',
    '<text x="24" y="360" class="pb-marke">WA · GRZ 0,4 · GFZ 0,8 · II · o</text>',
    '<text x="10" y="420" class="pb-klein">Festsetzungen · parzellenscharf · bindet jeden</text>',
    '</svg>'
  ].join('');
  return d;
}

function vKapitelPlaene(b) {
  kopf('Die zwei Pläne', 'Flächennutzungsplan und Bebauungsplan');
  const frisch = !STAND.blpGesehen;
  STAND.blpGesehen = true;
  sichern();
  if (frisch) bauKarten();

  b.appendChild(el('p', 'satz', BLP_LEITSATZ));
  b.appendChild(blpBild());

  /* Die beiden Bilder als Karten - dasselbe Muster wie bei den Merkbildern,
     damit das Kapitel sich anfühlt wie der Rest der App. */
  [BLP_BILDER.fnp, BLP_BILDER.bplan].forEach(x => {
    const d = el('div', 'bildkarte mitsymbol');
    d.appendChild(el('div', 'sym', x.sym));
    const r = el('div', 'text');
    r.appendChild(el('div', 'wort', x.wort));
    r.appendChild(el('p', 'szene', x.szene));
    d.appendChild(r);
    b.appendChild(d);
  });

  b.appendChild(el('h2', null, 'Der Unterschied, Zeile für Zeile'));
  b.appendChild(el('p', 'hin', 'Immer beide nebeneinander. Getrennt gelernt laufen sie im Kopf ineinander — nebeneinander trennen sie sich von selbst.'));
  BLP_VERGLEICH.forEach(v => {
    const d = el('div', 'planzeile');
    d.appendChild(el('div', 'wort', v.merkmal));
    const a = el('div', 'seite fnp');
    a.appendChild(el('span', 'wer', '🚁 Flächennutzungsplan'));
    a.appendChild(el('p', null, v.fnp));
    d.appendChild(a);
    const c = el('div', 'seite bplan');
    c.appendChild(el('span', 'wer', '🚧 Bebauungsplan'));
    c.appendChild(el('p', null, v.bplan));
    d.appendChild(c);
    const g = el('details', 'aufklapp');
    g.appendChild(el('summary', null, 'Warum das so ist'));
    const i = el('div', 'inhalt');
    i.appendChild(el('p', null, v.warum));
    const gl = gesetzesMarken({ f: v.fund, a: '' });
    if (gl) i.appendChild(gl);
    else i.appendChild(el('p', 'hin', v.fund));
    g.appendChild(i);
    d.appendChild(g);
    b.appendChild(d);
  });

  b.appendChild(el('h2', null, 'Die Reihenfolge'));
  BLP_STUFEN.forEach(s => {
    const kn = el('div', 'uebersicht-schritt');
    kn.style.borderLeftColor = 'var(--m-gruen)';
    const kz = el('div', 'k');
    kz.appendChild(el('span', 'n', s.nr + '. ' + s.name));
    kz.appendChild(el('span', 'v', s.fund));
    kn.appendChild(kz);
    kn.appendChild(el('div', 'u', s.kurz));
    b.appendChild(kn);
  });

  b.appendChild(el('h2', null, 'Wo darf gebaut werden?'));
  b.appendChild(el('p', 'hin', 'Vier Vorschriften, und man geht sie in dieser Reihenfolge durch.'));
  BLP_ZULAESSIG.forEach(z => {
    const d = el('div', 'bildkarte');
    const kz = el('div', 'kachelkopf');
    kz.appendChild(el('div', 'wort', '§ ' + z.pnr + ' BauGB — ' + z.name));
    const kn = gesetzLink('nachlesen', 'baugb', z.pnr);
    kz.appendChild(kn);
    d.appendChild(kz);
    d.appendChild(el('p', null, z.wann));
    d.appendChild(el('p', 'hin', z.massstab));
    b.appendChild(d);
  });

  b.appendChild(el('h2', null, 'Was das für den Bodenwert heißt'));
  BLP_WERT.forEach(w => {
    const kn = el('div', 'uebersicht-schritt');
    kn.style.borderLeftColor = 'var(--m-rot)';
    const kz = el('div', 'k');
    kz.appendChild(el('span', 'n', w.zustand));
    kz.appendChild(el('span', 'v', w.abs));
    kn.appendChild(kz);
    kn.appendChild(el('div', 'u', w.planung));
    b.appendChild(kn);
  });

  b.appendChild(el('h2', null, 'Begriffe, die man verwechselt'));
  BLP_PAARE.forEach(p => {
    const d = el('div', 'planzeile');
    d.appendChild(el('div', 'wort', p.a + '  ·  ' + p.b));
    const a = el('div', 'seite fnp');
    a.appendChild(el('span', 'wer', p.a));
    a.appendChild(el('p', null, p.erklaerungA));
    d.appendChild(a);
    const c = el('div', 'seite bplan');
    c.appendChild(el('span', 'wer', p.b));
    c.appendChild(el('p', null, p.erklaerungB));
    d.appendChild(c);
    d.appendChild(el('p', 'hin', p.fund));
    b.appendChild(d);
  });

  const anzahl = KARTEN.filter(c => c.fach === 'BLP').length;
  const los = el('button', 'losknopf');
  los.style.marginTop = '1.4rem';
  los.appendChild(el('b', null, 'Dieses Kapitel lernen'));
  los.appendChild(el('span', null, anzahl + ' Karten im Kapitel  ·  ' + STAND.einst.rundenGroesse + ' pro Runde'));
  los.onclick = () => starteLernen('BLP', 'plan', STAND.einst.stil);
  b.appendChild(los);
  b.appendChild(el('p', 'hin', 'Die Karten zählen ganz normal in deinen Plan und kommen auch in der Prüfung dran.'));
}

/* --------------------------------------------------------------- Aufbau */
bauKarten();
document.querySelectorAll('#leiste button').forEach(x => x.onclick = () => zeige(x.dataset.ziel));
$('#zurueck').onclick = () => {
  const zurueck = { 'lern-karte': 'start', 'lern-ende': 'start', lernen: 'start', karte: 'start', 'rechnen-stufe': 'rechnen',
    lauf: () => ['rechnen-stufe', L.kt.id], 'lauf-ende': () => ['rechnen-stufe', L.kt.id],
    uebersicht: 'rechnen', 'pruefung-frage': 'pruefung', 'pruefung-pruefen': 'pruefung',
    'pruefung-ergebnis': 'start', bilder: 'mehr', einstellungen: 'mehr', hilfe: 'mehr',
    palast: 'mehr', 'palast-gang': 'palast', gesetz: 'mehr', plaene: 'start',
    'gesetz-text': () => (GESETZ_HER && GESETZ_HER.ziel && GESETZ_HER.ziel !== 'gesetz-text')
        ? [GESETZ_HER.ziel, GESETZ_HER.arg] : ['gesetz'] }[ANSICHT];
  if (typeof zurueck === 'function') { const [z, a] = zurueck(); zeige(z, a); }
  else zeige(zurueck || 'start');
};
/* Beim allerersten Mal zuerst die Karte der App: die Frage, wofuer welcher
   Teil da ist, muss einmal beantwortet sein, sonst klickt man ins Leere. */
zeige(STAND.einst.karteGesehen ? 'start' : 'karte');
