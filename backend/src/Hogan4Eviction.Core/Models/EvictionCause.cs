namespace Hogan4Eviction.Core.Models;

public class EvictionCause
{
    public int Id { get; set; }
    public int IntakeCaseId { get; set; }

    public bool NoticeServed { get; set; }
    public string? NoticeForm { get; set; }

    /// <summary>Amount owed at time notice was served (excluding late fees & utilities).</summary>
    public decimal? AmountOwedAtNotice { get; set; }
    public string? BalanceCalculationExplanation { get; set; }

    public bool IsSubjectToRentEvictionControl { get; set; }
    public bool? HasCompliedWithRentEvictionControlLaws { get; set; }

    /// <summary>
    /// If true, notice is VOID — client must re-serve before we can proceed.
    /// </summary>
    public bool RentAcceptedAfterNoticeExpired { get; set; }

    // ── Rental assistance (UD-101 / UD-120 questions) ─────────────────────
    public bool ReceivedRentalAssistanceForNoticeAmount { get; set; }
    public bool ReceivedRentalAssistanceAfterNoticeDate { get; set; }
    public bool PendingApplicationForNoticeAmount { get; set; }
    public bool PendingApplicationAfterNoticeDate { get; set; }

    // ── Non-military declaration (CIV-100 Q8) ────────────────────────────
    public bool NonMilitaryConfirmed { get; set; }

    public IntakeCase IntakeCase { get; set; } = null!;
}
