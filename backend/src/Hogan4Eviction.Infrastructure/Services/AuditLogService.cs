using Hogan4Eviction.Core.Interfaces;
using Hogan4Eviction.Core.Models;
using Hogan4Eviction.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Hogan4Eviction.Infrastructure.Services;

/// <summary>
/// M-05: Writes immutable audit log entries to the database.
/// Uses IDbContextFactory so each write gets its own short-lived DbContext,
/// keeping audit writes independent from the request's main DbContext.
/// Entries are insert-only — the DB app account should NOT have DELETE on AuditLogs.
/// </summary>
public class AuditLogService : IAuditService
{
    private readonly IDbContextFactory<AppDbContext> _dbFactory;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(
        IDbContextFactory<AppDbContext> dbFactory,
        ILogger<AuditLogService> logger)
    {
        _dbFactory = dbFactory;
        _logger    = logger;
    }

    public async Task LogAsync(
        string actor,
        string action,
        string resourceType,
        string resourceId,
        string? detail = null,
        CancellationToken ct = default)
    {
        try
        {
            await using var db = await _dbFactory.CreateDbContextAsync(ct);
            db.AuditLogs.Add(new AuditLog
            {
                Actor        = actor[..Math.Min(actor.Length, 200)],
                Action       = action[..Math.Min(action.Length, 50)],
                ResourceType = resourceType[..Math.Min(resourceType.Length, 100)],
                ResourceId   = resourceId[..Math.Min(resourceId.Length, 200)],
                Detail       = detail is null ? null : detail[..Math.Min(detail.Length, 1000)],
                OccurredAt   = DateTime.UtcNow,
            });
            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            // Audit failure must never break the main request — log locally only
            _logger.LogError(ex,
                "Audit write failed: actor={Actor} action={Action} resource={Type}/{Id}",
                actor, action, resourceType, resourceId);
        }
    }
}
