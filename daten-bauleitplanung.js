/* Kapitel: Flächennutzungsplan und Bebauungsplan.
   ==================================================================
   WARUM DIESES KAPITEL SO GEBAUT IST. André kann die beiden Pläne nicht
   auseinanderhalten und sich nichts darunter vorstellen. Genau das ist der
   Normalfall bei zwei ähnlichen Begriffen: Wer sie nacheinander lernt, lernt
   zwei Beschreibungen, die im Kopf ineinanderlaufen. Was dagegen hilft, ist
   das Gegenteil - beide IMMER nebeneinander, in denselben Feldern, und Fragen,
   die eine Entscheidung zwischen ihnen verlangen.

   Deshalb ist die Tabelle BLP_VERGLEICH die Quelle fast aller Karten. Jede
   Zeile hat dasselbe Merkmal für beide Pläne, und daraus entstehen drei Karten:
   die Frage zum Flächennutzungsplan, dieselbe Frage zum Bebauungsplan und eine
   dritte, die zwischen beiden entscheiden lässt. Weil die beiden Antworten
   einander sehr ähnlich sind, zieht die Ablenker-Auswahl der App automatisch
   die jeweils andere als falsche Möglichkeit heran. Genau die Verwechslung,
   die im Kopf sitzt, steht damit in jeder Runde zur Wahl.

   Dazu ein festes Bild (Hubschrauber und Bauzaun), weil Bilder nachweislich
   besser haften als Wörter, und Fallkarten, weil Prüfungsfragen keine
   Merkmale abfragen, sondern Sachverhalte.

   Fachliche Grundlage: BauGB und BauNVO im Wortlaut (daten-gesetz.js). */

const BLP_LEITSATZ = 'Der Hubschrauber sieht die Farben, der Bauzaun kennt die Zentimeter.';

const BLP_BILDER = {
  fnp: {
    sym: '🚁',
    wort: 'Hubschrauber',
    szene: 'Du sitzt im Hubschrauber über der Stadt. Von oben siehst du nur Farbflächen: ' +
           'ein großer rosa Fleck für Wohnen, ein grauer für Gewerbe, ein grüner für den Park. ' +
           'Keine Grundstücksgrenzen, keine Häuser, keine Zahlen. Du siehst, was die Gemeinde vorhat — ' +
           'und du kannst aus dem Hubschrauber niemandem etwas verbieten.'
  },
  bplan: {
    sym: '🚧',
    wort: 'Bauzaun',
    szene: 'Du stehst am Bauzaun vor einem einzelnen Grundstück. Am Zaun hängt ein Plan mit ' +
           'Grundstücksgrenzen, einer gestrichelten Baugrenze und Zahlen: WA, 0,4, 0,8, zwei Vollgeschosse, ' +
           'offene Bauweise. Der Zaun steht auf dem Boden, an den sich jeder halten muss — ' +
           'auch du, auch dein Nachbar, auch die Gemeinde selbst.'
  }
};

/* ------------------------------------------------- Das Gerüst des Kapitels */
const BLP_STUFEN = [
  { nr: 1, name: 'Raumordnung und Landesplanung',
    kurz: 'Das Land steckt den Rahmen ab. Die Bauleitpläne müssen sich daran anpassen.',
    fund: '§ 1 Abs. 4 BauGB' },
  { nr: 2, name: 'Flächennutzungsplan',
    kurz: 'Die Gemeinde stellt für ihr ganzes Gebiet dar, was sie grob vorhat. Noch kein Baurecht.',
    fund: '§ 5 BauGB' },
  { nr: 3, name: 'Bebauungsplan',
    kurz: 'Aus dem Flächennutzungsplan entwickelt, für einen Teil des Gebiets, als Satzung verbindlich.',
    fund: '§§ 8 bis 10 BauGB' },
  { nr: 4, name: 'Zulässigkeit des einzelnen Vorhabens',
    kurz: 'Jetzt erst entscheidet sich, ob auf diesem Grundstück gebaut werden darf.',
    fund: '§§ 29 bis 35 BauGB' },
  { nr: 5, name: 'Entwicklungszustand und Bodenwert',
    kurz: 'Erst aus dem Planungsstand folgt, ob die Fläche Bauerwartungsland, Rohbauland oder baureifes Land ist.',
    fund: '§ 3 ImmoWertV' }
];

