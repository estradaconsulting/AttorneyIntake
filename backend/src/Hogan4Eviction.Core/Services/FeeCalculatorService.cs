using Hogan4Eviction.Core.DTOs;
using Hogan4Eviction.Core.Enums;
using Hogan4Eviction.Core.Interfaces;

namespace Hogan4Eviction.Core.Services;

/// <summary>
/// Pure business logic fee calculator based on the 2025 Hogan4Eviction price list.
/// No I/O — fully unit-testable.
/// </summary>
public class FeeCalculatorService : IFeeCalculatorService
{
    private const string Disclaimer =
        "Fees are estimates based on the 2025 price list. Final fees may vary depending " +
        "on the number of tenants, property address specifics, and case complexity. " +
        "Fees are required in advance of filing unless otherwise agreed.";

    public FeeCalculationResult Calculate(FeeCalculationRequest req)
    {
        var lines = new List<FeeLineItem>();

        // ── 1. Notice preparation (if needed) ────────────────────────────
        decimal noticeFee = 0m;
        if (req.NeedsNoticePreparation)
        {
            noticeFee = req.Location switch
            {
                PropertyLocation.Sacramento => req.IsCommercial ? 200m : 175m,
                PropertyLocation.ElkGroveRosevileFolsom => req.IsCommercial ? 300m : 200m,
                PropertyLocation.Loomis => 200m,
                PropertyLocation.YoloDavis => req.IsCommercial ? 300m : 250m,
                PropertyLocation.AuburnElDoradoGalt => req.IsCommercial ? 300m : 250m,
                PropertyLocation.Woodland => req.IsCommercial ? 300m : 250m,
                PropertyLocation.Placer => 250m,
                PropertyLocation.WestSacramento => 250m,
                _ => 175m
            };
            lines.Add(new FeeLineItem("Notice Preparation & Service", noticeFee, false));
        }

        // ── 2. Base eviction fee ──────────────────────────────────────────
        decimal baseFee = 0m;
        string baseFeeDesc;

        if (req.IsCommercial)
        {
            baseFee = req.Location == PropertyLocation.Sacramento ? 1350m : 1500m;
            // If claim between $10k-$25k, add $250
            if (req.ClaimAmount.HasValue && req.ClaimAmount >= 10_000m && req.ClaimAmount <= 25_000m)
                baseFee += 250m;
            baseFeeDesc = "Commercial Eviction Filing";
        }
        else
        {
            decimal claim = req.ClaimAmount ?? 0m;

            if (claim > 35_000m)
            {
                baseFee = req.Location switch
                {
                    PropertyLocation.Sacramento => 0m,   // Not available
                    PropertyLocation.YoloDavis or PropertyLocation.WestSacramento =>2500m,
                    PropertyLocation.Placer => 2500m,
                    PropertyLocation.AuburnElDoradoGalt => 2500m,
                    _ => 0m
                };
                baseFeeDesc = "Uncontested Eviction (claim > $35k)";
            }
            else if (claim >= 10_000m)
            {
                baseFee = req.Location switch
                {
                    PropertyLocation.Sacramento => 1350m,
                    PropertyLocation.ElkGroveRosevileFolsom => 1900m,
                    PropertyLocation.Loomis => 1900m,
                    PropertyLocation.YoloDavis or PropertyLocation.WestSacramento => 1900m,
                    PropertyLocation.AuburnElDoradoGalt => 1900m,
                    PropertyLocation.Woodland => 1900m,
                    PropertyLocation.Placer => 1900m,
                    _ => 1350m
                };
                baseFeeDesc = "Uncontested Eviction (claim $10k–$35k)";
            }
            else
            {
                baseFee = req.Location switch
                {
                    PropertyLocation.Sacramento => 995m,
                    PropertyLocation.ElkGroveRosevileFolsom => 1100m,
                    PropertyLocation.Loomis => 1100m,
                    PropertyLocation.YoloDavis or PropertyLocation.WestSacramento => 1100m,
                    PropertyLocation.AuburnElDoradoGalt => 1350m,
                    PropertyLocation.Woodland => 1100m,
                    PropertyLocation.Placer => 1250m,
                    _ => 995m
                };
                baseFeeDesc = "Uncontested Eviction (claim < $10k)";
            }
        }

        if (baseFee == 0m && !req.IsCommercial && (req.ClaimAmount ?? 0) > 35_000m)
            lines.Add(new FeeLineItem($"{baseFeeDesc} — NOT AVAILABLE for this location", 0m, false));
        else
            lines.Add(new FeeLineItem(baseFeeDesc, baseFee, true));

        // ── 3. Location surcharge (Yolo, Auburn, El Dorado) ──────────────
        decimal locationSurcharge = 0m;
        if (req.Location is PropertyLocation.YoloDavis or PropertyLocation.AuburnElDoradoGalt or PropertyLocation.WestSacramento)
        {
            locationSurcharge = 45m;
            lines.Add(new FeeLineItem("Court Appearance Surcharge (Yolo / Auburn / El Dorado)", 45m, true));
        }

        // ── 4. Additional defendants ──────────────────────────────────────
        decimal additionalDefendantFee = 0m;
        if (req.NumberOfAdditionalDefendants > 0)
        {
            decimal perDefendant = req.Location switch
            {
                PropertyLocation.Sacramento => 35m,
                PropertyLocation.Woodland => 55m,
                _ => 45m
            };
            additionalDefendantFee = perDefendant * req.NumberOfAdditionalDefendants;
            lines.Add(new FeeLineItem(
                $"Additional Defendants ({req.NumberOfAdditionalDefendants} × ${perDefendant})",
                additionalDefendantFee, true));
        }

        // ── 5. Foreclosure add-on ─────────────────────────────────────────
        decimal foreclosureFee = 0m;
        if (req.IsForeclosure)
        {
            foreclosureFee = 300m;
            lines.Add(new FeeLineItem("Foreclosure Case Add-On", 300m, true));
        }

        // ── 6. Standard add-ons (informational) ──────────────────────────
        lines.Add(new FeeLineItem("Contested Hearing / Trial (if applicable)", 350m, false));
        lines.Add(new FeeLineItem("Default Money Judgment (if applicable)", 350m, false));
        lines.Add(new FeeLineItem("Reposting Writ (if stayed)", 300m, false));

        decimal total = noticeFee + baseFee + locationSurcharge + additionalDefendantFee + foreclosureFee;

        return new FeeCalculationResult(
            BaseEvictionFee: baseFee,
            NoticePreparationFee: noticeFee,
            LocationSurcharge: locationSurcharge,
            AdditionalDefendantFees: additionalDefendantFee,
            ForeclosureSurcharge: foreclosureFee,
            EstimatedTotal: total,
            Disclaimer: Disclaimer,
            LineItems: lines
        );
    }
}
