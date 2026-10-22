package com.smarttea.lk.service.intel;

import java.util.List;

/** Feature keys aligned with Member 03 joblib `feature_names_in_`. */
public final class IntelFeatureSets {

    public static final List<String> TEA_QUALITY =
            List.of(
                    "temperature_c",
                    "humidity_pct",
                    "rainfall_mm",
                    "soil_moisture_pct",
                    "sunshine_hours",
                    "elevation_m");

    public static final List<String> SUSTAINABILITY =
            List.of(
                    "elevation_m",
                    "soil_moisture_pct",
                    "soil_ph",
                    "rainfall_mm",
                    "temperature_mean_c",
                    "humidity_mean_pct",
                    "et0_mm",
                    "production_kg_per_day_monthly_average");

    private IntelFeatureSets() {}
}
