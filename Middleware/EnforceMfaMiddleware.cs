using BaseRMS.Entities;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace BaseRMS.Middleware;

/// <summary>
/// Middleware to enforce MFA requirement on protected endpoints.
/// Users without MFA enabled are restricted from accessing most endpoints.
/// Allowed endpoints without MFA: login, register, password reset, mfa setup/verify
/// </summary>
public class EnforceMfaMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<EnforceMfaMiddleware> _logger;

    // Paths that don't require MFA verification
    private static readonly HashSet<string> ExemptPaths = new()
    {
        "/api/v1/login",
        "/api/v1/forgotpassword",
        "/api/v1/resetpassword",
        "/api/v1/confirmEmail",
        "/api/v1/resendconfirmationemail",
        "/api/v1/mfa",
        "/api/v1/mfa/setup",
        "/api/v1/mfa/verify",
        "/api/v1/refreshToken",
    };

    // Paths that only scoped tokens (temporary MFA tokens) can access
    private static readonly HashSet<string> ScopedTokenOnlyPaths = new()
    {
        "/api/v1/mfa/setup",
        "/api/v1/mfa/verify",
    };

    public EnforceMfaMiddleware(RequestDelegate next, ILogger<EnforceMfaMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager)
    {
        var user = context.User;

        // Only enforce MFA for authenticated users
        if (user.Identity?.IsAuthenticated ?? false)
        {
            var requestPath = context.Request.Path.Value?.ToLower() ?? string.Empty;

            // Check if the current token is a scoped/temporary token (for MFA only)
            var scopeClaim = user.FindFirst("scope")?.Value;
            var hasScopedToken = !string.IsNullOrEmpty(scopeClaim);

            // If user has a scoped token, they can ONLY access scoped token only paths
            if (hasScopedToken && !IsScopedTokenOnlyPath(requestPath))
            {
                _logger.LogWarning($"Scoped token attempted to access non-MFA endpoint: {requestPath}");
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new 
                { 
                    error = "This temporary token can only be used for MFA operations",
                    requiresMfa = true 
                });
                return;
            }

            // Skip exempt paths
            if (!IsExemptPath(requestPath))
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!string.IsNullOrEmpty(userId))
                {
                    var appUser = await userManager.FindByIdAsync(userId);
                    if (appUser != null)
                    {
                        var isMfaEnabled = await userManager.GetTwoFactorEnabledAsync(appUser);

                        // If user doesn't have MFA enabled, deny access
                        if (!isMfaEnabled)
                        {
                            _logger.LogWarning($"User {userId} attempted to access {requestPath} without MFA enabled");
                            context.Response.StatusCode = StatusCodes.Status403Forbidden;
                            await context.Response.WriteAsJsonAsync(new 
                            { 
                                error = "MFA is required to access this endpoint",
                                requiresMfa = true 
                            });
                            return;
                        }
                    }
                }
            }
        }

        await _next(context);
    }

    private static bool IsExemptPath(string path)
    {
        // Check exact matches
        if (ExemptPaths.Contains(path))
            return true;

        // Check if path starts with exempt paths (to allow query strings, etc.)
        foreach (var exemptPath in ExemptPaths)
        {
            if (path.StartsWith(exemptPath, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static bool IsScopedTokenOnlyPath(string path)
    {
        // Check exact matches
        if (ScopedTokenOnlyPaths.Contains(path))
            return true;

        // Check if path starts with scoped token only paths (to allow query strings, etc.)
        foreach (var scopedPath in ScopedTokenOnlyPaths)
        {
            if (path.StartsWith(scopedPath, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}