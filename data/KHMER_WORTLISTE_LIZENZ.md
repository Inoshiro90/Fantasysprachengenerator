# Herkunft und Lizenz: khmerWortliste.json

Wird generiert aus `tools/generate-khmer-wordlist.py` auf Basis von
`tools/khmer-chuon-nath-source.bgl`.

**Quelle:** Chuon-Nath-Khmer-Wörterbuch (វចនានុក្រម ជួន ណាត), das
kambodschanische Standardnachschlagewerk, ursprünglich herausgegeben vom
Buddhist Institute, Phnom Penh (Erstausgabe 1938, Autor Samdech Preah
Sangharaja Chuon Nath, gest. 1969). Die hier verwendete Datei ist ein
digitales Babylon-Glossary-Kompilat (.bgl) ohne erkennbaren eigenen
Lizenzhinweis.

**Was übernommen wurde:** Ausschließlich die reinen Khmer-
Wort-SCHREIBWEISEN (Stichwörter, ≥ 2 Zeichen) als Liste, NICHT die
lexikographischen Definitionen/Erklärungen des Wörterbuchs. Eine Liste
"diese Zeichenfolge ist ein im Khmer gültiges Wort" ist eine Sammlung
sprachlicher Fakten, keine Übernahme der eigentlichen
Wörterbuch-Erklärungen.

**Rechtlicher Hinweis:** Der genaue urheberrechtliche Status des
Original-Wörterbuchs (Ersterscheinung 1938, institutioneller
Herausgeber) sowie des vorliegenden digitalen Kompilats ist nicht
abschließend geklärt - für das digitale BGL-Kompilat liegt kein
Lizenzvermerk vor. Diese Datei stellt keine Rechtsberatung dar. Beim
Weiterverbreiten dieses Projekts sollte die Herkunft (siehe oben)
dokumentiert bleiben; bei kommerzieller Nutzung wird eine gesonderte
Prüfung empfohlen.

## Verwendung im Projekt

`js/khmerTransliteration.js` nutzt diese Liste (per `fetch()`, einmalig
geladen und gecached) für eine Wörterbuch-gestützte Wortgrenzen-Erkennung
VOR der eigentlichen Zeichen-für-Zeichen-Umschrift (siehe
`transliteriereKhmerMitWortliste()`). WICHTIG: Die Liste enthält keine
Ausspracheinformationen und verbessert daher vor allem die Lesbarkeit der
Ausgabe (Wortzwischenräume an erkannten Wortgrenzen) - sie behebt NICHT
die im Modul dokumentierte silbeninterne Unschärfe bei der
Vokal-Zuordnung selbst.
