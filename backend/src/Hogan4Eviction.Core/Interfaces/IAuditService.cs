namespace Hogan4Eviction.Core.Interfaces;

/// <summary>
/// Records security-relevant events for compliance and breach detection.
/// M-05: Required for legal/PII data access in attorney intake context.
/// </summary>
public interface IAuditService
{
    /// <param name="actor">Authenticated user name or "anonymous"/"client".</param>
    /// <param name="action">Verb: READ, CREATE, UPDATE_STATUS, UPLOAD, DOWNLOAD, SUBMIT, LOCAL_SUBMIT, LIST.</param>
    /// <param name="resourceType">Entity type: IntakeCase, CaseDocument.</param>
    /// <param name="resourceId">Entity ID or reference number.</param>
    /// <param name="detail">Short human-readable description.</param>
    Task LogAsync(
        string actor,
        string action,
        string resourceType,
        string resourceId,
        string? detail = null,
        CancellationToken ct = default);
}
