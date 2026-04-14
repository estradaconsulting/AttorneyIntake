using Hogan4Eviction.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Hogan4Eviction Intake API",
        Version = "v1",
        Description = "Client intake management for the Law Office of Thomas M. Hogan"
    });
});

// ── Infrastructure (DB, storage, repos, fee calculator) ──────────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// ── CORS — allow the React dev server and production domain ──────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        var origins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
            ?? ["http://localhost:3000", "http://localhost:5173"];

        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ── Future: Azure AD auth hook ────────────────────────────────────────────────
// builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//     .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

var app = builder.Build();

// ── Migrate DB on startup (dev only — disable for production) ─────────────────
if (app.Environment.IsDevelopment())
{
    app.Services.ApplyMigrations();
}

// ── Middleware pipeline ────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Hogan4Eviction API v1"));
}

app.UseCors("FrontendPolicy");
app.UseHttpsRedirection();

// app.UseAuthentication();   // Uncomment when Azure AD is configured
app.UseAuthorization();

app.MapControllers();

app.Run();
