using Hogan4Eviction.Core.Enums;

namespace Hogan4Eviction.Core.Models;

/// <summary>
/// Corresponds to Page 6 "Serve a Notice Request Form" — only filled if client
/// wants the law office to prepare and serve the notice.
/// </summary>
public class NoticeRequest
{
    public int Id { get; set; }
    public int IntakeCaseId { get; set; }

    public NoticeType NoticeType { get; set; }
    public string? OtherNoticeSpecification { get; set; }

    public bool IsResidential { get; set; } = true;
    public bool IsCommercial { get; set; } = false;

    public string? TenantPropertyAddress { get; set; }   // With city/state/zip + gate code

    public decimal? MonthlyRent { get; set; }
    public decimal? CurrentBalanceDue { get; set; }      // Within 11 months, no late fees
    public string? BalanceCalculationExplanation { get; set; }

    // ── Payment details ───────────────────────────────────────────────────
    public string? MethodOfPayment { get; set; }
    public bool PaymentDueOnFirst { get; set; }
    public string? PaymentRecipient { get; set; }
    public string? PaymentDeliveryAddress { get; set; }
    public string? AlternatePaymentAddress { get; set; }

    public string? TenantContactPhone { get; set; }
    public string? UsualPaymentDaysHours { get; set; }
    public bool PaymentByMailOnly { get; set; }

    public string? OtherCausesForNotice { get; set; }

    // ── Rental agreement info ─────────────────────────────────────────────
    public bool HasWrittenAgreement { get; set; }
    public bool IsVerbalOnly { get; set; }
    public bool NoAgreement { get; set; }
    public bool IsForeclosure { get; set; }

    public IntakeCase IntakeCase { get; set; } = null!;
}
