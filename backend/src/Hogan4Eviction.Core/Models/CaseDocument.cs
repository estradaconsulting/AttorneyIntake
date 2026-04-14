namespace Hogan4Eviction.Core.Models;

public enum DocumentType
{
    RentalAgreement = 1,
    RentIncreaseNotice = 2,
    NoticeToTenant = 3,
    ProofOfService = 4,
    TrusteesDeed = 5,
    Other = 99
}

public class CaseDocument
{
    public int Id { get; set; }
    public int IntakeCaseId { get; set; }

    public DocumentType DocumentType { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;   // Azure Blob name or local path
    public string? ContentType { get; set; }
    public long FileSizeBytes { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    public IntakeCase IntakeCase { get; set; } = null!;
}