/* -------------------------------------------- Die Gegenüberstellung (Herz) */
const BLP_VERGLEICH = [
  { id: 'name', merkmal: 'Wie heißt er im Gesetz?',
    fnp: 'Vorbereitender Bauleitplan.',
    bplan: 'Verbindlicher Bauleitplan.',
    fund: '§ 1 Abs. 2 BauGB',
    warum: 'Die beiden Wörter sagen schon alles: Der eine bereitet vor, der andere bindet. ' +
           'Wer sich nur diese zwei Wörter merkt, kann den Rest herleiten.' },

  { id: 'gebiet', merkmal: 'Für welches Gebiet gilt er?',
    fnp: 'Für das ganze Gemeindegebiet.',
    bplan: 'Nur für den Teil des Gemeindegebiets, den sein Geltungsbereich umfasst — meist ein einzelnes Baugebiet oder ein paar Straßenzüge.',
    fund: '§ 5 Abs. 1 BauGB, § 9 Abs. 7 BauGB',
    warum: 'Der Hubschrauber sieht die ganze Stadt, der Bauzaun steht an einem Grundstück.' },

  { id: 'genauigkeit', merkmal: 'Wie genau ist er?',
    fnp: 'Nur in den Grundzügen. Er ist nicht parzellenscharf — man kann aus ihm nicht ablesen, wo genau eine Grundstücksgrenze verläuft.',
    bplan: 'Parzellenscharf. Er zeigt einzelne Grundstücke, Baugrenzen und Maße.',
    fund: '§ 5 Abs. 1 BauGB',
    warum: 'Deshalb kann aus dem Flächennutzungsplan nie folgen, ob DEIN Grundstück bebaubar ist — ' +
           'er weiß gar nicht, wo dein Grundstück aufhört.' },

  { id: 'fachwort', merkmal: 'Wie heißt das, was drinsteht?',
    fnp: 'Darstellungen.',
    bplan: 'Festsetzungen.',
    fund: '§ 5 BauGB, § 9 BauGB',
    warum: 'Das ist das Wort, an dem man in einer Prüfung sofort erkennt, ob jemand die beiden Pläne ' +
           'auseinanderhält. Eselsbrücke: Der Hubschrauber stellt nur DAR, der Bauzaun SETZT etwas FEST.' },

  { id: 'rechtsform', merkmal: 'Welche Rechtsform hat er?',
    fnp: 'Keine Rechtsnorm. Die Gemeinde beschließt ihn, die höhere Verwaltungsbehörde genehmigt ihn.',
    bplan: 'Eine Satzung — also eine Rechtsnorm der Gemeinde.',
    fund: '§ 6 BauGB, § 10 Abs. 1 BauGB',
    warum: 'Aus der Rechtsform folgt alles Weitere: Eine Satzung bindet jeden, eine bloße Darstellung nicht.' },

  { id: 'bindung', merkmal: 'Wen bindet er?',
    fnp: 'Nur Behörden und öffentliche Planungsträger. Der Bürger ist an ihn nicht gebunden — und kann aus ihm auch nichts für sich herleiten.',
    bplan: 'Jeden. Bürger, Nachbarn, Bauherren und die Gemeinde selbst.',
    fund: '§ 7 BauGB',
    warum: 'Der häufigste Denkfehler: „Im Flächennutzungsplan steht Wohnbaufläche, also darf ich bauen." ' +
           'Nein — der Plan redet nur mit dem Amt.' },

  { id: 'baurecht', merkmal: 'Folgt daraus Baurecht?',
    fnp: 'Nein. Aus einer Darstellung im Flächennutzungsplan folgt kein Anspruch auf eine Baugenehmigung.',
    bplan: 'Ja, beim qualifizierten Bebauungsplan: Wer seinen Festsetzungen nicht widerspricht und dessen Erschließung gesichert ist, darf bauen.',
    fund: '§ 30 Abs. 1 BauGB',
    warum: 'Das ist der eigentliche Unterschied in einem Satz — und der, auf den es in der Wertermittlung ankommt.' },

  { id: 'verhaeltnis', merkmal: 'Wie hängen die beiden zusammen?',
    fnp: 'Er ist die Grundlage. Aus ihm wird der Bebauungsplan entwickelt.',
    bplan: 'Er ist aus dem Flächennutzungsplan zu entwickeln — das nennt man das Entwicklungsgebot.',
    fund: '§ 8 Abs. 2 Satz 1 BauGB',
    warum: 'Die Reihenfolge ist keine Formsache: Ein Bebauungsplan, der nicht aus dem Flächennutzungsplan ' +
           'entwickelt ist, kann deshalb unwirksam sein.' },

  { id: 'massstab', merkmal: 'In welchem Maßstab liegt er üblicherweise vor?',
    fnp: 'Grob, etwa 1:5.000 bis 1:25.000.',
    bplan: 'Fein, etwa 1:500 bis 1:1.000.',
    fund: 'nicht im Gesetz geregelt, so ist es in der Praxis üblich',
    warum: 'Der Maßstab ist kein Zufall, sondern die Folge: Grundzüge brauchen keine Zentimeter, Festsetzungen schon.' },

  { id: 'inhalt', merkmal: 'Was liest man dort ab?',
    fnp: 'Bauflächen mit einem Buchstaben: W für Wohnbauflächen, M für gemischte Bauflächen, G für gewerbliche Bauflächen, S für Sonderbauflächen.',
    bplan: 'Baugebiete mit zwei Buchstaben — WA, MI, GE — dazu das Maß der baulichen Nutzung, die Bauweise und die überbaubare Grundstücksfläche.',
    fund: '§ 1 BauNVO, § 9 BauGB',
    warum: 'Eine schnelle Probe: Eine Fläche hat EINEN Buchstaben, ein Gebiet hat ZWEI. ' +
           'Achtung, keine eiserne Regel — der Flächennutzungsplan darf auch schon Baugebiete darstellen.' },

  { id: 'inkraft', merkmal: 'Wie wird er wirksam?',
    fnp: 'Mit der Genehmigung durch die höhere Verwaltungsbehörde und der ortsüblichen Bekanntmachung dieser Genehmigung.',
    bplan: 'Mit der ortsüblichen Bekanntmachung des Satzungsbeschlusses.',
    fund: '§ 6 Abs. 5 BauGB, § 10 Abs. 3 BauGB',
    warum: 'Beide brauchen die Bekanntmachung. Nur der Flächennutzungsplan braucht zusätzlich die Genehmigung von oben.' },

  { id: 'wert', merkmal: 'Was folgt daraus für den Bodenwert?',
    fnp: 'Eine Darstellung als Wohnbaufläche ist der klassische Anhaltspunkt für Bauerwartungsland — ' +
         'eine bauliche Nutzung wird mit hinreichender Sicherheit erwartet, mehr noch nicht.',
    bplan: 'Ein qualifizierter Bebauungsplan macht die Fläche zu Rohbauland; ist die Erschließung gesichert und ' +
           'die Fläche zweckmäßig geschnitten, ist sie baureifes Land.',
    fund: '§ 3 Abs. 2 bis 4 ImmoWertV',
    warum: 'Hier treffen sich Planungsrecht und Wertermittlung. Zwischen Bauerwartungsland und baureifem Land ' +
           'liegt oft mehr als das Doppelte im Bodenwert — deshalb muss man die beiden Pläne unterscheiden können.' },

  { id: 'angriff', merkmal: 'Kann man vor Gericht dagegen vorgehen?',
    fnp: 'In aller Regel nicht unmittelbar. Er ist keine Rechtsnorm, gegen die der Bürger vorgehen könnte.',
    bplan: 'Ja. Gegen die Satzung ist die Normenkontrolle vor dem Oberverwaltungsgericht möglich.',
    fund: '§ 47 VwGO',
    warum: 'Auch das folgt aus der Rechtsform: Angreifen kann man nur, was einen bindet.' }
];

