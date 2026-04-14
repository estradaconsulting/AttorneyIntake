using Hogan4Eviction.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Hogan4Eviction.Infrastructure.Services;

/// <summary>
/// Stores files on the local filesystem.
/// Used in development; swap for AzureBlobStorageService in production.
/// </summary>
public class LocalDocumentStorageService : IDocumentStorageService
{
    private readonly string _basePath;

    public LocalDocumentStorageService(IConfiguration config)
    {
        _basePath = config["Storage:LocalPath"] ?? Path.Combine(Path.GetTempPath(), "hogan-uploads");
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string caseReferenceNumber,
        CancellationToken ct = default)
    {
        var safeRef = caseReferenceNumber.Replace('/', '-');
        var dir = Path.Combine(_basePath, safeRef);
        Directory.CreateDirectory(dir);

        var uniqueName = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
        var filePath = Path.Combine(dir, uniqueName);

        await using var fs = File.Create(filePath);
        await fileStream.CopyToAsync(fs, ct);

        return Path.Combine(safeRef, uniqueName);  // Relative storage key
    }

    public Task<string> GetDownloadUrlAsync(string storageKey, CancellationToken ct = default)
    {
        // In dev, return an API route that serves the file
        return Task.FromResult($"/api/documents/download/{Uri.EscapeDataString(storageKey)}");
    }

    public Task DeleteAsync(string storageKey, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, storageKey);
        if (File.Exists(fullPath)) File.Delete(fullPath);
        return Task.CompletedTask;
    }
}
