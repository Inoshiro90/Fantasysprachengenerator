# Herkunft und Lizenz: kurdischSoraniAussprache.json

## Quelle: WikiPron (Wiktionary)

**Quelle:** [WikiPron](https://github.com/CUNY-CL/wikipron) (CUNY-CL), siehe
`URDU_AUSSPRACHE_LIZENZ.md` für die ausführliche Erklärung der Methodik.
Verwendete Rohdatei: `data/scrape/tsv/ckb_arab_broad.tsv` (ISO-639-3-Code
`ckb` für Kurdisch/Sorani, 981 Zeilen). Eine engere Transkription
(`ckb_arab_narrow.tsv`) existiert bei WikiPron nicht. Direkt vom
CUNY-CL-GitHub-Repository bezogen.

**Lizenz:** CC BY-SA 4.0 (über Wiktionary, siehe WikiPron-README).

**Ergebnis:** 972 eindeutige Wörter.

## Wie die lateinische Lesung erzeugt wurde

Wie bei Urdu/Paschtu wurde jedes der 60 verschiedenen IPA-Symbole einzeln
auf die im Projekt etablierte Lesekonvention abgebildet
(ARABISCH_KONSONANTEN/ARABISCH_HALBVOKALE in `transliterationClient.js`).
Sorani-spezifische Besonderheiten:
- Der velarisierte/"dunkle" l-Laut ڵ (/ɫ/) wird nicht vom gewöhnlichen
  ل (/l/) unterschieden - beide werden zu "l".
- Tap-r ر (/ɾ/) und Roll-r ڕ (/r/) werden beide zu "r".
- Die palatalisierten Verschlusslaute /c/, /ɟ/ (vor bestimmten
  Vokalen auftretende Varianten von k/g) werden als "k"/"g" geschrieben.
- Vokallängen-Unterschiede werden wie im Rest des Projekts nicht kodiert.

Drei einzelne Buchstaben (ب, ڕ, ڵ) erscheinen im Wörterbuch ohne Vokal
("b", "r", "l") - das sind reine Alphabet-Buchstabeneinträge (wie z. B.
"b" für den Buchstaben B), keine eigenständigen Wörter, und wurden daher
anders als beim Paschtu-"د" (siehe `PASHTO_AUSSPRACHE_LIZENZ.md`) nicht
manuell korrigiert.

## Verwendung im Projekt

`js/transliterationClient.js` schlägt für **Kurdisch/Sorani (ckb-IQ)**
jedes Wort zunächst in dieser Liste nach
(`transliteriereSoraniMitAussprache()`, gleicher Ansatz wie bei Urdu/
Paschtu); bei einem Treffer wird die daraus gewonnene lateinische Lesung
direkt verwendet, sonst greift wie bisher die allgemeine arabische
Konsonant+Vokal-Heuristik.

**Abdeckung:** 972 Wörter - ein nützlicher Ausschnitt, kein vollständiges
Lexikon (deutlich kleiner als Farsi/Urdu/Paschtu, da WikiPron für Sorani
insgesamt weniger Wiktionary-Einträge mit Ausspracheangabe findet).
Wörter ohne Treffer verhalten sich exakt wie vorher (keine Regression).
