#!/usr/bin/env Rscript
# Generate scripts/r-oracle/calibrate-expected.json from R package QCA.
# Run from repo root: Rscript scripts/r-oracle/calibrate-oracle.R

suppressPackageStartupMessages(library(QCA))

xs_direct <- c(300, 600, 900, 1000)
e <- 300; c_pt <- 600; i <- 1000

direct_logistic <- as.numeric(calibrate(
  xs_direct,
  type = "fuzzy",
  thresholds = c(e = e, c = c_pt, i = i),
  logistic = TRUE
))

xs_crisp <- c(84.9, 85, 85.1)
crisp <- as.numeric(calibrate(xs_crisp, type = "crisp", thresholds = 85))

fmt_num <- function(v) sprintf("%.16g", v)
arr <- function(v) paste0("[", paste(vapply(v, fmt_num, character(1)), collapse = ", "), "]")

generated_at <- format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC")
qca_ver <- as.character(packageVersion("QCA"))

json <- paste0(
  "{\n",
  '  "generatedAt": "', generated_at, '",\n',
  '  "qcaPackageVersion": "', qca_ver, '",\n',
  '  "directLogistic": {\n',
  '    "x": ', arr(xs_direct), ',\n',
  '    "thresholds": { "e": 300, "c": 600, "i": 1000 },\n',
  '    "membership": ', arr(direct_logistic), '\n',
  "  },\n",
  '  "crisp": {\n',
  '    "x": ', arr(xs_crisp), ',\n',
  '    "threshold": 85,\n',
  '    "membership": ', arr(crisp), '\n',
  "  }\n",
  "}\n"
)

out_path <- file.path("scripts", "r-oracle", "calibrate-expected.json")
writeLines(json, out_path, useBytes = TRUE)
cat("Wrote ", out_path, "\n", sep = "")
cat("directLogistic membership:\n")
print(direct_logistic)
cat("crisp membership:\n")
print(crisp)
