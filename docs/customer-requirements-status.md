# Customer Requirements Status

Stand: 2026-03-24

## Must have

- `Gesamte Seite ist übersetzt`: Teilweise. Viele user-facing Flows sind lokalisiert, aber `Documents`, `Mein Haus`, Share/Owner/Admin-Bereiche enthalten weiterhin harte Strings.
- `Ordner verschieben (mehrere Dokumente auf einmal verschieben können)`: Erfüllt im globalen `Documents`-Bereich.
- `Märkte anzeigen - Auf Home-Seite`: Verfeinert. `Entdecken` ist live und die Home-Seite verlinkt jetzt sichtbar dorthin.
- `Fehlerbehebung`: Erfüllt laut aktuellem Stand.
- `Dokumentenvorschau in Iconansicht`: Erfüllt.
- `Suchfunktion über Dokumententitel`: Teilweise. Globale Suche priorisiert Dokumenttitel jetzt stärker; kein Inline-Filter im Documents-Browser.
- `Mein Haus: Ein Abschnitt ohne Besucherzugriff für private Dateien`: Erfüllt durch neue private Eigentümer-Dateien.
- `Dokumente standardmässig nach Datum sortieren`: Erfüllt für Owner-Dokumente und jetzt auch im globalen `Documents`-Bereich.

## Nice-to-have

- `Dokumente automatisch übersetzen`: Offen.
- `Suchfunktion über Dokumenteninhalt`: Offen.
- `Linkgenerierung für Dokumente und Ordner in Documents`: Teilweise. Deep links für Ordner und Dateien im globalen Documents-Bereich sind jetzt kopierbar.
- `Bei gelöschten Dokumenten - Wer hat es gelöscht?`: Teilweise. Admin-Papierkorb zeigt jetzt den Löschenden, sofern auflösbar.

## Next highest-leverage refinements

- Abschluss der Übersetzungen in `Documents`, `Mein Haus`, Share-Views und Admin-Tools.
- Optionaler Inline-Filter im `Documents`-Browser, falls die globale Suche für Benutzer nicht ausreicht.
- Inhaltsindexierung für PDF/DOCX-Suche als separates Projekt.
- Automatische Dokumentübersetzung nur nach geklärtem Extraktions- und Such-Workflow.