/* ------------------------------------------- Begriffe, die man verwechselt */
const BLP_PAARE = [
  { a: 'Darstellung', b: 'Festsetzung',
    erklaerungA: 'Steht im Flächennutzungsplan. Sie zeigt eine Absicht und bindet nur Behörden.',
    erklaerungB: 'Steht im Bebauungsplan. Sie ist rechtsverbindlich und bindet jeden.',
    fund: '§ 5 BauGB, § 9 BauGB' },

  { a: 'Baufläche', b: 'Baugebiet',
    erklaerungA: 'Die grobe Sorte: Wohnbaufläche W, gemischte Baufläche M, gewerbliche Baufläche G, Sonderbaufläche S. Ein Buchstabe.',
    erklaerungB: 'Die feine Sorte: reines Wohngebiet WR, allgemeines Wohngebiet WA, Mischgebiet MI, Gewerbegebiet GE. Zwei Buchstaben.',
    fund: '§ 1 Abs. 1 und 2 BauNVO' },

  { a: 'Baulinie', b: 'Baugrenze',
    erklaerungA: 'Auf ihr MUSS gebaut werden. Das Gebäude muss die Linie aufnehmen.',
    erklaerungB: 'Sie DARF nicht überschritten werden. Dahinter darf man bleiben, davor nicht.',
    fund: '§ 23 BauNVO' },

  { a: 'Grundflächenzahl GRZ', b: 'Geschossflächenzahl GFZ',
    erklaerungA: 'Wie viel Quadratmeter Grundfläche je Quadratmeter Grundstücksfläche überbaut werden dürfen — der Fußabdruck.',
    erklaerungB: 'Wie viel Quadratmeter Geschossfläche je Quadratmeter Grundstücksfläche zulässig sind — alle Geschosse zusammen.',
    fund: '§ 19 BauNVO, § 20 BauNVO' },

  { a: 'Qualifizierter Bebauungsplan', b: 'Einfacher Bebauungsplan',
    erklaerungA: 'Enthält mindestens Art und Maß der baulichen Nutzung, die überbaubaren Grundstücksflächen und die örtlichen Verkehrsflächen. Er allein entscheidet über die Zulässigkeit.',
    erklaerungB: 'Enthält weniger. Für alles, was er nicht regelt, gilt zusätzlich § 34 oder § 35 BauGB.',
    fund: '§ 30 Abs. 1 und 3 BauGB' },

  { a: 'Innenbereich', b: 'Außenbereich',
    erklaerungA: 'Innerhalb der im Zusammenhang bebauten Ortsteile. Gebaut werden darf, was sich in die Eigenart der näheren Umgebung einfügt.',
    erklaerungB: 'Alles übrige. Gebaut werden darf nur ausnahmsweise — privilegierte Vorhaben, sonst nur wenn keine öffentlichen Belange beeinträchtigt werden.',
    fund: '§ 34 BauGB, § 35 BauGB' },

  { a: 'Offene Bauweise', b: 'Geschlossene Bauweise',
    erklaerungA: 'Gebäude mit seitlichem Grenzabstand, höchstens 50 Meter lang.',
    erklaerungB: 'Gebäude ohne seitlichen Grenzabstand — sie werden an die Nachbargrenze gebaut.',
    fund: '§ 22 BauNVO' },

  { a: 'Vorhabenbezogener Bebauungsplan', b: 'Bebauungsplan der Innenentwicklung',
    erklaerungA: 'Hängt an einem konkreten Vorhaben und einem Durchführungsvertrag mit dem Vorhabenträger.',
    erklaerungB: 'Vereinfachtes Verfahren für Nachverdichtung im bestehenden Ort.',
    fund: '§ 12 BauGB, § 13a BauGB' }
];

