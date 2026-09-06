/**
 * inspirationssaetze.js
 * Eine kleine Sammlung deutscher Beispielsätze für den "Beispielsatz"-Button
 * unter dem Eingabefeld (siehe app.js). Dient rein der Inspiration/zum
 * schnellen Ausprobieren des Generators - hat nichts mit den
 * fremdsprachigen Vorschausätzen in beispielsaetze.js zu tun.
 */

export const INSPIRATIONSSAETZE = [
	'Wir haben immer mehr Angst, als uns lieb ist, aber wir können immer mutiger sein, als wir erwarten.',
	'Da draußen liegt eine weite Welt für alle, die bereit sind, sich in die Dunkelheit zu wagen.',
	'Du kannst darüber jammern, dass die Dinge ungerecht sind, oder du kannst dich aufrichten und dafür sorgen, dass sie gerecht werden.',
	'Mut findet man an den unerwartetsten Orten.',
	'Es gibt eine Regel, die über allen anderen steht, wenn man ein Mensch sein will: Was auch immer kommt, man muss sich dem aufrecht stellen.',
	'Es gibt kein Unglück, das so schwarz oder tief wäre, dass Mut und klarer Blick nicht eine andere Wahrheit dahinter entdecken könnten.',
	'Der wichtigste Schritt, den ein Mensch machen kann. Es ist nicht der erste, oder? Es ist der nächste. Immer der nächste Schritt.',
	'Ich muss kein Held sein. Mir würde es schon reichen, wenn ich das Gefühl hätte, dass das, was ich jeden Tag tue, für jemanden außer mir selbst von Bedeutung ist.',
	'Du kannst nicht ändern, wer du bist, sondern nur, was du tust.',
	'Ehrgeiz ist kein Schimpfwort. Scheiß auf Kompromisse. Geh aufs Ganze.',
	'Es gibt keine Freiheit, die der Freiheit gleicht, ständig unterschätzt zu werden.',
	'Ich werde die Verantwortung für meine Taten übernehmen. Wenn ich schon scheitern muss, werde ich jedes Mal als besserer Mensch wieder aufstehen.',
	'Knochen heilen. Reue bleibt für immer.',
	'Hoffnung kann eine Quelle der Kraft sein, aber wenn sie mir nicht das bringt, was ich mir wünsche, habe ich festgestellt, dass ein gutes Maß an Hartnäckigkeit ein geeigneter Ersatz ist.',
	'Ein gewöhnlicher Bogenschütze übt so lange, bis er es richtig hinbekommt. Ein Waldläufer übt so lange, bis er es nie mehr falsch macht.',
	'Wenn man eine Pause macht, holt einen die Welt ein. Eine Lektion fürs Leben: Bleib in Bewegung.',
	'Du lebst. Das bedeutet, dass du unendliches Potenzial hast. Du kannst alles tun, alles erschaffen, alles träumen.',
	'Wenn das Training hart ist, ist der Kampf leicht.',
	'Mögen wir im Scheitern Würde finden. Mögen wir im Verlust Weisheit finden. Mögen wir im Schmerz Wachstum finden. Mögen unsere Seelen sich erheben. Immer weiter erheben.',
	'Es gibt keine falschen Abzweigungen. Nur Wege, von denen wir nicht wussten, dass wir sie gehen sollten.',
];

/**
 * Liefert einen zufälligen Satz aus INSPIRATIONSSAETZE. Vermeidet dabei,
 * per Zufall zweimal hintereinander denselben Satz zu liefern, sofern
 * ein vorheriger Satz übergeben wird und die Liste mehr als einen Eintrag hat.
 * @param {string} [vorheriger]
 * @returns {string}
 */
export function zufaelligerInspirationssatz(vorheriger) {
	if (INSPIRATIONSSAETZE.length <= 1) {
		return INSPIRATIONSSAETZE[0] || '';
	}

	let satz;

	do {
		satz = INSPIRATIONSSAETZE[Math.floor(Math.random() * INSPIRATIONSSAETZE.length)];
	} while (satz === vorheriger);

	return satz;
}
