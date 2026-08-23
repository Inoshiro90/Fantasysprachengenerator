# Herkunft und Lizenz: urduAussprache.json

## Quelle: WikiPron (Wiktionary)

**Quelle:** [WikiPron](https://github.com/CUNY-CL/wikipron) (CUNY-CL), ein
Werkzeug/Datensatz-Projekt, das Ausspracheangaben (IPA) massenhaft aus
Wiktionary extrahiert (siehe Lee et al. 2020, "Massively Multilingual
Pronunciation Mining with WikiPron"). Verwendete Rohdateien:
`data/scrape/tsv/urd_arab_broad.tsv` (breite/phonemische IPA-Transkription
für Urdu in arabischer Schrift, 7.709 Zeilen) und
`data/scrape/tsv/urd_arab_narrow.tsv` (enge/phonetische Transkription,
309 Zeilen, nur zur Ergänzung zusätzlicher, in der breiten Datei nicht
vorhandener Wörter genutzt). Bezogen über den GitHub-Raw-Zugriff auf das
CUNY-CL-Repository.

**Lizenz:** Der WikiPron-Code steht unter Apache 2.0, die im `data/`-
Verzeichnis gesammelten Ausspracheangaben selbst unterliegen laut
WikiPron-README ausdrücklich weiterhin den Lizenzbedingungen von
Wiktionary (https://en.wiktionary.org/wiki/Wiktionary:Copyrights), also
CC BY-SA 4.0 (bzw. zusätzlich GFDL).

## Wie die lateinische Lesung erzeugt wurde

Jedes IPA-Symbol wurde einzeln auf die im Projekt bereits etablierte
lateinische Lesekonvention abgebildet (dieselbe wie in
`ARABISCH_KONSONANTEN`/`ARABISCH_HALBVOKALE` in `transliterationClient.js`,
z. B. kh, gh, sh, zh, ch, dh, q, ' für Hamza/Ayn, w/y für Halbvokale).
Retroflexe Konsonanten (ʈ, ɖ, ɽ) werden dabei - konsistent mit der
bestehenden Behandlung von ٹ/ڈ/ڑ in ARABISCH_KONSONANTEN - nicht von
ihren dentalen Gegenstücken unterschieden. Aspirierte Konsonanten (kʰ,
bʱ, d̪ʱ, ɡʱ, t͡ʃʰ, ...) werden mit denselben Digraphen wie die jeweils
"nächstliegenden" arabischen Buchstaben geschrieben (kh, bh, dh, gh,
chh) - das entspricht der in informeller Urdu-Latinisierung üblichen
Praxis, auch wenn dadurch z. B. کھ (aspiriertes k) und خ (x) beide als
"kh" erscheinen. Vokallängen-Unterschiede werden dabei bewusst nicht
kodiert, konsistent mit der übrigen Umschrift-Praxis im Projekt (keine
Diakritika im Endergebnis). Nasalierung, Betonung und weitere seltene
IPA-Diakritika werden verworfen. Bei mehreren dokumentierten Aussprachen
desselben Wortes wurde die erste (meist die Standard-/häufigste)
übernommen.

## Verwendung im Projekt

`js/transliterationClient.js` schlägt für **Urdu (ur-PK)** jedes Wort
zunächst in dieser Liste nach (`transliteriereUrduMitAussprache()`); bei
einem Treffer wird die daraus gewonnene lateinische Lesung direkt
verwendet, sonst greift wie bisher die allgemeine arabische
Konsonant+Vokal-Heuristik (siehe ARABISCH_KONSONANTEN). Andere Sprachen,
die sich dieselbe Heuristik teilen (ar-SA, ps-PK, ckb-IQ), sind davon
bewusst NICHT betroffen - die Daten sind urdu-spezifisch und würden bei
anderen Sprachen trotz teils gleicher Schriftzeichen falsche Lautungen
liefern.

**Abdeckung:** 6.306 Wörter (6.294 aus der breiten + 12 zusätzlich aus
der engen Transkription) - ein nützlicher Ausschnitt, kein vollständiges
Lexikon. Wörter ohne Treffer verhalten sich exakt wie vorher (keine
Regression).
