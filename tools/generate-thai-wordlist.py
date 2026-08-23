#!/usr/bin/env python3
"""
generate-thai-wordlist.py

Erzeugt data/thaiWortliste.json aus der vom Nutzer bereitgestellten
Rohdatei thai-wordlist.json (Quelle: https://github.com/nv23/thai-wordlist,
MIT-Lizenz, Copyright (c) 2015 Pakkapon Phongtawee - siehe
data/THAI_WORTLISTE_LIZENZ.md).

Bereinigung (analog zum Vorgehen bei Khmer/Chinesisch, siehe
KHMER_WORTLISTE_LIZENZ.md / CHINESISCH_WORTLISTE_LIZENZ.md):
  - nur reine Wort-SCHREIBWEISEN im thailaendischen Unicode-Bereich
    (U+0E00-U+0E7F), KEINE Mehrwort-Phrasen (Rohdatei enthaelt vereinzelt
    Lautmalerei-Wendungen mit eingebetteten Leerzeichen, z. B.
    "กุก ๆ กัก" - diese wuerden die Wortgrenzen-Erkennung verfaelschen und
    werden daher verworfen, nicht nur getrimmt)
  - mindestens 2 Zeichen (Einzelbuchstaben helfen der Wortgrenzen-Suche
    nicht und koennten mitten in einer fremden Silbe faelschlich als
    eigenes "Wort" erkannt werden)
  - Duplikate entfernt
"""
import json
import re
import unicodedata

QUELLE = "thai-wordlist.json"
ZIEL = "../data/thaiWortliste.json"

THAI_WORT_REGEX = re.compile(r"^[\u0E00-\u0E7F]+$")


def main():
    with open(QUELLE, encoding="utf-8") as f:
        roh = json.load(f)

    bereinigt = set()
    verworfen = 0
    for eintrag in roh:
        wort = unicodedata.normalize("NFC", eintrag.strip())
        if len(wort) >= 2 and THAI_WORT_REGEX.fullmatch(wort):
            bereinigt.add(wort)
        else:
            verworfen += 1

    woerter = sorted(bereinigt)
    print(f"Rohdatei: {len(roh)} Eintraege")
    print(f"Verworfen (Mehrwort-Phrasen/Einzelbuchstaben/Duplikate): {len(roh) - len(woerter)}")
    print(f"Uebernommen: {len(woerter)} Woerter")

    ausgabe = {
        "_hinweis": (
            "Bereinigte Wortliste (>= 2 Zeichen, reine Thai-Wortschreibweisen "
            "ohne Mehrwort-Phrasen) aus https://github.com/nv23/thai-wordlist "
            "(MIT-Lizenz, Copyright (c) 2015 Pakkapon Phongtawee). Enthaelt "
            "KEINE Ausspracheinformationen, dient ausschliesslich der "
            "Wortgrenzen-Erkennung vor der zeichenbasierten Umschrift. Siehe "
            "data/THAI_WORTLISTE_LIZENZ.md."
        ),
        "woerter": woerter,
    }

    with open(ZIEL, "w", encoding="utf-8") as f:
        json.dump(ausgabe, f, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
