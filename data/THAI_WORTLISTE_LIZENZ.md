# Herkunft und Lizenz: thaiWortliste.json

**Quelle:** [nv23/thai-wordlist](https://github.com/nv23/thai-wordlist),
eine vom Nutzer bereitgestellte Liste thailändischer Wort-Schreibweisen
(Rohdatei: `tools/thai-wordlist.json`, 19.069 Einträge).

**Lizenz:** MIT License, Copyright (c) 2015 Pakkapon Phongtawee.

```
The MIT License (MIT)
Copyright (c) 2015 Pakkapon Phongtawee
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Die MIT-Lizenz erlaubt Nutzung, Kopie, Modifikation und Weiterverbreitung
(auch kommerziell) uneingeschränkt, solange der obige Copyright- und
Lizenzhinweis erhalten bleibt. Dieser Hinweis übernimmt genau diese
Funktion für das vorliegende Projekt.

**Was übernommen wurde:** Ausschließlich die reinen thailändischen
Wort-SCHREIBWEISEN als Liste, KEINE Ausspracheinformationen (das
Original-Repository liefert nur Schreibweisen, keine Lautung/Umschrift).
`data/thaiWortliste.json` ist eine bereinigte Teilmenge der Rohdatei (siehe
`tools/generate-thai-wordlist.py`):

- nur Einträge, die ausschließlich aus thailändischen Schriftzeichen
  bestehen (U+0E00–U+0E7F) - die Rohdatei enthält vereinzelt
  Lautmalerei-Wendungen mit eingebetteten Leerzeichen (z. B.
  "กุก ๆ กัก"), die als Mehrwort-Phrase die Wortgrenzen-Erkennung
  verfälschen würden und daher verworfen wurden, statt sie nur zu trimmen
- mindestens 2 Zeichen (Einzelbuchstaben helfen der Wortgrenzen-Suche
  nicht und würden mitten in einer fremden Silbe fälschlich als eigenes
  "Wort" erkannt werden können)
- Duplikate entfernt

18.694 von 19.069 Einträgen wurden übernommen (375 verworfen, siehe oben).

## Verwendung im Projekt

`js/thaiWordSegmentation.js` nutzt diese Liste (per `fetch()`, einmalig
geladen und gecached) für eine wörterbuchgestützte Wortgrenzen-Erkennung
VOR der eigentlichen zeichenbasierten Umschrift (`THAI_MAP` in
`js/transliterationClient.js`, siehe `transliteriereThaiMitWortliste()`).
Wie bei Khmer/Chinesisch enthält die Liste keine Ausspracheinformationen -
sie verbessert daher ausschließlich die Lesbarkeit der Ausgabe
(Wortzwischenräume an erkannten Wortgrenzen), behebt aber nicht die im
Kopfkommentar von `THAI_MAP` dokumentierte Einschränkung bei der
Vokalreihenfolge innerhalb einer Silbe.
