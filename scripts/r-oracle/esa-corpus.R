#!/usr/bin/env Rscript
# =============================================================================
# ESA-Korpus: Wie stuft R Remainder als "easy" oder "difficult" ein?
# -----------------------------------------------------------------------------
# Zweck. Die intermediaere Loesung der Engine weicht in zwei Szenarien vom
# R-Paket `QCA` ab (Issue #1). Die Konstruktion ist geklaert -- erneute
# Minimierung ueber (positive Minterme u einfache Counterfactuals) --, die
# Klassifikationsregel nicht. Frueher wurden Regelkandidaten einzeln geraten;
# dieses Skript fragt stattdessen R selbst und schreibt einen Korpus, gegen den
# sich Kandidaten pruefen lassen.
#
# Erzeugt werden crisp-Datensaetze ueber 3 und 4 Bedingungen: fuer jede
# Teilmenge positiver Ecken (bis zu einer Groessenschranke) und jede Kombination
# von Richtungserwartungen wird minimize() gerufen und festgehalten:
#
#   - die positiven Ecken und die Erwartungen (die Eingabe),
#   - konservative, sparsame und intermediaere Loesung,
#   - R's eigene Listen $EC (easy) und $DC (difficult) aus $i.sol[[k]].
#
# Genau diese beiden Listen sind der Massstab: Eine Regel ist richtig, wenn sie
# EC/DC ueber den ganzen Korpus reproduziert -- nicht, wenn sie zufaellig die
# Formel eines Szenarios trifft.
#
# Aufruf (aus dem Repository-Wurzelverzeichnis):
#   Rscript scripts/r-oracle/esa-corpus.R [maxPositives]
#
# Ausgabe: scripts/r-oracle/esa-corpus.json
# =============================================================================

suppressMessages(library(QCA))

args <- commandArgs(trailingOnly = TRUE)
MAX_POS <- if (length(args) >= 1) as.integer(args[1]) else 4L

jnum <- function(x) if (is.null(x) || length(x) == 0 || is.na(x)) "null" else sprintf("%.6f", x)
jstr <- function(x) paste0("\"", gsub("\"", "\\\\\"", as.character(x)), "\"")
jarr <- function(xs) if (length(xs) == 0) "[]" else paste0("[", paste(xs, collapse = ","), "]")
jstrarr <- function(xs) jarr(vapply(xs, jstr, character(1)))

# Alle Ecken eines k-dimensionalen Wuerfels als Matrix (Zeile = Ecke).
corners <- function(k) {
  as.matrix(expand.grid(rep(list(c(0L, 1L)), k))[, k:1, drop = FALSE])
}

# Ein Datensatz aus beobachteten Ecken. Entscheidend: Ecken, die WEDER in `pos`
# noch in `neg` stehen, kommen im Datensatz gar nicht vor -- sie sind Remainder.
# Ohne Remainder gibt es keine Counterfactuals, und genau die sind die Frage.
build_data <- function(k, pos_idx, neg_idx, cond_names) {
  cs <- corners(k)
  keep <- c(pos_idx, neg_idx)
  df <- as.data.frame(cs[keep, , drop = FALSE])
  names(df) <- cond_names
  df$OUT <- as.integer(seq_along(keep) <= length(pos_idx))
  rownames(df) <- paste0("case", seq_len(nrow(df)))
  df
}

# Ecke als Zeichenkette "0101" -- so laesst sie sich in JSON eindeutig vergleichen.
corner_label <- function(row) paste(row, collapse = "")

# R gibt EC/DC als data.frame der Bedingungen zurueck; daraus dieselbe Notation.
rows_to_labels <- function(x) {
  if (is.null(x) || !is.data.frame(x) || nrow(x) == 0) return(character(0))
  apply(x, 1, function(r) paste(as.integer(r), collapse = ""))
}

records <- character(0)
skipped <- 0L
runs <- 0L

# Nur k = 3, dafuer vollstaendig: jede Aufteilung der acht Ecken in positive,
# negative und Remainder (bis zu den Schranken unten), jede Erwartungskombination.
# Vollstaendigkeit ist hier mehr wert als Breite -- eine Regel, die ueber alle
# Konstellationen mit drei Bedingungen haelt, ist eine Regel; eine, die auf
# einzelnen Vier-Bedingungen-Faellen passt, kann Zufall sein.
K <- 3L
MAX_NEG <- 2L
cond_names <- LETTERS[1:K]
cs <- corners(K)
n_corners <- nrow(cs)

