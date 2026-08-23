# Herkunft und Lizenz: hebraeischVokalisierung.json

Diese Datei kombiniert zwei Quellen mit unterschiedlicher Lizenz und
unterschiedlichem Sprachregister. Bei Überschneidungen (dasselbe
unvokalisierte Wort in beiden Quellen) hat **UniMorph stets Vorrang**, da
es modernes Hebräisch abbildet - UXLC ergänzt nur zusätzliche, dort nicht
vorhandene Wörter.

## Quelle 1: UniMorph Hebrew (modernes Hebräisch)

**Quelle:** [UniMorph Hebrew](https://github.com/unimorph/heb), Teil des
UniMorph-Projekts (morphologische Datenbanken für viele Sprachen,
ursprünglich für den SIGMORPHON-2021-Shared-Task zur morphologischen
Reinflection zusammengestellt). Laut Projekt-README stammen die Daten aus
Wiktionary und wurden von Omer Goldman annotiert/teilweise durch
Muttersprachler geprüft.

Verwendete Rohdateien: `heb` (unvokalisierte Wortformen, Ktiv Male) und
`heb_voc` (vokalisierte Wortformen mit vollständigem Niqqud), jeweils im
UniMorph-Format `LEMMA<TAB>FORM<TAB>MORPHOLOGISCHE-TAGS`.

**Lizenz:** [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/)
(CC BY-SA 3.0).

Aus den beiden UniMorph-Rohdateien wurden Paare aus (unvokalisierter
Wortform, vokalisierter Wortform) gebildet:

1. Für ca. 78 % der Einträge wurde die tatsächliche unvokalisierte
   Ktiv-Male-Schreibweise aus der Datei `heb` verwendet (Zuordnung über
   Lemma-ohne-Niqqud + identische morphologische Tags zur Datei
   `heb_voc`) - das ist die genauere, gängige moderne Schreibweise.
2. Für die restlichen ca. 22 % (keine eindeutige Zuordnung möglich) wurde
   ersatzweise einfach das Niqqud aus der vokalisierten Form entfernt.
   Das entspricht nicht immer exakt der modernen Ktiv-Male-Schreibweise
   (die z. B. zusätzliche Vav/Jod als Lesehilfen einfügt, wo punktierter
   Text sie über Niqqud allein ausdrückt) - dieser Teil der Paare ist
   also mit etwas geringerer Trefferwahrscheinlichkeit behaftet.

Ergebnis: 24.940 eindeutige (unvokalisiert → vokalisiert)-Wortpaare.

## Quelle 2: Unicode/XML Leningrad Codex (UXLC/WLC, biblisches Hebräisch)

**Quelle:** [openscriptures/morphhb](https://github.com/openscriptures/morphhb)
(Open Scriptures Hebrew Bible), das den kompletten Text des Westminster
Leningrad Codex (WLC) - die älteste vollständige Handschrift des Tanach,
vollständig mit Niqqud und Kantillationszeichen (Te'amim) - im
maschinenlesbaren OSIS-XML-Format bereitstellt. Ursprüngliche Textquelle:
https://www.tanach.us/Tanach.xml (Christopher V. Kimball).

**Lizenz:** Der hebräische Bibeltext selbst ist gemeinfrei (**Public
Domain**, so explizit sowohl auf tanach.us als auch im morphhb-Repository
vermerkt). Die von openscriptures zusätzlich ergänzten Lemma-/Morphologie-
Annotationen stehen unter CC BY 4.0 - diese wurden hier NICHT übernommen,
nur der reine Bibeltext.

**Wichtige Einschränkung:** Dies ist **biblisches**, nicht modernes
Hebräisch (ca. 3000 Jahre alt). Kernvokabular und viele Wurzeln
überschneiden sich stark mit dem modernen Ivrit (das bewusst auf
biblischer/rabbinischer Basis wiederbelebt wurde), aber Grammatik (z. B.
Verbkonjugation) und ein guter Teil des Alltags-/Fachwortschatzes aus
maschinell übersetzten Texten (Technik, Politik, moderne Konzepte) sind
im Tanach nicht abgedeckt. Die UniMorph-Priorität oben stellt sicher,
dass bei einer Überschneidung immer die moderne Form gewinnt.

**Wie extrahiert wurde:** Aus allen 39 Büchern wurden die `<w>`-Elemente
(Wortformen) gelesen, Morphem-Trennzeichen ("/", markiert
Präfix-/Wortgrenzen im OSIS-Format) entfernt, Kantillationszeichen sowie
Satzzeichen (Paseq, Sof Pasuq u. Ä.) gestrichen (Niqqud/Dagesch/Schin-Sin-
Punkt bleiben erhalten, da `transliteriereHebraeisch()` diese verarbeitet).
Bei mehreren unterschiedlichen Vokalisierungen derselben unvokalisierten
Form über den ganzen Tanach hinweg (~305.500 Wort-Tokens) wurde die
häufigste gewählt. Ergebnis: 39.522 eindeutige Wortformen, davon 34.468
zusätzlich zu UniMorph (der Rest überschnitt sich mit bereits vorhandenen
UniMorph-Einträgen und wurde zugunsten des moderneren UniMorph-Eintrags
verworfen).

## Verwendung im Projekt

`js/transliterationClient.js` sucht für jedes Wort im hebräischen/
jiddischen Eingabetext zunächst in dieser Liste nach einer vokalisierten
Entsprechung. Wird eine gefunden, ersetzt sie das unpunktierte Wort VOR
dem Aufruf von `transliteriereHebraeisch()` - die dort bereits vorhandene
Niqqud-Logik (siehe deren Kopfkommentar) übernimmt dann die eigentliche
Umschrift inklusive korrekter Vokale. Wird kein Treffer gefunden, greift
wie bisher die unpunktierte Heuristik. Das ist derselbe Grundgedanke wie
bei der chinesischen Wortliste (`chineseWordSegmentation.js`) und der
Khmer-Wortliste (`khmerTransliteration.js`): eine Wörterbuch-Ergänzung vor
der eigentlichen Umschrift-Engine, mit transparentem Fallback bei fehlendem
Treffer.

**Abdeckung:** Insgesamt 59.408 Wortpaare (24.940 modern + 34.468
biblisch ergänzt). Das ist immer noch kein vollständiges Lexikon - bei
freien Übersetzungen wird weiterhin nur ein Teil des vorkommenden
Wortschatzes getroffen (v. a. moderne Fach-/Alltagsbegriffe ohne
biblisches Pendant bleiben ungetroffen). Trotzdem eine strikte
Verbesserung gegenüber der reinen Heuristik: Wörter mit Treffer werden
zuverlässig korrekt vokalisiert, alle anderen verhalten sich exakt wie
vorher (keine Regression).

