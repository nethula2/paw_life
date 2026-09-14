# ==============================================================================
# PawLife Pet Care Management System - Module 06: Business Intelligence
# Assigned Member: Sanvidu S.D.N (IT25100618) - Product Owner / BI Lead
# Script: bi_analytics.R
# Purpose: Statistical revenue analysis, service distribution, and growth trends
# Language: R (Uses base R statistical & graphics engines)
# ==============================================================================

args <- commandArgs(trailingOnly = TRUE)
input_csv <- ifelse(length(args) >= 1, args[1], "analytics/bi_input.csv")
output_chart <- ifelse(length(args) >= 2, args[2], "public/img/bi_revenue_analytics.png")

cat("[R-BI-ENGINE] Initializing PawLife Business Intelligence Analysis in R...\n")

# Ensure output directory exists
out_dir <- dirname(output_chart)
if (!dir.exists(out_dir)) {
    dir.create(out_dir, recursive = TRUE)
}

# Read transaction and service data
if (file.exists(input_csv)) {
    df <- read.csv(input_csv, stringsAsFactors = FALSE)
} else {
    # Default sample data if CSV not yet generated
    df <- data.frame(
        ServiceType = c("Veterinary Care", "Grooming", "Vaccination", "Boarding", "Pharmacy/Supplies"),
        TotalRevenue = c(42500, 31800, 24600, 18500, 29000),
        AppointmentCount = c(28, 19, 22, 11, 35),
        AvgRating = c(4.8, 4.9, 4.7, 4.6, 4.9)
    )
}

# 1. Statistical Calculations
total_rev <- sum(df$TotalRevenue)
mean_rev_per_service <- mean(df$TotalRevenue)
top_service <- df$ServiceType[which.max(df$TotalRevenue)]
total_appointments <- sum(df$AppointmentCount)
avg_transaction_val <- round(total_rev / total_appointments, 2)

# Simple linear projection for next period (+12% expansion estimate based on capacity)
projected_growth_rate <- 0.125
projected_revenue <- round(total_rev * (1 + projected_growth_rate), 2)

# 2. Generate Combined Analytics Visualization Chart
png(filename = output_chart, width = 1200, height = 600, res = 120)
par(mfrow = c(1, 2), mar = c(5, 5, 4, 2), bg = "#ffffff")

# Chart 1: Revenue by Service Department (Barplot)
colors <- c("#0d9488", "#0284c7", "#6366f1", "#f59e0b", "#10b981")
bp <- barplot(
    df$TotalRevenue / 1000,
    names.arg = substr(df$ServiceType, 1, 10),
    col = colors,
    main = "PawLife: Departmental Revenue (k LKR)",
    ylab = "Revenue in Thousands (LKR)",
    xlab = "Service Category",
    ylim = c(0, max(df$TotalRevenue / 1000) * 1.25),
    cex.names = 0.8,
    las = 1
)
grid(nx = NA, ny = NULL, col = "#e2e8f0", lty = "dotted")
text(
    x = bp,
    y = (df$TotalRevenue / 1000) + (max(df$TotalRevenue / 1000) * 0.05),
    labels = paste0(round(df$TotalRevenue / 1000, 1), "k"),
    font = 2,
    cex = 0.8
)

# Chart 2: Service Distribution Share (Pie Chart with 3D feel / Donut styling)
share_pct <- round(100 * df$TotalRevenue / total_rev, 1)
lbls <- paste0(df$ServiceType, "\n", share_pct, "%")
pie(
    df$TotalRevenue,
    labels = lbls,
    col = colors,
    main = "Market Share by Service Line",
    radius = 0.9,
    cex = 0.75
)

dev.off()
cat(paste0("[R-BI-ENGINE] Analytics chart successfully generated at: ", output_chart, "\n"))

# 3. Output JSON-formatted statistical summary
cat("---R_METRICS_START---\n")
metrics_json <- sprintf(
    '{"total_revenue": %f, "total_appointments": %d, "avg_transaction": %f, "top_service": "%s", "projected_growth_rate": %f, "projected_revenue": %f}',
    total_rev,
    total_appointments,
    avg_transaction_val,
    top_service,
    projected_growth_rate,
    projected_revenue
)
cat(metrics_json)
cat("\n---R_METRICS_END---\n")
