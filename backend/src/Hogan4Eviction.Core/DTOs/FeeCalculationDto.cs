using Hogan4Eviction.Core.Enums;

namespace Hogan4Eviction.Core.DTOs;

public record FeeCalculationRequest(
    PropertyLocation Location,
    bool IsCommercial,
    decimal? ClaimAmount,                // Amount requested in eviction
    bool NeedsNoticePreparation,
    int NumberOfAdditionalDefendants,
    bool IsForeclosure
);

public record FeeLineItem(
    string Description,
    decimal Amount,
    bool IsRequired
);

public record FeeCalculationResult(
    decimal BaseEvictionFee,
    decimal NoticePreparationFee,
    decimal LocationSurcharge,
    decimal AdditionalDefendantFees,
    decimal ForeclosureSurcharge,
    decimal EstimatedTotal,
    string Disclaimer,
    List<FeeLineItem> LineItems
);
