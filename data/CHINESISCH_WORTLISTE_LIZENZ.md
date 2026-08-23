# Herkunft und Lizenz: chinesischWortlisteSimp.json / chinesischWortlisteTrad.json

**Quelle:** [CC-CEDICT](https://cc-cedict.org/), das community-gepflegte
Chinesisch-Englisch-Wörterbuch, veröffentlicht von MDBG
(https://www.mdbg.net/chinese/dictionary?page=cc-cedict). Verwendet wurde
der offizielle, tagesaktuelle Export vom 2026-08-15 (124.850 Einträge),
bezogen über den automatisch synchronisierten Spiegel
https://github.com/rhcarvalho/cedict.

**Lizenz:** CC-CEDICT steht unter der
[Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/)
(CC BY-SA 4.0). Referenzwerk: CEDICT, Copyright (C) 1997, 1998 Paul Andrew
Denisowski.

**Was übernommen wurde:** Drei unterschiedliche Verwendungen aus derselben
CC-CEDICT-Quelle:

1. **Wortlisten** (diese Datei-Familie, `chinesischWortlisteSimp.json` /
   `...Trad.json`): ausschließlich die chinesischen Wort-SCHREIBWEISEN mit
   mindestens zwei Zeichen (getrennt nach vereinfachter und
   traditioneller Schreibung), als reine Zeichenketten-Liste - OHNE
   Pinyin-Angaben oder Definitionen. Dient nur der Worttrennung (siehe
   unten), nicht der Lautung.
2. **Einzelzeichen-Pinyin-Ergänzung** (`js/chinesePinyin.js`, gekennzeichneter
   Block am Dateiende): für 6.305 einzelne Schriftzeichen, die in der
   ursprünglich vom Nutzer bereitgestellten Basistabelle fehlten (v. a.
   traditionelle Schriftzeichen), wurde zusätzlich die tonlose
   Pinyin-Lautung aus CC-CEDICT übernommen (jeweils die erste in der
   CC-CEDICT-Datei gelistete Lesung je Zeichen - bei mehrdeutigen
   (polyphonen) Zeichen keine kontextabhängige Auswahl, siehe
   Einschränkung im Kopfkommentar von chinesePinyin.js). Die
   englischsprachigen Definitionen wurden auch hier nicht übernommen.
3. **Wortbasierte Polyphon-Korrektur** (`data/chinesischWortPinyinSimp.json` /
   `...Trad.json`, erzeugt über `tools/generate-chinese-word-pinyin.py` aus
   der Rohdatei `tools/cedict_raw.txt`): für mehrsilbige Wörter, deren
   wortbasierte Pinyin-Lesung von der zeichenweisen Standardlesung
   abweicht (z. B. 行动 "xingdong", nicht die zeichenweise Standardlesung
   "hangdong"), wird die im CC-CEDICT-Wörterbucheintrag für das GANZE Wort
   hinterlegte Lesung übernommen - jeweils die erste gelistete, bei
   mehreren mit exakt gleicher Schreibweise. Ebenfalls nur Lautung, keine
   Definitionen. Bewusst nur die polyphon-relevante TEILMENGE (rund 14.400
   von über 100.000 möglichen Mehrzeichen-Einträgen je Schriftvariante),
   um die Tabelle auf den tatsächlichen Mehrwert zu fokussieren, siehe
   Skript-Kopfkommentar.

**CC BY-SA / Share-Alike:** Da es sich um eine Teilmenge (Stichwortliste)
eines CC BY-SA-lizenzierten Werks handelt, unterliegt auch diese Datei den
Bedingungen von CC BY-SA 4.0: Weitergabe nur mit Namensnennung (siehe oben)
und unter derselben Lizenz. Dieser Hinweis ist diese Namensnennung; beim
Weiterverbreiten des Projekts sollte er erhalten bleiben.

## Verwendung im Projekt

`js/chineseWordSegmentation.js` nutzt die Wortliste (per `fetch()`, einmalig
geladen und gecached, je nach Zielsprache `zh-CN`→Simp bzw. `zh-TW`→Trad),
um VOR der eigentlichen Pinyin-Umschrift Wortgrenzen in den (im
Original leerzeichenlosen) chinesischen Text einzufügen. Das ist der
gleiche Grundgedanke wie bei `khmerTransliteration.js`
(`transliteriereKhmerMitWortliste()`), mit einem Unterschied: anders als im
Khmer-Modul wird bei Chinesisch auch zwischen NICHT im Wörterbuch
gefundenen Einzelzeichen ein Leerzeichen gesetzt (jedes chinesische
Schriftzeichen ist potenziell eine eigene Silbe/ein eigenes Wort) - nur
erkannte Mehrzeichen-Wörter werden dabei als zusammenhängender Block
behandelt. Dadurch entsteht die für romanisiertes Chinesisch übliche
wortweise Leerzeichen-Setzung statt eines einzigen langen
Zeichenblocks.

Dieselbe Funktion nutzt zusätzlich die wortbasierte Polyphon-Korrektur-
Tabelle: erkennt sie bei der Wortgrenzen-Suche ein Wort, das AUCH in dieser
Tabelle steht, wird direkt die dort hinterlegte (kontextrichtige) Lesung
eingesetzt, statt das Wort zeichenweise über `chinesePinyin.js` zu lesen.
Das behebt die dort dokumentierte Polyphon-Einschränkung für alle
abgedeckten Wörter - nicht abgedeckte Wörter (inkl. aller Wörter, bei
denen zeichenweises Lesen ohnehin schon korrekt ist) durchlaufen
unverändert die bisherige zeichenweise Umschrift.
