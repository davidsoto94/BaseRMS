using BaseRMS.Localization;
using BaseRMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace BaseRMS.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
public class RefreshTokenController(AccountService accountService
    , IStringLocalizer<IdentityErrorMessages> localizer) : ControllerBase
{
    private readonly IStringLocalizer<IdentityErrorMessages> _localizer = localizer;

    [HttpPost()]
    public async Task<IActionResult> Post()
    {
        // Get refresh token from httpOnly cookie
        if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken) || string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new[] { _localizer["InvalidCredentials"].Value });
        }

        var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
        var result = await accountService.RefreshToken(refreshToken, ipAddress);

        if (!result.Success)
            return Unauthorized(new[] { _localizer[result.Error ?? "InvalidCredentials"].Value });

        if (result.RefreshToken != null)
        {
            Response.Cookies.Append("refreshToken", result.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });
        }        

        return Ok(new { accessToken = result.AccessToken });
    }
}
