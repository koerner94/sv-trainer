/* SV-Trainer - Symbole und Gedächtnispalast

   ZWECK. Die 28 Merkbilder aus dem Merktrainer sagen dir, WAS zu einem Paragrafen
   gehört. Sie sagen dir aber nicht, WELCHE Paragrafen es überhaupt gibt und in
   welcher Reihenfolge. Genau das leistet ein Gedächtnispalast: ein fester Rundgang
   mit festen Stationen. Du gehst ihn im Kopf ab und findest dabei jeden Paragrafen
   wieder, ohne ihn zu suchen.

   BELEG. Method of Loci. In einer kontrollierten Studie stieg die Merkleistung nach
   sechs Wochen Training von 26 auf 62 von 72 Wörtern, und der Vorsprung hielt vier
   Monate ohne weiteres Üben an. Der Effekt wirkt gezielt auf haltbare Erinnerungen,
   nicht nur auf das Kurzzeitgedächtnis.

   REGELN. Der Rundgang ist ein Weg von draußen nach drinnen und dann nach oben:
   Feldweg, Straße, Grundstück, Garten, Haustür, Keller, Küche, Obergeschoss, Dach.
   Jede Station liegt körperlich dort, wo die Szene des Merkbilds ohnehin spielt -
   die Rose wächst im Vorgarten, die Schuhe stehen im Flur, die Mine liegt im Keller.
   Deshalb musst du nichts Neues lernen, nur den Weg.

   Die Reihenfolge der Stationen darf sich NIE ändern. Ein Palast, dessen Räume
   wandern, ist schlimmer als keiner. Merkwörter und Szenen sind wortgleich aus
   fahrplan_trainer.json und daten-rechenwege.js.
*/

/* Ein Sinnbild je Merkbild. Es ersetzt das Merkwort nicht, es hängt sich daneben:
   Bilder werden nachweislich besser behalten als Wörter (Picture-Superiority-Effekt),
   und das gilt unabhängig davon, ob jemand innerlich gut Bilder sieht. */
const SYMBOLE = {
  1: '\u{1FAD6}', 2: '\u{1F6A2}', 3: '\u{1F38B}', 4: '\u{1F98C}', 6: '\u{1F45F}',
  7: '\u{1F404}', 8: '\u{1F9DA}', 9: '\u{1F40D}', 10: '\u{1F96B}', 12: '\u{1F332}',
  13: '\u{1F452}', 21: '\u{1F3B5}', 24: '\u{1F939}', 25: '⛵', 27: '\u{1F3C6}',
  28: '\u{1F9EE}', 31: '\u{1F98B}', 32: '⛏️', 33: '\u{1F3FA}', 34: '\u{1F30A}',
  35: '\u{1F9F1}', 36: '\u{1F9F6}', 38: '\u{1F426}', 39: '\u{1F4C1}', 40: '\u{1F339}',
  42: '\u{1FAA8}', 48: '\u{1F48D}', 194: '\u{1F418}'
};

/* Der Rundgang. nr = Schrittzahl auf dem Weg, ort = wo du stehst,
   paragraf = was dort liegt, kurz = worum es geht, verbindung = warum es dort liegt. */
