using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Hogan4Eviction.API.Security;

/// <summary>
/// Development-only authentication handler.
/// Automatically authenticates every request with a "DevUser" identity so that
/// [Authorize] attributes are satisfied without a real token.
///
/// NEVER register this handler in Production.  It is only wired up when
/// ASPNETCORE_ENVIRONMENT=Development AND Security:DevAuthEnabled=true (the default
/// in appsettings.Development.json).
/// </summary>
public class DevBypassAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "DevBypass";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Name,               "dev-user"),
            new Claim(ClaimTypes.NameIdentifier,     "dev-user-id"),
            new Claim(ClaimTypes.Role,               "Staff"),
            new Claim(ClaimTypes.Role,               "Admin"),
            new Claim("auth_scheme",                 SchemeName),
        };

        var identity  = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket    = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
