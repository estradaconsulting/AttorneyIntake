namespace Hogan4Eviction.Core.Models;

/// <summary>
/// Immutable audit trail entry.  Rows are only ever inserted, never updated or deleted.
/// </summary>
public class AuditLog
{
    public long   Id           { get; init; }
    public string Actor        { get; init; } = string.Empty;
    public string Action       { get; init; } = string.Empty;
    public string ResourceType { get; init; } = string.Empty;
    public string ResourceId   { get; init; } = string.Empty;
    public string? Detail      { get; init; }
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
}