/* ------------------------------------- Wo darf gebaut werden: der Kernweg */
const BLP_ZULAESSIG = [
  { pnr: '30', name: 'Im Geltungsbereich eines Bebauungsplans',
    wann: 'Für das Grundstück gibt es einen Bebauungsplan.',
    massstab: 'Das Vorhaben darf den Festsetzungen nicht widersprechen und die Erschließung muss gesichert sein.',
    fein: 'Beim qualifizierten Bebauungsplan entscheidet er allein. Beim einfachen kommt § 34 oder § 35 BauGB dazu.' },

  { pnr: '33', name: 'Während der Planaufstellung',
    wann: 'Der Bebauungsplan ist noch nicht fertig, aber schon so weit gediehen, dass mit ihm zu rechnen ist.',
    massstab: 'Man nennt das Planreife: Die Öffentlichkeits- und Behördenbeteiligung ist durch, das Vorhaben widerspricht den künftigen Festsetzungen nicht, der Antragsteller erkennt sie schriftlich an, die Erschließung ist gesichert.',
    fein: 'Für die Wertermittlung wichtig: Ab hier kann schon Rohbauland vorliegen.' },

  { pnr: '34', name: 'Im unbeplanten Innenbereich',
    wann: 'Kein qualifizierter Bebauungsplan, aber das Grundstück liegt innerhalb der im Zusammenhang bebauten Ortsteile.',
    massstab: 'Das Vorhaben muss sich nach Art und Maß der baulichen Nutzung, der Bauweise und der überbaubaren Grundstücksfläche in die Eigenart der näheren Umgebung einfügen; die Erschließung muss gesichert sein.',
    fein: 'Die Nachbarschaft ist hier der Plan. Man liest ihn aus der vorhandenen Bebauung ab.' },

  { pnr: '35', name: 'Im Außenbereich',
    wann: 'Weder Bebauungsplan noch im Zusammenhang bebauter Ortsteil.',
    massstab: 'Privilegierte Vorhaben — etwa Land- und Forstwirtschaft, Windenergie — sind zulässig, wenn öffentliche Belange nicht entgegenstehen. Alle übrigen nur, wenn öffentliche Belange nicht beeinträchtigt werden.',
    fein: 'Der Außenbereich soll grundsätzlich frei von Bebauung bleiben. Für die Wertermittlung heißt das meist: Fläche der Land- oder Forstwirtschaft.' }
];

