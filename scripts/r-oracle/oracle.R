#!/usr/bin/env Rscript
# =============================================================================
# R-Orakel fuer die Kreuzvalidierung des openQCA-Rechenkerns
# -----------------------------------------------------------------------------
# Dieses Skript berechnet mit dem kanonischen R-Paket `QCA` (Dusa) fuer eine
# Reihe definierter Szenarien die konservative, die sparsame und mehrere
# intermediaere Loesungen und schreibt die Ergebnisse als JSON nach
# scripts/r-oracle/expected.json.
#
# Voraussetzung (einmalig, NICHT vom Skript erzwungen):
#   Rscript -e 'install.packages(c("QCA"), repos="https://cloud.r-project.org")'
#
# Aufruf (aus dem Repository-Wurzelverzeichnis):
#   Rscript scripts/r-oracle/oracle.R
#
# Das JSON wird bewusst OHNE jsonlite-Abhaengigkeit geschrieben (nur paste/
# sprintf), damit das Orakel auch ohne Zusatzpaket laeuft.
#
# Notation: Bedingungen in Grossschreibung, Abwesenheit mit vorangestelltem "~"
# (use.tilde = TRUE), Konjunktion mit "*". Das ist exakt die Notation der
# openQCA-Engine, sodass die Kreuzvalidierung 1:1 vergleichen kann.
# =============================================================================

suppressMessages(library(QCA))

# --- Datensaetze -------------------------------------------------------------
fuzzy <- read.csv("datasets/fuzzy-sets-beispiel.csv", row.names = 1)
crisp <- read.csv("datasets/crisp-sets-beispiel.csv", row.names = 1)

FUZZY_CONDS <- "WOHLSTAND,BILDUNG,STAATSKAPAZITAET"
FUZZY_OUT <- "DEMOKRATIE"
CRISP_CONDS <- "FOERDERUNG,TEAM,MARKT,KONKURRENZ"
CRISP_OUT <- "ERFOLG"

# --- Hilfsfunktionen ---------------------------------------------------------

# Zahl fuer JSON: NA/NaN/NULL -> "null", sonst 6 Nachkommastellen.
jnum <- function(x) {
  if (is.null(x) || length(x) == 0 || is.na(x)) return("null")
  sprintf("%.6f", x)
}

# String fuer JSON (unsere Terme enthalten nur [A-Za-z0-9_*~], daher unkritisch).
jstr <- function(x) paste0("\"", x, "\"")

# Kanonische Form eines Terms: Literale alphabetisch sortiert (zum Deduplizieren
# von Modellen, unabhaengig von der Literal-/Termreihenfolge).
canon_term <- function(term) {
  lits <- strsplit(term, "\\*")[[1]]
  paste(sort(trimws(lits)), collapse = "*")
}
canon_model <- function(pis) paste(sort(vapply(pis, canon_term, "")), collapse = " + ")

# Liefert fuer ein Modell (Vektor von PI-Strings) die Kennzahlen via pof():
# overall inclS/covS und je Pfad incl/cov/covU.
model_params <- function(pis, data, outcome) {
  expr <- paste(pis, collapse = " + ")
  pf <- pof(expr, outcome = outcome, data = data, relation = "sufficiency")
  ic <- pf$incl.cov
  rn <- rownames(ic)
  exprRow <- which(rn == "expression")
  pathRows <- setdiff(seq_len(nrow(ic)), exprRow)
  paths <- lapply(pathRows, function(i) {
    covU <- if ("covU" %in% colnames(ic)) ic[i, "covU"] else NA
    list(term = rn[i], incl = ic[i, "inclS"], cov = ic[i, "covS"], covU = covU)
  })
  list(
    inclS = ic[exprRow, "inclS"],
    covS = ic[exprRow, "covS"],
    paths = paths
  )
}

# Extrahiert aus einem minimize()-Ergebnis die Liste distinkter Modelle
# (jedes Modell = Vektor von PI-Strings). Behandelt konservativ/sparsam
# ($solution) und intermediaer ($i.sol[[k]]$solution).
extract_models <- function(sol) {
  models <- list()
  if (!is.null(sol$i.sol)) {
    for (k in seq_along(sol$i.sol)) {
      for (m in sol$i.sol[[k]]$solution) models[[length(models) + 1]] <- m
    }
  } else {
    for (m in sol$solution) models[[length(models) + 1]] <- m
  }
  # Deduplizieren identischer Modelle (kanonisch).
  seen <- character(0)
  out <- list()
  for (m in models) {
    key <- canon_model(m)
    if (!(key %in% seen)) {
      seen <- c(seen, key)
      out[[length(out) + 1]] <- m
    }
  }
  out
}

