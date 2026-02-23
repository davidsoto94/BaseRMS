using BaseCRM.Configurations;
using BaseCRM.DbContexts;
using BaseCRM.Entities;
using BaseCRM.Extensions;
using BaseCRM.Repositories;
using BaseCRM.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(
    options => options.UseNpgsql(Environment.GetEnvironmentVariable(Constants.DatabaseConnectionString))
    .UseSnakeCaseNamingConvention());

builder.Services.AddDataProtection();



builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
    {
        options.SignIn.RequireConfirmedAccount = true;
        options.User.RequireUniqueEmail = true;
        options.Tokens.AuthenticatorTokenProvider = "Authenticator";
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();
builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    }).AddJwtBearer(options =>
    {
        var randomKey = Guid.NewGuid().ToString();
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = Environment.GetEnvironmentVariable(Constants.JwtIssuer),
            ValidAudience = Environment.GetEnvironmentVariable(Constants.JwtAudience),
            ClockSkew = TimeSpan.FromSeconds(0),
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable(Constants.JwtKey) ?? randomKey))
        };
    });

builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = ctx =>
    {
        // Always include useful metadata
        ctx.ProblemDetails.Extensions["traceId"] = ctx.HttpContext.TraceIdentifier;
        ctx.ProblemDetails.Extensions["timestamp"] = DateTime.UtcNow;
        ctx.ProblemDetails.Instance = $"{ctx.HttpContext.Request.Method} {ctx.HttpContext.Request.Path}";
    };
});



builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddSingleton<IEmailSender, EmailService>();
builder.Services.AddScoped<RoleRepository>();
builder.Services.AddScoped<AuthRepository>();
builder.Services.AddScoped<JWTTokenService>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<IdentityErrorLocalizerService>();
builder.Services.AddScoped<EmailTemplateService>();
builder.Services.AddScoped<MfaService>();
builder.Services.AddScoped<DeviceTrustService>();
builder.Services.AddHttpContextAccessor();

// Add localization services
builder.Services.AddLocalization(options => 
{
    options.ResourcesPath = "Resources";
});

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { "en", "es", "fr" };
    options.SetDefaultCulture("en");
    options.AddSupportedCultures(supportedCultures);
    options.AddSupportedUICultures(supportedCultures);
});

builder.Services.AddRequestLocalization(options =>
{
    var supportedCultures = new[] { "en", "es", "fr" };
    options.AddSupportedCultures(supportedCultures)
        .AddSupportedUICultures(supportedCultures)
        .SetDefaultCulture("en");
});

// Configure logging to suppress localization debug messages
builder.Logging.AddFilter("Microsoft.Extensions.Localization.ResourceManagerStringLocalizer", LogLevel.Warning);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(Environment.GetEnvironmentVariable(Constants.ClientUrl) ?? "", Environment.GetEnvironmentVariable(Constants.ApplicationUrl) ?? "")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.MigrateDatabase<ApplicationDbContext>();

await IdentitySeeder.SeedRolesAndAdminAsync(app.Services);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseExceptionHandler();
app.UseStaticFiles();
app.UseRouting();
app.UseRequestLocalization();
app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<BaseCRM.Middleware.EnforceMfaMiddleware>();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