/* ----------------------------------------------- Die Baugebiete der BauNVO */
const BLP_GEBIETE = [
  { kuerzel: 'WS', name: 'Kleinsiedlungsgebiet', pnr: '2', zweck: 'Kleinsiedlungen mit Nutzgärten, landwirtschaftliche Nebenerwerbsstellen.' },
  { kuerzel: 'WR', name: 'Reines Wohngebiet', pnr: '3', zweck: 'Dient ausschließlich dem Wohnen.' },
  { kuerzel: 'WA', name: 'Allgemeines Wohngebiet', pnr: '4', zweck: 'Dient vorwiegend dem Wohnen. Läden und Gaststätten zur Versorgung des Gebiets sind zulässig.' },
  { kuerzel: 'WB', name: 'Besonderes Wohngebiet', pnr: '4a', zweck: 'Bebaute Gebiete, in denen Wohnen mit Gewerbe gemischt ist und erhalten werden soll.' },
  { kuerzel: 'MD', name: 'Dorfgebiet', pnr: '5', zweck: 'Land- und forstwirtschaftliche Betriebe, Wohnen und nicht störendes Gewerbe nebeneinander.' },
  { kuerzel: 'MDW', name: 'Dörfliches Wohngebiet', pnr: '5a', zweck: 'Wohnen und landwirtschaftliche Nebenerwerbsstellen im dörflichen Bestand.' },
  { kuerzel: 'MI', name: 'Mischgebiet', pnr: '6', zweck: 'Wohnen und nicht wesentlich störende Gewerbebetriebe — beides gleichrangig.' },
  { kuerzel: 'MU', name: 'Urbanes Gebiet', pnr: '6a', zweck: 'Dichte Mischung von Wohnen, Gewerbe und sozialen Einrichtungen; die Mischung muss nicht gleichgewichtig sein.' },
  { kuerzel: 'MK', name: 'Kerngebiet', pnr: '7', zweck: 'Handelsbetriebe, zentrale Einrichtungen der Wirtschaft, Verwaltung und Kultur — die Innenstadt.' },
  { kuerzel: 'GE', name: 'Gewerbegebiet', pnr: '8', zweck: 'Nicht erheblich belästigende Gewerbebetriebe.' },
  { kuerzel: 'GI', name: 'Industriegebiet', pnr: '9', zweck: 'Gewerbebetriebe, die anderswo unzulässig sind — vor allem erheblich störende.' },
  { kuerzel: 'SO', name: 'Sondergebiet', pnr: '10', zweck: 'Erholung nach § 10 BauNVO, sonstige Sondergebiete nach § 11 BauNVO, etwa Einkaufszentren oder Kliniken.' }
];

