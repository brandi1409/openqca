#!/usr/bin/env Rscript
# =============================================================================
# Lipset-Referenzdaten lokal bereitstellen (NICHT im Repository mitgeliefert)
# -----------------------------------------------------------------------------
# Der Lipset-Datensatz ist der kanonische QCA-Lehrfall (Ragins eigenes Beispiel,
# 18 europaeische Staaten der Zwischenkriegszeit). Er ist die staerkste
# verfuegbare Korrektheitspruefung: Wenn die Engine ihn trifft, trifft sie den
# Fall, den das Fach am besten kennt.
#
# WARUM NICHT EINGECHECKT: Die Daten liegen als Datensatz `LR`/`LF` im R-Paket
# `QCA` (Adrian Dusa), das unter GPL (>= 3) steht. openQCA steht unter MIT. Eine
# Weitergabe der Paketdaten in diesem Repository waere ein Lizenzkonflikt.
# Deshalb erzeugt dieses Skript die CSV-Dateien LOKAL aus der bereits
# installierten R-Bibliothek; die Dateien sind in .gitignore ausgeschlossen.
#
# Aufruf (aus dem Repository-Wurzelverzeichnis):
#   Rscript scripts/r-oracle/lipset-export.R
#
# Danach stehen die zusaetzlichen Lipset-Szenarien in
#   Rscript scripts/r-oracle/oracle.R   und   node scripts/cross-validate.mjs
# zur Verfuegung. Ohne diesen Schritt werden sie sauber uebersprungen.
#
# Quelle der Daten: Lipset, S. M. (1959): Some Social Requisites of Democracy.
# American Political Science Review 53(1), 69-105 — in der von Ragin fuer QCA
# aufbereiteten Form, wie sie das R-Paket `QCA` als `LR` (Rohwerte) und `LF`
# (kalibrierte Fuzzy-Werte) ausliefert.
# =============================================================================

suppressMessages(library(QCA))

# Die Spalten sind `declared`-Objekte mit Labels; ein naives write.csv schreibt
# die LABELS statt der Zahlen (z. B. "Industrialized" statt 1). Ueber eine
# numerische Matrix wird das vermieden.
as_numeric_df <- function(d) {
  m <- as.matrix(d)
  storage.mode(m) <- "numeric"
  as.data.frame(m)
}

data(LR)
data(LF)

dir.create("datasets/local", showWarnings = FALSE, recursive = TRUE)
write.csv(as_numeric_df(LR), "datasets/local/lipset-roh.csv")
write.csv(as_numeric_df(LF), "datasets/local/lipset-fuzzy.csv")

cat("Geschrieben (lokal, nicht versioniert):\n")
cat("  datasets/local/lipset-roh.csv   (", nrow(LR), "Faelle )\n")
cat("  datasets/local/lipset-fuzzy.csv (", nrow(LF), "Faelle )\n")
cat("QCA-Paketversion:", as.character(packageVersion("QCA")), "\n")
