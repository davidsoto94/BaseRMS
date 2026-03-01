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

    // Paths that only scoped tokens (temporary MFA tokens) can access
    private static readonly HashSet<string> ScopedTokenOnlyPaths = new()
    {
        "/api/v1/mfa/setup",
        "/api/v1/mfa/verify",
        "/api/v1/mfa"
    };

    public EnforceMfaMiddleware(RequestDelegate next)
    {
        _next = next;
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
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new 
                { 
                    error = "This temporary token can only be used for MFA operations",
                    requiresMfa = true 
                });
                return;
            }
        }

        await _next(context);
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