/* ------------------------------------------ Maß der baulichen Nutzung usw. */
const BLP_MASS = [
  { begriff: 'Grundflächenzahl (GRZ)', pnr: '19',
    was: 'Gibt an, wie viel Quadratmeter Grundfläche je Quadratmeter Grundstücksfläche zulässig sind.',
    beispiel: 'GRZ 0,4 auf 800 m² Grundstück: 320 m² dürfen überbaut werden.' },
  { begriff: 'Geschossflächenzahl (GFZ)', pnr: '20',
    was: 'Gibt an, wie viel Quadratmeter Geschossfläche je Quadratmeter Grundstücksfläche zulässig sind.',
    beispiel: 'GFZ 0,8 auf 800 m² Grundstück: 640 m² Geschossfläche.' },
  { begriff: 'Baumassenzahl (BMZ)', pnr: '21',
    was: 'Gibt an, wie viel Kubikmeter Baumasse je Quadratmeter Grundstücksfläche zulässig sind. Vor allem in Gewerbe- und Industriegebieten.',
    beispiel: 'BMZ 6,0 auf 1.000 m²: 6.000 m³ Baumasse.' },
  { begriff: 'Zahl der Vollgeschosse', pnr: '20',
    was: 'Wird meist in römischen Ziffern festgesetzt. II heißt: zwei Vollgeschosse.',
    beispiel: 'Im Plan steht II — zwei Vollgeschosse sind zulässig.' },
  { begriff: 'Überbaubare Grundstücksfläche', pnr: '23',
    was: 'Wird durch Baulinien, Baugrenzen oder Bebauungstiefen bestimmt.',
    beispiel: 'Die gestrichelte Linie im Plan ist die Baugrenze — davor darf nichts stehen.' },
  { begriff: 'Bauweise', pnr: '22',
    was: 'Offen heißt: mit seitlichem Grenzabstand, höchstens 50 Meter lang. Geschlossen heißt: ohne seitlichen Grenzabstand.',
    beispiel: 'Im Plan steht ein kleines o — offene Bauweise.' },
  { begriff: 'Kappungsgrenze bei der GRZ', pnr: '19',
    was: 'Garagen, Stellplätze, Zufahrten und Nebenanlagen dürfen die zulässige Grundfläche um bis zu 50 Prozent überschreiten, höchstens jedoch bis zu einer GRZ von 0,8.',
    beispiel: 'GRZ 0,4 plus Garagen: höchstens 0,6 — und nie über 0,8.' }
];

