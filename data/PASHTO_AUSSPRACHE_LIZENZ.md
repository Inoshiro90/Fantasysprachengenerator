# Herkunft und Lizenz: pashtoAussprache.json

## Quelle 1: WikiPron (Wiktionary) - dokumentiert, CC BY-SA 4.0

**Quelle:** [WikiPron](https://github.com/CUNY-CL/wikipron) (CUNY-CL), siehe
auch die ausführliche Erklärung in `URDU_AUSSPRACHE_LIZENZ.md` für die
Methodik. Verwendete Rohdateien: `data/scrape/tsv/pus_arab_broad.tsv`
(1.414 Zeilen) und `data/scrape/tsv/pus_arab_narrow.tsv` (194 Zeilen,
ISO-639-3-Code `pus` für Paschtu). Direkt vom CUNY-CL-GitHub-Repository
bezogen.

**Lizenz:** CC BY-SA 4.0 (über Wiktionary, siehe WikiPron-README - die
Ausspracheangaben selbst unterliegen weiterhin den Wiktionary-Lizenz-
bedingungen, unabhängig von der Apache-2.0-Lizenz des WikiPron-Codes).

**Ergebnis:** 1.088 eindeutige Wörter.

## Quelle 2: lexicon.tsv aus github.com/ihanif/neurlang-dataset - NICHT dokumentiert

Auf Wunsch des Nutzers zusätzlich eingebunden: die Datei `pashto/lexicon.tsv`
aus dem Repository https://github.com/ihanif/neurlang-dataset (Branch
`master`), das ein IPA-Ausspracheverzeichnis für 130+ Sprachen sammelt.

**Geprüfte Lizenzlage:** Das Repository dokumentiert im README für die
meisten Sprachen einzeln Quelle und Lizenz (u. a. MIT, Apache-2.0, CC0,
CC-BY-NC-4.0, je nach Sprache) - **für Paschtu fehlt dort jede Angabe**.
Ein direkter Abgleich mit WikiPron zeigt: von 4.026 Wörtern in
`lexicon.tsv` überschneiden sich 983 (~24 %) mit den WikiPron-Daten, davon
472 mit identischer Lautschrift - ein Hinweis darauf, dass zumindest ein
Teil der Datei auf WikiPron zurückgehen dürfte. Der überwiegende Rest
(abweichende Lautungen bei den überschneidenden Wörtern sowie rund
3.036 Wörter ohne jede Entsprechung in WikiPron) hat **keine im
Quell-Repository nachvollziehbare Herkunfts- oder Lizenzangabe**.

**Deshalb in diesem Projekt so gehandhabt:** Nur Wörter aus `lexicon.tsv`,
die NICHT bereits über WikiPron abgedeckt sind, wurden übernommen (3.036
zusätzliche Wörter). Bei Überschneidung gewinnt immer WikiPron (dokumentierte
Lizenz). Die 3.036 zusätzlichen Wörter sind als **Lizenz nicht dokumentiert**
zu behandeln - analog zur "Quelle 3" in `FARSI_AUSSPRACHE_LIZENZ.md`.

## Manuelle Korrektur: "د" (Genitiv-/Possessivpartikel "von")

WikiPron listet für viele einzelne Buchstaben mehrere Aussprachen: die
"nackte" Konsonantenlautung (wie der Buchstabe in echten Wörtern klingt)
UND den Buchstaben-Namen fürs Alphabet-Vorlesen (z. B. ج -> "dzhim",
و -> "waw", analog zum deutschen "Be" für den Buchstaben B). Die
automatische Verarbeitung nimmt standardmäßig die erste Zeile - bei den
meisten Buchstaben ist das korrekt die nackte Konsonantenlautung.

Eine Ausnahme: **"د" ist selbst ein extrem häufiges, eigenständiges
Wort** (die Genitiv-/Possessivpartikel "von", z. B. in "د ... سره" =
"mit ... von"), keine bloße Buchstabenbezeichnung. Die automatisch
gewählte erste WikiPron-Zeile lieferte hier nur die nackte Konsonanten-
lautung "d" (technisch korrekt für die reduzierte Aussprache, aber ohne
jeden Vokal praktisch schwer weiterverarbeitbar). WikiPron listet für
"د" zusätzlich die Variante "d ə" (die volle Zitierform) - diese wurde
manuell statt der ersten Zeile übernommen ("da" statt "d"). Alle
anderen der 36 betroffenen Mehrfach-Einträge wurden NICHT angefasst,
da deren einzige Alternative jeweils der Buchstaben-Name ist (z. B.
"dal" für د selbst, "kaf" für ک) - das wäre für echten Fließtext falsch.

## Wie die lateinische Lesung erzeugt wurde

Wie bei Urdu (siehe `URDU_AUSSPRACHE_LIZENZ.md`) wurde jedes IPA-Symbol
einzeln auf die im Projekt etablierte Lesekonvention abgebildet
(ARABISCH_KONSONANTEN/ARABISCH_HALBVOKALE in `transliterationClient.js`).
Paschtu-spezifische Affrikaten (څ /t͡s/, ځ /d͡z/) erhalten eigene Digraphe
"ts"/"dz". `lexicon.tsv` liefert die IPA durchgehend ohne Trennzeichen
zwischen den Lauten (anders als WikiPron); die Umschrift dafür verwendet
denselben Zeichen-Zuordnungstisch, aber eine Tokenisierung nach längstem
Treffer (analog zu `ersetzeMitLaengstemTreffer()` im Code), um
Mehrzeichen-Symbole (Affrikaten, retroflexe Buchstaben mit Diakritika)
korrekt zu erkennen.

## Verwendung im Projekt

`js/transliterationClient.js` schlägt für **Paschtu (ps-PK)** jedes Wort
zunächst in dieser Liste nach (`transliteriereParschtuMitAussprache()`,
gleicher Ansatz wie bei Urdu); bei einem Treffer wird die daraus
gewonnene lateinische Lesung direkt verwendet, sonst greift wie bisher
die allgemeine arabische Konsonant+Vokal-Heuristik.

**Abdeckung:** 4.124 Wörter gesamt (1.088 dokumentiert/WikiPron + 3.036
zusätzlich, Lizenz nicht dokumentiert) - ein nützlicher Ausschnitt, kein
vollständiges Lexikon. Wörter ohne Treffer verhalten sich exakt wie
vorher (keine Regression).
