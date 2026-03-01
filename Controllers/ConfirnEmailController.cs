using BaseRMS.DTOs;
using BaseRMS.Localization;
using BaseRMS.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace BaseRMS.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
public class ConfirmEmailController (AccountService accountService, IStringLocalizer<IdentityErrorMessages> localizer): ControllerBase
{
    private readonly IStringLocalizer<IdentityErrorMessages> _localizer = localizer;

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] ConfirmEmailDto confirmEmailDto)
    {
        await accountService.ConfirmEmail(confirmEmailDto.UserId, confirmEmailDto.Token);
        return Ok(_localizer["EmailConfirmed"].Value);
    }
}
