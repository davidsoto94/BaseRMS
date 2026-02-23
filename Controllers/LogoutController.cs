using BaseCRM.Localization;
using BaseCRM.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace BaseCRM.Controllers;

[Route("api/v1/[controller]")]
[ApiController]

public class LogoutController (AccountService accountService
    , IStringLocalizer<IdentityErrorMessages> localizer) : ControllerBase
{
    private readonly IStringLocalizer<IdentityErrorMessages> _localizer = localizer;

    [HttpPost()]
    public async Task<IActionResult> Post()
    {
        // Get refresh token from httpOnly cookie
        if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken) || string.IsNullOrEmpty(refreshToken))
        {
            return Ok(new { message = "Logout successful" });
        }
        Response.Cookies.Delete("refreshToken");
        var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
        await accountService.RevokeRefreshToken(refreshToken, ipAddress);
        return Ok(new { message = "Logout successful" });
    }
}
