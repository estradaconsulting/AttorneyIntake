using System.ComponentModel.DataAnnotations;
using Hogan4Eviction.Core.Enums;
using Hogan4Eviction.Core.Models;

namespace Hogan4Eviction.Core.DTOs;

// ── Inbound (client-submitted) DTOs ──────────────────────────────────────────
// M-07: All string fields now carry MaxLength attributes to enforce server-side limits.

public record PropertyOwnerDto(
    [MaxLength(200)] string Name,
    [MaxLength(500)] string? Address,
    [MaxLength(20)]  string? Phone,
    [MaxLength(254)] string? Email,
    List<OwnerType> OwnerTypes,
    [MaxLength(200)] string? TrusteeName
);

public record PropertyManagerDto(
    [MaxLength(200)] string? Name,
    [MaxLength(200)] string? Company,
    [MaxLength(500)] string? Address,
    [MaxLength(20)]  string? Phone,
    [MaxLength(254)] string? Email
);

public record TenantDto(
    [MaxLength(200)] string FullName,
    [MaxLength(100)] string? Race,
    [MaxLength(50)]  string? Height,
    [MaxLength(50)]  string? Weight,
    [MaxLength(50)]  string? HairColor,
    [MaxLength(100)] string? FacialHair,
    [MaxLength(50)]  string? Eyes,
    [MaxLength(100)] string? Hairstyle,
    [MaxLength(300)] string? CarDescription,
    [MaxLength(1000)] string? Comments
);

public record PropertyDto(
    [MaxLength(500)] string Address,
    [MaxLength(50)]  string? GateCode,
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
    [MaxLength(100)]  string? NoticeForm,
    decimal? AmountOwedAtNotice,
    [MaxLength(2000)] string? BalanceCalculationExplanation,
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
    [MaxLength(500)]  string? OtherNoticeSpecification,
    bool IsResidential,
    bool IsCommercial,
    [MaxLength(500)]  string? TenantPropertyAddress,
    decimal? MonthlyRent,
    decimal? CurrentBalanceDue,
    [MaxLength(2000)] string? BalanceCalculationExplanation,
    [MaxLength(200)]  string? MethodOfPayment,
    bool PaymentDueOnFirst,
    [MaxLength(200)]  string? PaymentRecipient,
    [MaxLength(500)]  string? PaymentDeliveryAddress,
    [MaxLength(500)]  string? AlternatePaymentAddress,
    [MaxLength(20)]   string? TenantContactPhone,
    [MaxLength(200)]  string? UsualPaymentDaysHours,
    bool PaymentByMailOnly,
    [MaxLength(2000)] string? OtherCausesForNotice,
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
    NoticeRequestDto? NoticeRequest
);

// ── Response DTOs ─────────────────────────────────────────────────────────────

/// <summary>
/// Lightweight summary — safe to return to any authenticated caller.
/// Does NOT include tenant PII fields.
/// </summary>
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

/// <summary>
/// H-01: Full detail including tenant PII — returned only to authenticated staff
/// via the [Authorize]-protected GET /api/intakecases/{id} endpoint.
/// </summary>
public record IntakeCaseDetailDto(
    int Id,
    string ReferenceNumber,
    CaseStatus Status,
    DateTime CreatedAt,
    DateTime? SubmittedAt,
    PropertyOwner? PropertyOwner,
    PropertyManager? PropertyManager,
    Property? Property,
    EvictionCause? EvictionCause,
    NoticeRequest? NoticeRequest,
    IReadOnlyList<CaseDocument> Documents
);

public record IntakeCaseCreatedDto(
    int Id,
    string ReferenceNumber,
    CaseStatus Status,
    string Message
);
