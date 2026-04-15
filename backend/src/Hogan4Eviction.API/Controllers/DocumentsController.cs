using Hogan4Eviction.Core.Interfaces;
using Hogan4Eviction.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Hogan4Eviction.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IIntakeCaseRepository _caseRepo;
    private readonly IDocumentStorageService _storage;
    private readonly IAuditService _audit;
    private readonly ILogger<DocumentsController> _logger;

    private static readonly string[] AllowedContentTypes =
        ["application/pdf", "image/jpeg", "image/png", "image/tiff"];

    // C-04: Magic byte signatures
    private static readonly Dictionary<string, byte[]> MagicBytes = new()
    {
        { "application/pdf", [0x25, 0x50, 0x44, 0x46] },
        { "image/jpeg",      [0xFF, 0xD8, 0xFF] },
        { "image/png",       [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A] },
    };

    private const long MaxFileSizeBytes = 25 * 1024 * 1024;

    public DocumentsController(
        IIntakeCaseRepository caseRepo,
        IDocumentStorageService storage,
        IAuditService audit,
        ILogger<DocumentsController> logger)
    {
        _caseRepo = caseRepo;
        _storage  = storage;
        _audit    = audit;
        _logger   = logger;
    }

    /// <summary>Upload a document to an existing intake case (client flow — public).</summary>
    [HttpPost("upload/{caseId:int}")]
    [AllowAnonymous]
    [EnableRateLimiting("WritesAndUploads")]
    [RequestSizeLimit(26_214_400)]
    public async Task<ActionResult<CaseDocument>> Upload(
        int caseId,
        IFormFile file,
        [FromForm] DocumentType documentType,
        [FromForm] string? notes,
        CancellationToken ct)
    {
        var intakeCase = await _caseRepo.GetByIdAsync(caseId, ct);
        if (intakeCase is null) return NotFound("Case not found.");

        if (file.Length == 0) return BadRequest("File is empty.");
        if (file.Length > MaxFileSizeBytes) return BadRequest("File exceeds 25 MB limit.");

        if (!AllowedContentTypes.Contains(file.ContentType))
            return BadRequest("Only PDF, JPEG, PNG, and TIFF files are accepted.");

        // C-04: Validate actual file content via magic bytes
        await using var stream = file.OpenReadStream();
        if (!await IsAllowedFileTypeAsync(stream, file.ContentType))
            return BadRequest("File content does not match the declared type.");

        stream.Position = 0;

        var storageKey = await _storage.UploadAsync(
            stream, file.FileName, file.ContentType, intakeCase.ReferenceNumber, ct);

        var doc = new CaseDocument
        {
            IntakeCaseId     = caseId,
            DocumentType     = documentType,
            OriginalFileName = file.FileName,
            StorageKey       = storageKey,
            ContentType      = file.ContentType,
            FileSizeBytes    = file.Length,
            Notes            = notes,
        };

        intakeCase.Documents.Add(doc);
        await _caseRepo.UpdateAsync(intakeCase, ct);

        _logger.LogInformation("Document {FileName} uploaded to case {RefNum}", file.FileName, intakeCase.ReferenceNumber);
        await _audit.LogAsync(User.Identity?.Name ?? "anonymous", "UPLOAD", "CaseDocument", caseId.ToString(), $"Uploaded {file.FileName} ({file.Length} bytes)", ct);

        return CreatedAtAction(nameof(GetDownloadUrl), new { storageKey = Uri.EscapeDataString(doc.StorageKey) }, doc);
    }

    /// <summary>Serve a stored document (staff only).</summary>
    [HttpGet("download/{*storageKey}")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult> GetDownloadUrl(string storageKey, CancellationToken ct)
    {
        // C-02: Validate storage key before using it in any path
        var decodedKey = Uri.UnescapeDataString(storageKey);
        if (!IsValidStorageKey(decodedKey))
        {
            _logger.LogWarning("Blocked suspicious storage key from {IP}: {Key}", HttpContext.Connection.RemoteIpAddress, decodedKey);
            return BadRequest("Invalid storage key.");
        }

        await _audit.LogAsync(User.Identity?.Name ?? "unknown", "DOWNLOAD", "CaseDocument", decodedKey, "Document download", ct);

        var url = await _storage.GetDownloadUrlAsync(decodedKey, ct);

        if (url.StartsWith("/api/documents/download"))
        {
            var uploadsRoot = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "uploads"));
            var fullPath    = Path.GetFullPath(Path.Combine(uploadsRoot, decodedKey));

            // C-02: Confirm resolved path stays inside uploads root
            if (!fullPath.StartsWith(uploadsRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Path traversal blocked — resolved: {Path}", fullPath);
                return Forbid();
            }

            if (!System.IO.File.Exists(fullPath)) return NotFound();
            return PhysicalFile(fullPath, "application/octet-stream", Path.GetFileName(fullPath));
        }

        return Redirect(url);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static bool IsValidStorageKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key) || key.Length > 512) return false;
        if (key.StartsWith('/') || key.StartsWith('\\'))         return false;
        if (key.Contains("..") || key.Contains(':') || key.Contains('\0')) return false;
        return true;
    }

    private static async Task<bool> IsAllowedFileTypeAsync(Stream stream, string contentType)
    {
        const int maxHeaderBytes = 8;
        var header = new byte[maxHeaderBytes];
        var read   = await stream.ReadAsync(header.AsMemory(0, maxHeaderBytes));
        if (read == 0) return false;

        // TIFF: big-endian (MM) or little-endian (II)
        if (contentType == "image/tiff")
            return (header[0] == 0x49 && header[1] == 0x49) ||
                   (header[0] == 0x4D && header[1] == 0x4D);

        if (!MagicBytes.TryGetValue(contentType, out var expected)) return false;
        return header.Take(expected.Length).SequenceEqual(expected);
    }
}
