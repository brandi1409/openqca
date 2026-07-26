# Release und DOI

Ein Release ohne DOI ist für ein Wissenschaftswerkzeug wenig wert: Ohne
zitierfähigen Bezeichner kann niemand openQCA im Methodenteil einer Arbeit
nennen. Der Ablauf unten stellt beides zugleich her.

## Einmalig: Zenodo mit dem Repository verbinden

**Diese Schritte muss der Eigentümer des Repositorys ausführen — sie brauchen
eine Anmeldung, die außerhalb dieses Projekts liegt.**

1. Auf <https://zenodo.org> mit dem GitHub-Konto anmelden.
2. Unter *GitHub* das Repository `brandi1409/openqca` in der Liste suchen und den
   Schalter auf **On** stellen.
3. Fertig. Zenodo hört ab jetzt auf GitHub-Releases dieses Repositorys.

**Reihenfolge ist wichtig:** Zenodo archiviert nur Releases, die **nach** dem
Einschalten entstehen. Der bereits veröffentlichte Release `v0.1.0` bekommt
rückwirkend keinen DOI — er bleibt ohne, und das ist in Ordnung. Der nächste
Release erhält einen.

Zenodo vergibt zwei DOIs: einen **Concept-DOI**, der immer auf die jeweils
neueste Fassung zeigt, und je Release einen **Versions-DOI**. In `CITATION.cff`
und in der App gehört der Concept-DOI — er bleibt über Versionen hinweg gültig.

## Je Release

1. `CHANGELOG.md`: Abschnitt `[Unveröffentlicht]` auf die neue Versionsnummer und
   das Datum setzen, darüber einen neuen leeren `[Unveröffentlicht]`-Abschnitt.
2. Version in allen vier Dateien angleichen — sie dürfen nicht auseinanderlaufen:
   `package.json`, `apps/web/package.json`, `packages/engine/package.json`,
   `CITATION.cff` (`version` und `date-released`).
3. Vollständige Prüfung, beides muss grün sein:

   ```bash
   npm run verify && npm run test:e2e --workspace web
   ```

4. Tag setzen und veröffentlichen:

   ```bash
   git tag -a v0.2.0 -m "openQCA v0.2.0" && git push origin v0.2.0
   gh release create v0.2.0 --title "openQCA v0.2.0" --notes-file RELEASE-NOTES.md
   ```

5. Nach ein bis zwei Minuten steht der DOI auf der Zenodo-Seite des Repositorys.
   Dann:
   - Concept-DOI in `CITATION.cff` unter `identifiers` eintragen,
   - `NEXT_PUBLIC_ZENODO_DOI` in den Vercel-Projekteinstellungen setzen (nur die
     nackte DOI, z. B. `10.5281/zenodo.1234567`) — die Zitier-Karte in der App
     und der Abschnitt „Zitation" im Bericht führen ihn dann automatisch,
   - DOI in `README.md` als Badge und in `paper/paper.md` ergänzen.

Solange die Variable nicht gesetzt ist, nennt die App ausdrücklich, dass noch
kein DOI existiert, und verweist auf die Repository-Adresse. Ein Platzhalter-DOI
wird bewusst nicht ausgegeben: Er sähe zitierfähig aus und liefe ins Leere.

## npm

`@openqca/engine` ist eigenständig installierbar (gebautes `dist`,
Typdeklarationen, eigenes README). Die Veröffentlichung braucht eine npm-Anmeldung
und muss deshalb ebenfalls vom Eigentümer ausgeführt werden:

```bash
npm login && npm publish --workspace packages/engine --access public
```

Vorher prüfen, dass der Tarball funktioniert — der Test installiert das Paket in
ein leeres Verzeichnis und ruft die Funktionen tatsächlich auf:

```bash
node scripts/check-engine-package.mjs
```