for (m in 1:min(MAX_POS, n_corners - 1L)) {
  pos_combos <- combn(n_corners, m)
  for (pi in seq_len(ncol(pos_combos))) {
    pos_idx <- pos_combos[, pi]
    rest <- setdiff(seq_len(n_corners), pos_idx)
    for (nn in 0:min(MAX_NEG, length(rest) - 1L)) {
      neg_sets <- if (nn == 0) list(integer(0)) else
        split(combn(rest, nn), col(combn(rest, nn)))
      for (neg_idx in neg_sets) {
        neg_idx <- as.integer(neg_idx)
        df <- build_data(K, pos_idx, neg_idx, cond_names)
        exps <- expand.grid(rep(list(c(0L, 1L)), K))
        for (ei in seq_len(nrow(exps))) {
          dir_exp <- as.integer(exps[ei, ])
          runs <- runs + 1L
          res <- tryCatch(
            minimize(df, outcome = "OUT", conditions = cond_names,
                     incl.cut = 1, n.cut = 1, include = "?",
                     dir.exp = dir_exp, use.tilde = TRUE, details = FALSE),
            error = function(e) NULL
          )
          if (is.null(res) || is.null(res$i.sol) || length(res$i.sol) == 0) {
            skipped <- skipped + 1L
            next
          }
          cons <- tryCatch(
            minimize(df, outcome = "OUT", conditions = cond_names,
                     incl.cut = 1, n.cut = 1, use.tilde = TRUE, details = FALSE),
            error = function(e) NULL
          )
          cons_sol <- if (is.null(cons)) character(0) else unlist(cons$solution)
          pars_sol <- unlist(res$solution)

          for (nm in names(res$i.sol)) {
            isol <- res$i.sol[[nm]]
            rec <- paste0(
              "{",
              "\"k\":", K, ",",
              "\"positives\":", jstrarr(apply(cs[pos_idx, , drop = FALSE], 1, corner_label)), ",",
              "\"negatives\":", jstrarr(if (length(neg_idx) == 0) character(0) else apply(cs[neg_idx, , drop = FALSE], 1, corner_label)), ",",
              "\"expectations\":", jarr(dir_exp), ",",
              "\"model\":", jstr(nm), ",",
              "\"conservative\":", jstrarr(cons_sol), ",",
              "\"parsimonious\":", jstrarr(pars_sol), ",",
              # Entscheidend: das konservative und das sparsame Modell, zu dem
              # GENAU DIESES intermediaere Modell gehoert. res$solution mischt
              # bei Mehrdeutigkeit alle Modelle -- damit ist die Kandidatenmenge
              # der Remainder nicht mehr bestimmbar.
              "\"cSol\":", jstrarr(unlist(isol$c.sol)), ",",
              "\"pSol\":", jstrarr(unlist(isol$p.sol)), ",",
              # $solution ist eine LISTE von Modellen. unlist() wuerde mehrere
              # Modelle zu einer flachen Termliste verschmelzen -- dieselbe Falle
              # wie bei der sparsamen Loesung. Deshalb je Modell ein Array.
              "\"intermediate\":", jarr(lapply(isol$solution, function(m) jstrarr(m))), ",",
              "\"EC\":", jstrarr(rows_to_labels(isol$EC)), ",",
              "\"DC\":", jstrarr(rows_to_labels(isol$DC)),
              "}"
            )
            records <- c(records, rec)
          }
        }
      }
    }
  }
}

out <- paste0(
  "{\n",
  "  \"generatedBy\": \"scripts/r-oracle/esa-corpus.R\",\n",
  "  \"qcaPackageVersion\": ", jstr(as.character(packageVersion("QCA"))), ",\n",
  "  \"rVersion\": ", jstr(paste(R.version$major, R.version$minor, sep = ".")), ",\n",
  "  \"maxPositives\": ", MAX_POS, ",\n",
  "  \"runs\": ", runs, ",\n",
  "  \"skipped\": ", skipped, ",\n",
  "  \"records\": [\n    ", paste(records, collapse = ",\n    "), "\n  ]\n",
  "}\n"
)

writeLines(out, "scripts/r-oracle/esa-corpus.json")
cat("esa-corpus.json:", length(records), "Datensaetze,", skipped, "uebersprungen\n")
