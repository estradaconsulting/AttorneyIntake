using Hogan4Eviction.Core.Enums;

namespace Hogan4Eviction.Core.DTOs;

// ── Submitted from the React wizard ──────────────────────────────────────────

public record PropertyOwnerDto(
    string Name,
    string? Address,
    string? Phone,
    string? Email,
    List<OwnerType> OwnerTypes,
    string? TrusteeName
);

public record PropertyManagerDto(
    string? Name,
    string? Company,
    string? Address,
    string? Phone,
    string? Email
);

public record TenantDto(
    string FullName,
    string? Race,
    string? Height,
    string? Weight,
    string? HairColor,
    string? FacialHair,
    string? Eyes,
    string? Hairstyle,
    string? CarDescription,
    string? Comments
);

public record PropertyDto(
    string Address,
    string? GateCode,
    bool IsResidential,
    bool IsCommercial,
    DateTime? TenantMoveInDate,
    decimal? OriginalMonthlyRent,
    decimal? CurrentRent,
    decimal? RentBefore_2020_06_30,
    decimal? RentBefore_2021_06_30,
    decimal? RentBefore_2022_06_30,
    decimal? RentBefore_2023_06_30,
    decimal? RentBefore_2024_06_30,
    decimal? RentBefore_2025_06_30,
    bool HasWrittenAgreement,
    bool IsVerbalOnly,
    bool NoAgreement,
    bool IsTermLease,
    bool IsMonthToMonth,
    bool HasAB1482Exemption,
    bool HasTenantsBeenAdded,
    DateTime? AddedTenantMoveInDate,
    bool ConstructedWithinLast15Years,
    bool IsSection8OrSubsidy,
    bool IsForeclosure,
    PropertyLocation Location,
    List<TenantDto> Tenants
);

public record EvictionCauseDto(
    bool NoticeServed,
    string? NoticeForm,
    decimal? AmountOwedAtNotice,
    string? BalanceCalculationExplanation,
    bool IsSubjectToRentEvictionControl,
    bool? HasCompliedWithRentEvictionControlLaws,
    bool RentAcceptedAfterNoticeExpired,
    bool ReceivedRentalAssistanceForNoticeAmount,
    bool ReceivedRentalAssistanceAfterNoticeDate,
    bool PendingApplicationForNoticeAmount,
    bool PendingApplicationAfterNoticeDate,
    bool NonMilitaryConfirmed
);

public record NoticeRequestDto(
    NoticeType NoticeType,
    string? OtherNoticeSpecification,
    bool IsResidential,
    bool IsCommercial,
    string? TenantPropertyAddress,
    decimal? MonthlyRent,
    decimal? CurrentBalanceDue,
    string? BalanceCalculationExplanation,
    string? MethodOfPayment,
    bool PaymentDueOnFirst,
    string? PaymentRecipient,
    string? PaymentDeliveryAddress,
    string? AlternatePaymentAddress,
    string? TenantContactPhone,
    string? UsualPaymentDaysHours,
    bool PaymentByMailOnly,
    string? OtherCausesForNotice,
    bool HasWrittenAgreement,
    bool IsVerbalOnly,
    bool NoAgreement,
    bool IsForeclosure
);

public record SubmitIntakeCaseRequest(
    PropertyOwnerDto Owner,
    PropertyManagerDto? Manager,
    PropertyDto Property,
    EvictionCauseDto? EvictionCause,
    NoticeRequestDto? NoticeRequest   // null if they already have a valid notice
);

// ── Response ──────────────────────────────────────────────────────────────────

public record IntakeCaseSummaryDto(
    int Id,
    string ReferenceNumber,
    CaseStatus Status,
    string OwnerName,
    string PropertyAddress,
    DateTime CreatedAt,
    DateTime? SubmittedAt,
    int DocumentCount
);

public record IntakeCaseCreatedDto(
    int Id,
    string ReferenceNumber,
    CaseStatus Status,
    string Message
);
