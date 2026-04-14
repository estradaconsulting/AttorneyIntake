using Hogan4Eviction.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddInfrastructure(builder.Configuration);

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

var app = builder.Build();

var autoMigrateDatabase = builder.Configuration.GetValue<bool>("Database:AutoMigrate");
if (app.Environment.IsDevelopment() && autoMigrateDatabase)
{
    app.Services.ApplyMigrations();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Hogan4Eviction API v1"));
}

app.UseCors("FrontendPolicy");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