const PALAST = [
  { nr: 1, ort: 'Der Feldweg am Ortsrand', paragraf: 42, kurz: 'Bauerwartungsland und Rohbauland',
    verbindung: 'Du kommst zu Fuß über einen Feldweg. Im Gras steht der graue Runenstein, in den eine Zukunft geritzt ist: Hier wird einmal gebaut. Noch führt keine Straße hin.' },
  { nr: 2, ort: 'Der Wochenmarkt', paragraf: 194, kurz: 'der Verkehrswert nach dem Baugesetzbuch',
    verbindung: 'Der Feldweg mündet auf einen belebten Wochenmarkt. Mittendrin tastet der Tapir mit dem Rüssel die Preisschilder ab, und über allem hängt die große Bahnhofsuhr.' },
  { nr: 3, ort: 'Die Straße vor dem Haus', paragraf: 24, kurz: 'Grundlagen des Vergleichswertverfahrens',
    verbindung: 'Vom Markt biegst du in die Straße ein. Dort jongliert der Narr im Flickengewand mit lauter gleich großen roten Äpfeln und lässt jede Birne fallen.' },
  { nr: 4, ort: 'Der Bach am Straßenrand', paragraf: 25, kurz: 'Vergleichspreise',
    verbindung: 'Neben der Straße fließt ein Bach. Auf ihm schwimmen viele fast gleiche Feluken mit demselben dreieckigen Segel, und am Ufer notiert ein Händler jeden Preis.' },
  { nr: 5, ort: 'Die Einfahrt mit dem Maibaum', paragraf: 3, kurz: 'Entwicklungszustand',
    verbindung: 'In der Einfahrt steht ein Maibaum. An seinem Stamm hängen vier bunte Bänder übereinander, das oberste dicht unter der Krone.' },
  { nr: 6, ort: 'Der Zaun um das Grundstück', paragraf: 48, kurz: 'Erbbaurecht und Erbbaugrundstück',
    verbindung: 'Statt eines Zauns liegt ein schwerer goldener Reif um das Grundstück. In ihn ist eine Zahl eingraviert, die sichtbar herunterzählt.' },
  { nr: 7, ort: 'Der Vorgarten', paragraf: 40, kurz: 'Allgemeines zur Bodenwertermittlung',
    verbindung: 'Hinter dem Reif liegt nackte Erde bis zum Zaun, kein Haus, kein Schuppen. Mitten darin wächst eine einzige kräftige rote Rose.' },
  { nr: 8, ort: 'Das Nachbargrundstück', paragraf: 13, kurz: 'Bodenrichtwert',
    verbindung: 'Gleich nebenan steht die Dame im eleganten Mantel auf einem Grundstück, das es so gar nicht gibt, und hält ein Preisschild hoch.' },
  { nr: 9, ort: 'Der Ast über dem Gartenweg', paragraf: 9, kurz: 'Eignung der Daten prüfen und anpassen',
    verbindung: 'Über dem Weg in den Garten hängt ein Ast, und auf ihm liegt die große Boa, die sich an jede Krümmung schmiegt.' },
  { nr: 10, ort: 'Die Tanne im Garten', paragraf: 12, kurz: 'die erforderlichen Daten',
    verbindung: 'Im Garten steht eine Tanne, an deren Zweigen die Daten hängen wie Christbaumkugeln. Am Stamm klebt der lange Beipackzettel.' },
  { nr: 11, ort: 'Die Weide hinter dem Zaun', paragraf: 7, kurz: 'Marktanpassung',
    verbindung: 'Hinter dem Gartenzaun steht die schwere gefleckte Kuh auf der Weide, drei Glocken um den Hals, und über ihr zieht das Wetter.' },
  { nr: 12, ort: 'Die Lichtung dahinter', paragraf: 4, kurz: 'Alter, Gesamt- und Restnutzungsdauer',
    verbindung: 'Auf der Lichtung steht das Reh, und über ihm schwebt die große Sanduhr: oben der Sand, der noch kommt, unten der, der durch ist.' },
  { nr: 13, ort: 'Die alte Mühle im Garten', paragraf: 35, kurz: 'Grundlagen des Sachwertverfahrens',
    verbindung: 'Zurück im Garten steht die alte Windmühle und mahlt rückwärts: Oben kommt das Haus hinein, unten kommen Ziegel, Beton und Holz heraus.' },
  { nr: 14, ort: 'Das Dach der Mühle', paragraf: 38, kurz: 'Alterswertminderungsfaktor',
    verbindung: 'Auf dem Mühlendach sitzt die uralte Möwe mit ausgeblichenem Gefieder. Man sieht ihr an, wie wenig noch vor ihr liegt.' },
  { nr: 15, ort: 'Die Haustür und der Flur', paragraf: 6, kurz: 'Verfahrenswahl und die drei Schritte',
    verbindung: 'Du gehst zur Haustür. Im Flur stehen drei Schuhe nebeneinander: Wanderschuh, Gummistiefel, Arbeitsschuh mit Stahlkappe. Jeder wird in drei Schritten geschnürt.' },
  { nr: 16, ort: 'Die Kellertreppe', paragraf: 32, kurz: 'Bewirtschaftungskosten',
    verbindung: 'Hinter der ersten Tür geht es in den Keller, und von der Sohle gehen genau vier Stollen ab. Ein fünfter Gang ist zugemauert.' },
  { nr: 17, ort: 'Die Küche', paragraf: 1, kurz: 'Anwendungsbereich der Verordnung',
    verbindung: 'Wieder oben stehst du in der Küche. Auf der Anrichte dampft eine Teekanne, daneben zwei Tassen, auf der Kanne ein Etikett mit der Zahl 194.' },
  { nr: 18, ort: 'Der Küchentisch', paragraf: 31, kurz: 'Rohertrag und Reinertrag',
    verbindung: 'Auf dem Küchentisch liegt ein dicker Stapel Geldscheine, und eine riesige graue Motte frisst mit lautem Knabbern vier Löcher hinein.' },
  { nr: 19, ort: 'Der zweite Stuhl am Tisch', paragraf: 28, kurz: 'allgemeines Ertragswertverfahren',
    verbindung: 'Auf dem Stuhl gegenüber sitzt dein Neffe und rechnet laut vor: Reinertrag, Bodenwertverzinsung abziehen, Rest mal Barwertfaktor, Bodenwert wieder drauf.' },
  { nr: 20, ort: 'Der Küchenstuhl in der Ecke', paragraf: 36, kurz: 'durchschnittliche Herstellungskosten',
    verbindung: 'Auf dem Stuhl in der Ecke liegt ein halbfertiger Pullover. Du siehst jede einzelne Masche, und jemand dreht an zwei Rädchen.' },
  { nr: 21, ort: 'Die Speisekammer', paragraf: 10, kurz: 'Modellkonformität',
    verbindung: 'In der Speisekammer steht auf dem Regal eine Blechdose mit eigenem Deckel, und auf dem Deckel klebt das Rezept, nach dem der Inhalt gekocht wurde.' },
  { nr: 22, ort: 'Die Vitrine im Wohnzimmer', paragraf: 33, kurz: 'angepasster Liegenschaftszinssatz',
    verbindung: 'Im Wohnzimmer liegt in einer Vitrine eine Mumie, Schicht für Schicht bandagiert. Der Restaurator wickelt nur dort neu, wo die Binde nicht mehr sitzt.' },
  { nr: 23, ort: 'Das Fenster mit Meerblick', paragraf: 34, kurz: 'Barwertfaktor',
    verbindung: 'Aus dem Wohnzimmerfenster siehst du ein Meer bis zum Horizont. Jede Welle ist ein Jahresertrag, und weit draußen werden sie flacher.' },
  { nr: 24, ort: 'Das Bad, die Wanne', paragraf: 2, kurz: 'Wertermittlungs- und Qualitätsstichtag',
    verbindung: 'Im Bad schwimmt in der Wanne die Arche, und Noah steht an Deck mit je einem Kalender in jeder Hand.' },
  { nr: 25, ort: 'Der Schreibtisch im Arbeitszimmer', paragraf: 39, kurz: 'angepasster Sachwertfaktor',
    verbindung: 'Auf dem Schreibtisch liegt eine dicke Mappe aus Pappe, und darin steckt ein einziges Blatt mit einer Zahl.' },
  { nr: 26, ort: 'Der Besprechungstisch daneben', paragraf: 21, kurz: 'Liegenschaftszinssatz und Sachwertfaktor ableiten',
    verbindung: 'Am Tisch daneben sitzt der Gutachterausschuss wie eine Jury und hält Noten hoch, so wie beim Eiskunstlaufen.' },
  { nr: 27, ort: 'Das Dach', paragraf: 27, kurz: 'Grundlagen des Ertragswertverfahrens',
    verbindung: 'Über die Bodentreppe kommst du aufs Dach. Dort steht Nike, die geflügelte Siegesgöttin aus Stein, und hält einen Lorbeerkranz hoch.' },
  { nr: 28, ort: 'Über dem Dach', paragraf: 8, kurz: 'besondere objektspezifische Grundstücksmerkmale',
    verbindung: 'Ganz zum Schluss schwebt über dem Dach die Fee und tippt alles an. Was gewöhnlich ist, bleibt blass. Was auffällt, leuchtet knallrot und schwebt nach oben.' }
];

/* Wie der Rundgang in Abschnitte zerfällt - so lernst du ihn in Häppchen
   statt am Stück. Jeder Abschnitt ist eine Runde wert. */
const PALAST_ABSCHNITTE = [
  { von: 1, bis: 6, name: 'Der Weg zum Objekt', symbol: '\u{1F6B6}' },
  { von: 7, bis: 14, name: 'Grundstück und Garten', symbol: '\u{1F333}' },
  { von: 15, bis: 21, name: 'Im Haus, unten', symbol: '\u{1F6AA}' },
  { von: 22, bis: 28, name: 'Oben und aufs Dach', symbol: '\u{1FA9C}' }
];
