using Hogan4Eviction.Core.Enums;

namespace Hogan4Eviction.Core.Models;

/// <summary>
/// Root aggregate for a client eviction intake submission.
/// </summary>
public class IntakeCase
{
    public int Id { get; set; }

    /// <summary>Human-readable reference number, e.g. H2025-0001</summary>
    public string ReferenceNumber { get; set; } = string.Empty;

    public CaseStatus Status { get; set; } = CaseStatus.Draft;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }

    // ── Navigation properties ──────────────────────────────────────────────
    public PropertyOwner? PropertyOwner { get; set; }
    public PropertyManager? PropertyManager { get; set; }
    public Property? Property { get; set; }
    public EvictionCause? EvictionCause { get; set; }
    public NoticeRequest? NoticeRequest { get; set; }
    public ICollection<CaseDocument> Documents { get; set; } = new List<CaseDocument>();

    // ── Staff notes ────────────────────────────────────────────────────────
    public string? StaffNotes { get; set; }
    public string? OurFileNumber { get; set; }     // Assigned by the law office
}
