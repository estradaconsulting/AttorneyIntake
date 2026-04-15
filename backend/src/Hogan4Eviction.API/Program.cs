using System.Threading.RateLimiting;
using Hogan4Eviction.API.Security;
using Hogan4Eviction.Infrastructure;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// M-08: Swagger only when explicitly enabled in config
var swaggerEnabled = builder.Configuration.GetValue<bool>("Security:SwaggerEnabled");
if (swaggerEnabled)
{
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "Hogan4Eviction Intake API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new()
        {
            Name = "Authorization", Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer", In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "Enter your JWT token.",
        });
        c.AddSecurityRequirement(new()
        {
            { new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
        });
    });
}

// C-01: Authentication
// Dev: DevBypassAuthenticationHandler auto-authenticates as Staff (Security:DevAuthEnabled=true in Development)
// Prod: JWT Bearer — configure either AzureAd:* or Jwt:SecretKey in appsettings / Key Vault
var devAuthEnabled = builder.Environment.IsDevelopment()
    && builder.Configuration.GetValue<bool>("Security:DevAuthEnabled");

if (devAuthEnabled)
{
    builder.Services
        .AddAuthentication(DevBypassAuthenticationHandler.SchemeName)
        .AddScheme<AuthenticationSchemeOptions, DevBypassAuthenticationHandler>(
            DevBypassAuthenticationHandler.SchemeName, _ => { });

    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine("[WARNING] DEV AUTH BYPASS ACTIVE — all requests auto-authenticated as Staff. Disable before production.");
    Console.ResetColor();
}
else
{
    var secretKey = builder.Configuration["Jwt:SecretKey"];
    var tenantId  = builder.Configuration["AzureAd:TenantId"];

    if (!string.IsNullOrWhiteSpace(secretKey))
    {
        // Symmetric JWT (non-Azure deployments)
        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opts =>
            {
                opts.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer           = true,
                    ValidateAudience         = true,
                    ValidateLifetime         = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer              = builder.Configuration["Jwt:Issuer"],
                    ValidAudience            = builder.Configuration["Jwt:Audience"],
                    IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                    ClockSkew                = TimeSpan.FromSeconds(30),
                };
            });
    }
    else
    {
        // Azure AD / Entra ID
        var clientId = builder.Configuration["AzureAd:ClientId"];
        var audience = builder.Configuration["AzureAd:Audience"] ?? clientId;
        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opts =>
            {
                opts.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
                opts.Audience  = audience;
                opts.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true, ValidateAudience = true,
                    ValidateLifetime = true, ClockSkew = TimeSpan.FromSeconds(30),
                };
            });
    }
}

builder.Services.AddAuthorization();
builder.Services.AddInfrastructure(builder.Configuration);

// H-05: CORS — restricted methods and headers only
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        var origins = builder.Configuration
            .GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:3000", "http://localhost:5173"];

        policy.WithOrigins(origins)
              .WithHeaders("Content-Type", "Authorization", "X-Requested-With")
              .WithMethods("GET", "POST", "PATCH")
              .AllowCredentials();
    });
});

// H-06: Rate limiting
builder.Services.AddRateLimiter(opts =>
{
    opts.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    opts.AddPolicy("GeneralApi", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 60, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));

    opts.AddPolicy("WritesAndUploads", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(10), QueueLimit = 0 }));
});

var app = builder.Build();

var autoMigrate = builder.Configuration.GetValue<bool>("Database:AutoMigrate");
if (autoMigrate) app.Services.ApplyMigrations();

if (swaggerEnabled)
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Hogan4Eviction API v1"));
}

app.UseCors("FrontendPolicy");
app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