# Serialisiert ein Szenario zu JSON.
scenario_json <- function(name, models, data, outcome) {
  modelJsons <- vapply(models, function(pis) {
    p <- model_params(pis, data, outcome)
    pathJsons <- vapply(p$paths, function(pt) {
      paste0(
        "{",
        "\"term\":", jstr(pt$term), ",",
        "\"incl\":", jnum(pt$incl), ",",
        "\"cov\":", jnum(pt$cov), ",",
        "\"covU\":", jnum(pt$covU),
        "}"
      )
    }, "")
    paste0(
      "{",
      "\"expression\":", jstr(paste(pis, collapse = " + ")), ",",
      "\"inclS\":", jnum(p$inclS), ",",
      "\"covS\":", jnum(p$covS), ",",
      "\"paths\":[", paste(pathJsons, collapse = ","), "]",
      "}"
    )
  }, "")
  paste0(
    "{",
    "\"name\":", jstr(name), ",",
    "\"models\":[", paste(modelJsons, collapse = ","), "]",
    "}"
  )
}

# --- Szenario-Definitionen ---------------------------------------------------
# Jede Definition liefert (name, minimize-Ergebnis, data, outcome).
scenarios <- list()
add_scenario <- function(name, sol, data, outcome) {
  scenarios[[length(scenarios) + 1]] <<- list(
    name = name, models = extract_models(sol), data = data, outcome = outcome
  )
}

# ----- Fuzzy-Datensatz, incl.cut = 0.85, n.cut = 1 ---------------------------
ttF <- truthTable(fuzzy, outcome = FUZZY_OUT, conditions = FUZZY_CONDS,
                  incl.cut = 0.85, n.cut = 1)
add_scenario("fuzzy_conservative",
             minimize(ttF, include = "", use.tilde = TRUE), fuzzy, FUZZY_OUT)
add_scenario("fuzzy_parsimonious",
             minimize(ttF, include = "?", use.tilde = TRUE), fuzzy, FUZZY_OUT)
add_scenario("fuzzy_intermediate_all_present",
             minimize(ttF, include = "?", dir.exp = c(1, 1, 1), use.tilde = TRUE), fuzzy, FUZZY_OUT)
add_scenario("fuzzy_intermediate_all_absent",
             minimize(ttF, include = "?", dir.exp = c(0, 0, 0), use.tilde = TRUE), fuzzy, FUZZY_OUT)
add_scenario("fuzzy_intermediate_mixed",
             minimize(ttF, include = "?", dir.exp = c(1, 1, 0), use.tilde = TRUE), fuzzy, FUZZY_OUT)
add_scenario("fuzzy_intermediate_dash",
             minimize(ttF, include = "?", dir.exp = c("-", 1, 1), use.tilde = TRUE), fuzzy, FUZZY_OUT)

# ----- Crisp-Datensatz, incl.cut = 1, n.cut = 1 ------------------------------
ttC <- truthTable(crisp, outcome = CRISP_OUT, conditions = CRISP_CONDS,
                  incl.cut = 1, n.cut = 1)
add_scenario("crisp_conservative",
             minimize(ttC, include = "", use.tilde = TRUE), crisp, CRISP_OUT)
add_scenario("crisp_parsimonious",
             minimize(ttC, include = "?", use.tilde = TRUE), crisp, CRISP_OUT)
add_scenario("crisp_intermediate_all_present",
             minimize(ttC, include = "?", dir.exp = c(1, 1, 1, 1), use.tilde = TRUE), crisp, CRISP_OUT)
add_scenario("crisp_intermediate_all_absent",
             minimize(ttC, include = "?", dir.exp = c(0, 0, 0, 0), use.tilde = TRUE), crisp, CRISP_OUT)
add_scenario("crisp_intermediate_mixed",
             minimize(ttC, include = "?", dir.exp = c(1, 1, 0, 0), use.tilde = TRUE), crisp, CRISP_OUT)
add_scenario("crisp_intermediate_dash",
             minimize(ttC, include = "?", dir.exp = c(1, 1, "-", 0), use.tilde = TRUE), crisp, CRISP_OUT)

# --- JSON schreiben ----------------------------------------------------------
scenarioJsons <- vapply(scenarios, function(s) {
  scenario_json(s$name, s$models, s$data, s$outcome)
}, "")

json <- paste0(
  "{\n",
  "  \"generatedBy\": \"scripts/r-oracle/oracle.R (R-Paket QCA)\",\n",
  "  \"scenarios\": [\n    ",
  paste(scenarioJsons, collapse = ",\n    "),
  "\n  ]\n}\n"
)

outPath <- "scripts/r-oracle/expected.json"
writeLines(json, outPath)
cat("expected.json geschrieben:", outPath, "\n")
cat("Szenarien:", length(scenarios), "\n")
