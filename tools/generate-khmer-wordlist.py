#!/usr/bin/env python3
"""
generate-khmer-wordlist.py

Offline-Werkzeug (läuft NICHT im Browser, nur einmalig lokal per
`python3 tools/generate-khmer-wordlist.py`): liest die Stichwörter aus
`khmer-chuon-nath-source.bgl` (Babylon-Glossary-Format des Chuon-Nath-
Wörterbuchs, dem kambodschanischen Standardnachschlagewerk) und schreibt
eine reine Wortliste (nur die Khmer-Schreibweisen, KEINE Definitionen/
Übersetzungen) nach data/khmerWortliste.json.

Benötigt das Python-Paket "pyglossary" (`pip install pyglossary
--break-system-packages`), das u. a. den BGL-Binärformat-Parser mitbringt.

VERWENDUNGSZWECK: js/khmerTransliteration.js nutzt diese Liste für eine
Wörterbuch-gestützte Wortgrenzen-Erkennung (längste-Übereinstimmung-
zuerst) VOR der eigentlichen Zeichen-für-Zeichen-Umschrift, da Khmer-Text
Wörter nicht durch Leerzeichen trennt (siehe Moduldoku dort).

WICHTIG ZUR HERKUNFT/LIZENZ (siehe auch data/KHMER_WORTLISTE_LIZENZ.md):
Nur die reinen Wort-SCHREIBWEISEN werden übernommen, nicht die
lexikographischen Definitionen/Erklärungen des Wörterbuchs selbst (die
eigentliche schöpferische/urheberrechtlich relevante Leistung der
Lexikographen). Eine Liste "diese Buchstabenfolge ist ein gültiges
Khmer-Wort" ist eine Sammlung sprachlicher Fakten, keine Übernahme der
Wörterbuch-Erklärungen. Das digitale BGL-Kompilat selbst trägt keinen
erkennbaren Lizenzhinweis - beim Weiterverbreiten dieses Projekts sollte
die Herkunft (Chuon-Nath-Wörterbuch, Buddhist Institute Phnom Penh)
dokumentiert bleiben.
"""

import json
import os
import unicodedata

try:
    from pyglossary.glossary_v2 import Glossary
except ImportError as exc:
    raise SystemExit(
        "pyglossary fehlt. Installieren mit:\n"
        "  pip install pyglossary --break-system-packages"
    ) from exc

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(HIER, "khmer-chuon-nath-source.bgl")
ZIEL = os.path.join(HIER, "..", "data", "khmerWortliste.json")


def ist_reines_khmer(wort):
    """Nur Stichwörter, die ausschließlich aus Khmer-Schriftzeichen
    bestehen (kein Latein, keine Leerzeichen, keine Dateinamen etc.)."""
    if not wort:
        return False
    return all("\u1780" <= zeichen <= "\u17ff" for zeichen in wort)


def main():
    Glossary.init()
    glossar = Glossary()
    glossar.directRead(QUELLE)

    woerter = set()
    for eintrag in glossar:
        for wort in eintrag.l_word:
            wort = unicodedata.normalize("NFC", wort.strip())
            if ist_reines_khmer(wort) and len(wort) >= 2:
                woerter.add(wort)

    ausgabe = {
        "_hinweis": (
            "Automatisch extrahiert aus dem Chuon-Nath-Khmer-Wörterbuch "
            "(Buddhist Institute, Phnom Penh) im Babylon-Glossary-Format. "
            "Enthaelt NUR Wort-Schreibweisen (>= 2 Zeichen), keine "
            "Definitionen/Übersetzungen. Siehe data/KHMER_WORTLISTE_LIZENZ.md."
        ),
        "woerter": sorted(woerter),
    }

    os.makedirs(os.path.dirname(ZIEL), exist_ok=True)
    with open(ZIEL, "w", encoding="utf-8") as datei:
        json.dump(ausgabe, datei, ensure_ascii=False, separators=(",", ":"))

    print(f"Eindeutige Khmer-Wörter (>= 2 Zeichen): {len(woerter)}")
    print(f"Geschrieben nach: {ZIEL}")


if __name__ == "__main__":
    main()
