using Hogan4Eviction.Core.DTOs;
using Hogan4Eviction.Core.Enums;
using Hogan4Eviction.Core.Interfaces;

namespace Hogan4Eviction.Core.Services;

public class FeeCalculatorService : IFeeCalculatorService
{
    private const string Disclaimer =
        "Fees are estimates based on the 2025 price list and attachment. Final fees may vary " +
        "depending on the number of tenants, property address specifics, service requirements, " +
        "and case complexity. Fees are required in advance of filing unless otherwise agreed.";

    public FeeCalculationResult Calculate(FeeCalculationRequest req)
    {
        var lines = new List<FeeLineItem>
        {
            new("Consultation Fee (up to 1/2 hour)", 150m, false),
            new("Consultation Fee (1 hour)", 300m, false),
        };

        var noticeFee = 0m;
        if (req.NeedsNoticePreparation)
        {
            noticeFee = GetNoticePreparationFee(req.Location, req.IsCommercial, req.IsForeclosure);
            lines.Add(new FeeLineItem("Preparation and Service of Notice (or Agreement)", noticeFee, false));
        }

        var claim = req.ClaimAmount ?? 0m;
        decimal baseFee;
        string baseFeeDescription;

        if (req.IsCommercial)
        {
            baseFee = req.Location == PropertyLocation.Sacramento ? 1350m : 1500m;
            baseFeeDescription = "Commercial Eviction Filing";

            if (claim >= 10_000m && claim <= 25_000m)
            {
                baseFee += 250m;
                lines.Add(new FeeLineItem("Commercial Claim Amount Add-On ($10k-$25k)", 250m, true));
            }
        }
        else if (claim > 35_000m)
        {
            baseFee = GetLargeClaimFee(req.Location);
            baseFeeDescription = "Uncontested Eviction (claim > $35k)";
        }
        else if (claim >= 10_000m)
        {
            baseFee = GetMidClaimFee(req.Location);
            baseFeeDescription = "Uncontested Eviction (claim $10k-$35k)";
        }
        else
        {
            baseFee = GetSmallClaimFee(req.Location);
            baseFeeDescription = "Uncontested Eviction (claim under $10k)";
        }

        if (baseFee == 0m && !req.IsCommercial && claim > 35_000m)
        {
            lines.Add(new FeeLineItem($"{baseFeeDescription} - Not Available for this location", 0m, false));
        }
        else
        {
            lines.Add(new FeeLineItem(baseFeeDescription, baseFee, true));
        }

        var locationSurcharge = 0m;
        if (IsYoloOrElDoradoAppearanceLocation(req.Location))
        {
            locationSurcharge = 45m;
            lines.Add(new FeeLineItem("Court Appearance Add-On (Yolo / Auburn / El Dorado)", 45m, true));
        }

        var additionalDefendantFee = 0m;
        if (req.NumberOfAdditionalDefendants > 0)
        {
            var perDefendant = GetAdditionalDefendantFee(req.Location);
            additionalDefendantFee = perDefendant * req.NumberOfAdditionalDefendants;
            lines.Add(new FeeLineItem(
                $"New Complaint - Additional Defendants ({req.NumberOfAdditionalDefendants} x ${perDefendant})",
                additionalDefendantFee,
                true));
        }

        var foreclosureFee = 0m;
        if (req.IsForeclosure)
        {
            foreclosureFee = 300m;
            lines.Add(new FeeLineItem("Foreclosure Case Add-On", 300m, true));
        }

        lines.Add(new FeeLineItem("Contested Hearing / Trial", 350m, false));
        lines.Add(new FeeLineItem("Default Money Judgment (includes stipulation defaults)", 350m, false));
        lines.Add(new FeeLineItem("Reposting Writ", 300m, false));
        lines.Add(new FeeLineItem("Witness Subpoena Preparation and Service", 400m, false));
        lines.Add(new FeeLineItem("Hourly Attorney Rate in Contested Actions", 300m, false));

        var total = noticeFee + baseFee + locationSurcharge + additionalDefendantFee + foreclosureFee;

        return new FeeCalculationResult(
            BaseEvictionFee: baseFee,
            NoticePreparationFee: noticeFee,
            LocationSurcharge: locationSurcharge,
            AdditionalDefendantFees: additionalDefendantFee,
            ForeclosureSurcharge: foreclosureFee,
            EstimatedTotal: total,
            Disclaimer: Disclaimer,
            LineItems: lines);
    }

    private static decimal GetNoticePreparationFee(
        PropertyLocation location,
        bool isCommercial,
        bool isForeclosure)
    {
        if (isCommercial || isForeclosure)
        {
            return location == PropertyLocation.Sacramento ? 200m : 300m;
        }

        return location switch
        {
            PropertyLocation.Sacramento => 175m,
            PropertyLocation.ElkGroveRosevileFolsom => 200m,
            PropertyLocation.Loomis => 250m,
            PropertyLocation.YoloDavis => 250m,
            PropertyLocation.AuburnElDoradoGalt => 250m,
            PropertyLocation.Woodland => 250m,
            PropertyLocation.Placer => 250m,
            PropertyLocation.WestSacramento => 250m,
            _ => 175m
        };
    }

    private static decimal GetSmallClaimFee(PropertyLocation location) =>
        location switch
        {
            PropertyLocation.Sacramento => 995m,
            PropertyLocation.ElkGroveRosevileFolsom => 1100m,
            PropertyLocation.Loomis => 1250m,
            PropertyLocation.YoloDavis => 1100m,
            PropertyLocation.AuburnElDoradoGalt => 1350m,
            PropertyLocation.Woodland => 1100m,
            PropertyLocation.Placer => 1250m,
            PropertyLocation.WestSacramento => 1100m,
            _ => 995m
        };

    private static decimal GetMidClaimFee(PropertyLocation location) =>
        location switch
        {
            PropertyLocation.Sacramento => 1350m,
            PropertyLocation.ElkGroveRosevileFolsom => 1900m,
            PropertyLocation.Loomis => 1900m,
            PropertyLocation.YoloDavis => 1900m,
            PropertyLocation.AuburnElDoradoGalt => 1900m,
            PropertyLocation.Woodland => 1900m,
            PropertyLocation.Placer => 1900m,
            PropertyLocation.WestSacramento => 1900m,
            _ => 1350m
        };

    private static decimal GetLargeClaimFee(PropertyLocation location) =>
        location switch
        {
            PropertyLocation.Sacramento => 0m,
            PropertyLocation.Loomis => 2500m,
            PropertyLocation.YoloDavis => 2500m,
            PropertyLocation.AuburnElDoradoGalt => 2500m,
            PropertyLocation.Woodland => 2500m,
            PropertyLocation.Placer => 2500m,
            PropertyLocation.WestSacramento => 2500m,
            _ => 0m
        };

    private static decimal GetAdditionalDefendantFee(PropertyLocation location) =>
        location switch
        {
            PropertyLocation.Sacramento => 35m,
            PropertyLocation.Woodland => 55m,
            _ => 45m
        };

    private static bool IsYoloOrElDoradoAppearanceLocation(PropertyLocation location) =>
        location is PropertyLocation.YoloDavis
            or PropertyLocation.Woodland
            or PropertyLocation.WestSacramento
            or PropertyLocation.AuburnElDoradoGalt;
}
