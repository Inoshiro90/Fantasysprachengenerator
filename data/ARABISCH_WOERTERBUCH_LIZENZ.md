# Herkunft und Lizenz: arabische Morphologiedateien

Betrifft:
- `arabischPraefixe.json`
- `arabischSuffixe.json`
- `arabischStaemmeVoll.json`
- `arabischKompatibilitaet.json`

Alle vier werden generiert aus `tools/generate-arabic-morphology.mjs` auf
Basis der `tools/bama-*.txt`-Dateien (dictPrefixes, dictSuffixes,
dictStems, tableAB, tableAC, tableBC).

**Quelle:** Buckwalter Arabic Morphological Analyzer, Version 1.0
(LDC-Katalognummer LDC2002L49).

**Copyright:** (c) 2002 QAMUS LLC (www.qamus.org), (c) 2002 Trustees of
the University of Pennsylvania.

**Lizenz:** GNU General Public License, Version 2 (GPLv2).

**Bezogen über:** AraMorph (Java-Port von BAMA 1.0, Autor: Pierrick
Brihaye), https://github.com/tafkhan/AraMorph – ebenfalls GPLv2, enthält
die Original-BAMA-1.0-Lexikondaten in redistributierbarer Form.

**Hinweis zur Weiterverwendung:** Die vier JSON-Dateien sind eine
abgeleitete, automatisiert erzeugte Form (Buckwalter-Transliteration nach
Arabisch/Unicode konvertiert, sonst inhaltlich unverändert) der oben
genannten GPLv2-lizenzierten Daten. Beim Weiterverbreiten dieses Projekts
sollte dieser Copyright- und Lizenzhinweis erhalten bleiben. Diese Datei
stellt keine Rechtsberatung dar.

## Verwendung im Projekt

`js/transliterationClient.js` nutzt diese Daten zur Laufzeit (per
`fetch()`, einmalig geladen und gecached) für eine echte
Präfix+Stamm+Suffix-Segmentierung arabischer Wörter (siehe
`segmentiereUndVokalisiere()` dort) - deutlich genauer als die reine
Standardvokal-Heuristik, auf die bei fehlendem Treffer oder fehlgeschlagenem
Laden weiterhin zurückgefallen wird.

(Vorgänger-Version: Eine frühere, einfachere Fassung nutzte nur die
Stämme aus dictStems ohne Präfix/Suffix-Segmentierung. Diese wurde durch
die vollständige Segmentierung ersetzt und ist nicht mehr Teil des
Projekts.)
