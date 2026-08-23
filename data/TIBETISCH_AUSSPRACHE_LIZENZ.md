# Herkunft und Lizenz: tibetischAussprache.json

## Quelle: WikiPron (Wiktionary)

**Quelle:** [WikiPron](https://github.com/CUNY-CL/wikipron) (CUNY-CL), siehe
`URDU_AUSSPRACHE_LIZENZ.md` für die ausführliche Erklärung der Methodik.
Verwendete Rohdatei: `data/scrape/tsv/bod_tibt_broad.tsv` (ISO-639-3-Code
`bod` für Standard-/Zentraltibetisch, 3.621 Zeilen für 1.564 eindeutige
Wörter). Eine engere Transkription (`bod_tibt_narrow.tsv`) existiert bei
WikiPron nicht. Direkt vom CUNY-CL-GitHub-Repository bezogen.

**Lizenz:** CC BY-SA 4.0 (über Wiktionary, siehe WikiPron-README).

## Besonderheit bei Tibetisch: zwei Aussprachen pro Wort

Anders als bei den bisherigen Sprachen liefert Wiktionary für Tibetisch
pro Wort oft zwei unterschiedliche IPA-Angaben (Vorlage `Template:bo-IPA`):

1. Eine **tatsächlich dokumentierte Lhasa-Aussprache** mit Tonhöhen
   (z. B. `/pa˥˥/` für པ) - beruht auf realer beschriebener Dialekt-
   aussprache.
2. Eine **algorithmisch aus der Schreibung rekonstruierte Aussprache**
   (mit Sternchen `*` markiert, z. B. `/*pa/`) - wird von einem
   Wiktionary-internen Modul automatisch aus der klassischen Schreibung
   abgeleitet und kann daher stumme Präfixbuchstaben fälschlich
   mitsprechen (im Tibetischen sind viele Präfix-/Suffixbuchstaben in der
   modernen Aussprache stumm, was das Rekonstruktions-Modul nicht immer
   berücksichtigt).

**In diesem Projekt verwendet:** Wo eine echte Lhasa-Aussprache vorlag,
wurde ausschließlich diese genutzt (1.281 Wörter). Nur wenn WikiPron für
ein Wort ausschließlich die rekonstruierte (*) Aussprache lieferte, wurde
ersatzweise diese verwendet (283 Wörter) - erkennbar an gelegentlich
unerwarteten Konsonantenclustern, z. B. `rgan` statt der vermutlich
korrekteren Aussprache ohne den stummen Präfixbuchstaben r- bei རྒྱན.

## Wie die lateinische Lesung erzeugt wurde

Jedes der 209 verschiedenen IPA-Symbole (inkl. aller Kombinationen mit
Behauchung, Palatalisierung, Labialisierung, Glottalisierung, Vokal-
nasalierung) wurde auf die im Projekt etablierte Lesekonvention
abgebildet. Wegen der großen phonetischen Komplexität des Tibetischen
(Tonsprache mit vielen Zusatzmerkmalen) wurde dafür - anders als bei
den bisherigen Sprachen - ein zweistufiges Verfahren verwendet: zuerst
Nachschlagen des vollständigen Symbols, sonst Abtrennen bekannter
Zusatzmarkierungen (Tonhöhen, Vokallänge, Glottalisierung, Palatal-/
Labialisierungsmarker, Behauchungs-/Pränasalierungszeichen, stimmlose
Sonoranten) und erneutes Nachschlagen der verbleibenden Kernlautung.
Alle Zusatzmerkmale werden dabei verworfen (keine Kodierung im
Projekt, konsistent mit der übrigen Praxis: keine Vokallänge, keine
Tonhöhen, keine Behauchungs-Unterscheidung).

Retroflexe und alveolo-palatale Affrikaten (t͡ɕ/ʈ͡ʂ, d͡ʑ/ɖ͡ʐ) werden
beide als "ch"/"j" geschrieben, palatale Verschlusslaute c/ɟ ebenfalls
als "ch"/"j" (Näherung, da im Tibetischen phonetisch näher an "ky"/"gy",
aber für Englisch-/Deutsch-Muttersprachler eher wie "ch"/"j" wahrnehmbar).
Vordere gerundete Vokale ø/y (ähnlich Deutsch ö/ü) werden auf "e"/"u"
vereinfacht, da das Projekt keine Umlaute im Ausgabealphabet vorsieht.

## Verwendung im Projekt

`js/tibetischTransliteration.js` schlägt für **Tibetisch (bo-CN)** jedes
Wort in dieser Liste nach (`transliteriereTibetischMitWoerterbuch()`).

**Wylie-Fallback (neu):** Für Text ausserhalb dieser 1.564 Wörter greift
seit Kurzem zusätzlich eine algorithmische, rein SCHRIFTBASIERTE
Umschrift nach dem in der Tibetologie etablierten Wylie-System (Turrell
Wylie, 1959) - siehe Moduldoku in `js/tibetischTransliteration.js` für
Details. Das ist ausdrücklich KEINE Ausspracheumschrift: stumme Präfix-/
Suffixbuchstaben, die in der gesprochenen Sprache verschwinden, bleiben
in der Wylie-Lesung sichtbar (z. B. `rgyal po` statt der tatsächlich
gesprochenen Form "gyalpo"). Das Wylie-System selbst unterliegt keiner
Lizenz (es ist eine wissenschaftliche Konvention, keine urheberrechtlich
geschützte Datenquelle) - die Umsetzung im Projekt basiert direkt auf der
systematischen Unicode-Kodierung der tibetischen Schrift (siehe
Moduldoku), nicht auf einer externen Datei.

**Abdeckung:** 1.564 Wörter mit echter Aussprache - ein nützlicher
Ausschnitt, kein vollständiges Lexikon. Alles andere fällt auf die
Wylie-Schriftumschrift zurück, statt wie zuvor unverändert in
tibetischer Schrift stehen zu bleiben.