/* ------------------------------ Was der Planungsstand für den Wert bedeutet */
const BLP_WERT = [
  { zustand: 'Fläche der Land- oder Forstwirtschaft', abs: '§ 3 Abs. 1 ImmoWertV',
    planung: 'Außenbereich nach § 35 BauGB, keine konkrete Bauabsicht der Gemeinde.',
    merken: 'Acker bleibt Acker, solange niemand plant.' },
  { zustand: 'Bauerwartungsland', abs: '§ 3 Abs. 2 ImmoWertV',
    planung: 'Eine bauliche Nutzung wird aufgrund konkreter Tatsachen mit hinreichender Sicherheit erwartet — ' +
             'etwa weil der Flächennutzungsplan dort Wohnbaufläche darstellt.',
    merken: 'Der Hubschrauber hat die Fläche schon rosa eingefärbt. Mehr noch nicht.' },
  { zustand: 'Rohbauland', abs: '§ 3 Abs. 3 ImmoWertV',
    planung: 'Die Fläche ist nach § 30, § 33 oder § 34 BauGB für eine bauliche Nutzung bestimmt, ' +
             'aber die Erschließung ist noch nicht gesichert oder der Zuschnitt reicht nicht.',
    merken: 'Bauen dürfte man — nur kommt man noch nicht hin.' },
  { zustand: 'Baureifes Land', abs: '§ 3 Abs. 4 ImmoWertV',
    planung: 'Nach öffentlich-rechtlichen Vorschriften und nach den tatsächlichen Gegebenheiten baulich nutzbar.',
    merken: 'Der Bagger könnte morgen anrücken.' },
  { zustand: 'Sonstige Flächen', abs: '§ 3 Abs. 5 ImmoWertV',
    planung: 'Alles, was sich keinem der vier Zustände zuordnen lässt.',
    merken: 'Die Restkiste — nicht die Ausrede für Unsicherheit.' }
];

