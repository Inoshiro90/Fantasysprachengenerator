# Herkunft und Lizenz: js/laoTransliteration.js

**Quelle:** Portiert von Lua nach JavaScript aus Wiktionarys
"Module:lo-translit"
(https://en.wiktionary.org/wiki/Module:lo-translit), Stand der vom Nutzer
bereitgestellten Fassung.

**Lizenz:** CC BY-SA 4.0 (Standardlizenz von Wikimedia-Projekten
einschließlich Wiktionary, gilt auch für Scribunto-/Lua-Module als
Wiki-Seiteninhalt).

**Namensnennung:** Die ursprünglichen Autor:innen des Moduls sind der
Versionsgeschichte von
https://en.wiktionary.org/wiki/Module:lo-translit zu entnehmen.

**Weitergabe unter gleichen Bedingungen:** Da `js/laoTransliteration.js`
eine Bearbeitung (Portierung) des Original-Lua-Moduls ist, sollte diese
Datei bei Weiterverbreitung des Projekts ebenfalls unter CC BY-SA 4.0
(oder einer kompatiblen Lizenz) stehen bzw. entsprechend gekennzeichnet
bleiben.

**Was geändert wurde:**
- Übersetzung von Lua nach JavaScript (Datenstrukturen, Kontrollfluss,
  Lua-Patternmatching durch entsprechende JS-Vergleiche/Regex ersetzt).
- Die Wiktionary-spezifische HTML-Ausgabe für Wiederholungszeichen
  (`ຯ`/`ໆ`, im Original `<u>...</u>`) und Streichungszeichen (`໌`, im
  Original `<del>...</del>`) wurde durch reine Textentsprechungen ersetzt
  (Silbe im Klartext wiederholt bzw. das betroffene Zeichen weggelassen),
  da dieses Projekt keine HTML-Ausgabe verwendet.
- Eine zusätzliche ASCII-sichere Ersatzschreibweise für die
  LC-Sonderbuchstaben (ā, ư, ǭ, œ, æ, ǫ, ʼ ...) wurde ergänzt, da der
  nachgelagerte `asciiSanitizer.js`-Schritt dieses Projekts sie sonst
  entfernen würde (teils ersatzlos, siehe Kommentar im Modul).

Die eigentlichen Umschriftregeln (Konsonanten-, Vokal- und
Koda-Zuordnung, Silbentrennungslogik) sind inhaltlich unverändert
gegenüber der Quelle.
