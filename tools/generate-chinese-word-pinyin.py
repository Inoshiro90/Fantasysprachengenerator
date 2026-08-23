#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate-chinese-word-pinyin.py

Erzeugt aus der CC-CEDICT-Rohdatei (tools/cedict_raw.txt, Quelle:
https://github.com/rhcarvalho/cedict, Spiegel von https://cc-cedict.org/,
CC BY-SA 4.0) eine WORTBASIERTE Pinyin-Tabelle fuer mehrsilbige Woerter -
im Gegensatz zur bisherigen rein zeichenweisen Tabelle (chinesePinyin.js)
kann diese die Polyphon-Problematik fuer die abgedeckten Woerter aufloesen
(z. B. 银行 "yinhang", nicht "yinxing"; 长江 "changjiang", nicht
"zhangjiang" - jeweils die im Wortkontext richtige Lesung statt der
zeichenweisen Standardlesung).

FILTER: Nur Eintraege, bei denen sich die wortbasierte Lesung von der
zeichenweisen Standardlesung UNTERSCHEIDET (Vergleich gegen die bereits
vorhandene Einzelzeichen-Tabelle CHINESISCH_PINYIN_MAP) werden
uebernommen - das haelt die neue Tabelle auf die tatsaechlich
polyphon-relevanten Faelle fokussiert, statt jedes der >100.000
Mehrzeichen-Eintraege (inkl. der weit ueberwiegenden Mehrheit, bei der
die zeichenweise Lesung ohnehin schon korrekt waere) zu duplizieren.

ü-Schreibung: CC-CEDICT nutzt in der Ziffern-Pinyin-Notation "u:" fuer ü
(z. B. "nu:3" fuer nü) - wird hier zu "v" normalisiert (gängige ASCII-
Konvention), Toene (Ziffern 1-5) werden verworfen (das Projekt stellt
grundsaetzlich keine Toene dar, siehe chinesePinyin.js).
"""
import json
import re
from collections import OrderedDict

HAN_REGEX = re.compile(r'^[\u4E00-\u9FFF]+$')


def normalisiere_silbe(silbe):
    """CC-CEDICT-Silbe mit Tonziffer (z. B. 'zhong1', 'nu:3', 'r5') zu
    tonloser ASCII-Silbe."""
    s = silbe.lower()
    s = s.rstrip('12345')
    s = s.replace('u:', 'v')
    return s


def parse_cedict(pfad):
    """Liefert Liste von (traditionell, vereinfacht, [silben]) Tupeln -
    nur Zeilen mit rein chinesischen Schriftzeichen (keine Ziffern/
    lateinischen Buchstaben im Kopfwort, siehe HAN_REGEX)."""
    eintraege = []
    with open(pfad, encoding='utf-8') as f:
        for zeile in f:
            zeile = zeile.strip()
            if not zeile or zeile.startswith('#'):
                continue
            m = re.match(r'^(\S+) (\S+) \[([^\]]+)\] /', zeile)
            if not m:
                continue
            trad, simp, pinyin_roh = m.group(1), m.group(2), m.group(3)
            if not (HAN_REGEX.match(trad) and HAN_REGEX.match(simp)):
                continue
            silben = pinyin_roh.split(' ')
            eintraege.append((trad, simp, silben))
    return eintraege


def main():
    with open('js/chinesePinyin.js', encoding='utf-8') as f:
        js_inhalt = f.read()
    # Einzelzeichen-Standardtabelle als Vergleichsbasis einlesen (simple
    # Regex-Extraktion 'X': 'y', reicht fuer dieses Format).
    standard = dict(re.findall(r"'(.)':\s*'([a-z]+)'", js_inhalt))
    print(f'{len(standard)} Einzelzeichen-Standardlesungen geladen.')

    eintraege = parse_cedict('tools/cedict_raw.txt')
    print(f'{len(eintraege)} CC-CEDICT-Eintraege mit reinem Hanzi-Kopfwort.')

    wortliste_simp = OrderedDict()
    wortliste_trad = OrderedDict()
    uebersprungen_laenge = 0
    uebersprungen_gleich = 0

    for trad, simp, silben in eintraege:
        if len(simp) < 2 or len(trad) < 2:
            uebersprungen_laenge += 1
            continue
        if len(silben) != len(simp) or len(silben) != len(trad):
            uebersprungen_laenge += 1
            continue

        silben_norm = [normalisiere_silbe(s) for s in silben]
        if not all(re.fullmatch(r'[a-z]+', s) for s in silben_norm):
            continue  # z.B. Sonderzeichen/Ziffern in der Pinyin-Angabe

        wort_pinyin = ''.join(silben_norm)

        # Nur uebernehmen, wenn sich die wortbasierte Lesung von der
        # zeichenweisen Standardlesung unterscheidet (Polyphon-Fall) -
        # sowohl fuer die vereinfachte als auch die traditionelle Form
        # getrennt geprueft, da beide Wortlisten getrennt genutzt werden.
        standard_simp = ''.join(standard.get(c, '') for c in simp)
        standard_trad = ''.join(standard.get(c, '') for c in trad)

        aendert_simp = wort_pinyin != standard_simp
        aendert_trad = wort_pinyin != standard_trad

        if not (aendert_simp or aendert_trad):
            uebersprungen_gleich += 1
            continue

        if aendert_simp and simp not in wortliste_simp:
            wortliste_simp[simp] = wort_pinyin
        if aendert_trad and trad not in wortliste_trad:
            wortliste_trad[trad] = wort_pinyin

    print(f'Uebersprungen (Laenge/Silbenzahl-Mismatch): {uebersprungen_laenge}')
    print(f'Uebersprungen (Lesung ohnehin bereits korrekt): {uebersprungen_gleich}')
    print(f'Vereinfacht: {len(wortliste_simp)} polyphon-relevante Woerter')
    print(f'Traditionell: {len(wortliste_trad)} polyphon-relevante Woerter')

    hinweis = (
        'Wortbasierte Pinyin-Tabelle aus CC-CEDICT (https://cc-cedict.org/, '
        'CC BY-SA 4.0, Copyright (C) 1997, 1998 Paul Andrew Denisowski), '
        'bezogen ueber den Spiegel https://github.com/rhcarvalho/cedict. '
        'Enthaelt NUR Woerter, deren wortbasierte Pinyin-Lesung von der '
        'zeichenweisen Standardlesung (chinesePinyin.js) abweicht (Polyphon-'
        'Faelle, z. B. 银行 "yinhang" statt zeichenweise "yinxing"). Siehe '
        'data/CHINESISCH_WORTLISTE_LIZENZ.md.'
    )

    with open('data/chinesischWortPinyinSimp.json', 'w', encoding='utf-8') as f:
        json.dump({'_hinweis': hinweis, 'woerter': wortliste_simp}, f, ensure_ascii=False, separators=(',', ':'))
    with open('data/chinesischWortPinyinTrad.json', 'w', encoding='utf-8') as f:
        json.dump({'_hinweis': hinweis, 'woerter': wortliste_trad}, f, ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    main()