/* --------------------------------------------------- Fälle zum Entscheiden */
const BLP_FAELLE = [
  { fall: 'Ein Acker am Ortsrand. Im Flächennutzungsplan ist die Fläche als Wohnbaufläche dargestellt, ein Bebauungsplan besteht nicht, ein Aufstellungsbeschluss auch nicht.',
    frage: 'Welcher Entwicklungszustand, und darf dort gebaut werden?',
    antwort: 'Bauerwartungsland nach § 3 Abs. 2 ImmoWertV. Gebaut werden darf nicht: Der Flächennutzungsplan bindet nur Behörden, ' +
             'die Zulässigkeit richtet sich nach § 35 BauGB — Außenbereich.',
    falle: 'Der häufigste Fehler ist, aus der Darstellung im Flächennutzungsplan schon Bauland zu machen.' },

  { fall: 'Ein unbebautes Grundstück in einer Baulücke zwischen zwei Wohnhäusern. Ein Bebauungsplan besteht nicht. Straße, Wasser und Kanal liegen an.',
    frage: 'Nach welcher Vorschrift richtet sich die Zulässigkeit, und welcher Entwicklungszustand liegt vor?',
    antwort: '§ 34 BauGB — unbeplanter Innenbereich. Das Vorhaben muss sich in die Eigenart der näheren Umgebung einfügen. ' +
             'Da die Erschließung gesichert ist, handelt es sich um baureifes Land nach § 3 Abs. 4 ImmoWertV.',
    falle: 'Ohne Bebauungsplan heißt nicht ohne Baurecht. Im Innenbereich ist die Nachbarschaft der Plan.' },

  { fall: 'Ein Grundstück im Geltungsbereich eines Bebauungsplans, der WA, GRZ 0,4, GFZ 0,8, II und offene Bauweise festsetzt. Die Erschließungsstraße ist noch nicht gebaut.',
    frage: 'Welcher Entwicklungszustand?',
    antwort: 'Rohbauland nach § 3 Abs. 3 ImmoWertV. Die Fläche ist nach § 30 BauGB für eine bauliche Nutzung bestimmt, ' +
             'aber die Erschließung ist noch nicht gesichert.',
    falle: 'Ein qualifizierter Bebauungsplan allein macht noch kein baureifes Land. Die Erschließung entscheidet.' },

  { fall: 'Ein Bebauungsplan setzt nur die Art der baulichen Nutzung fest, sonst nichts.',
    frage: 'Um welche Art von Bebauungsplan handelt es sich, und was gilt für den Rest?',
    antwort: 'Ein einfacher Bebauungsplan nach § 30 Abs. 3 BauGB. Für alles, was er nicht regelt, richtet sich die Zulässigkeit ' +
             'zusätzlich nach § 34 oder § 35 BauGB.',
    falle: 'Qualifiziert ist ein Plan erst mit Art UND Maß der baulichen Nutzung, überbaubaren Grundstücksflächen UND örtlichen Verkehrsflächen.' },

  { fall: 'Ein Landwirt will am Ortsrand außerhalb jeder Bebauung einen Stall für seinen Betrieb errichten.',
    frage: 'Nach welcher Vorschrift ist das zu beurteilen, und wie stehen die Chancen?',
    antwort: '§ 35 BauGB — Außenbereich. Ein landwirtschaftlicher Betrieb ist ein privilegiertes Vorhaben nach § 35 Abs. 1 BauGB ' +
             'und daher zulässig, wenn öffentliche Belange nicht entgegenstehen und die Erschließung gesichert ist.',
    falle: 'Privilegiert heißt nicht automatisch genehmigt — die öffentlichen Belange werden trotzdem geprüft.' },

  { fall: 'Für ein Gebiet läuft das Bebauungsplanverfahren. Die Öffentlichkeits- und Behördenbeteiligung ist abgeschlossen, mit dem Beschluss ist zu rechnen.',
    frage: 'Kann schon gebaut werden?',
    antwort: 'Ja, unter den Voraussetzungen des § 33 BauGB — Planreife. Das Vorhaben darf den künftigen Festsetzungen nicht ' +
             'widersprechen, der Antragsteller muss sie schriftlich anerkennen und die Erschließung muss gesichert sein.',
    falle: '§ 33 wird gern vergessen. In der Wertermittlung ist er die Brücke vom Bauerwartungsland zum Rohbauland.' },

  { fall: 'Ein Grundstück von 800 m² im WA, GRZ 0,4, GFZ 0,8.',
    frage: 'Wie viel darf überbaut werden, und wie viel Geschossfläche ist zulässig?',
    antwort: 'Überbaubar 800 m² × 0,4 = 320 m². Zulässige Geschossfläche 800 m² × 0,8 = 640 m². ' +
             'Garagen und Nebenanlagen dürfen die 320 m² um bis zu 50 Prozent überschreiten, höchstens bis zu einer GRZ von 0,8.',
    falle: 'Die GRZ ist der Fußabdruck, die GFZ die Summe aller Geschosse. Wer beide verwechselt, verrechnet sich um das Doppelte.' },

  { fall: 'Im Bebauungsplan steht eine durchgezogene Linie entlang der Straße und eine gestrichelte Linie zum Garten hin.',
    frage: 'Was bedeuten die beiden Linien?',
    antwort: 'Die durchgezogene Linie ist eine Baulinie — auf ihr muss gebaut werden. Die gestrichelte ist eine Baugrenze — ' +
             'sie darf nicht überschritten werden. Beides steht in § 23 BauNVO.',
    falle: 'Baulinie ist ein Muss, Baugrenze ein Darf-nicht-darüber. Eselsbrücke: Die durchgezogene Linie zieht das Haus an sich heran.' }
];
