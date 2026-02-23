using BaseCRM.Localization;
using BaseCRM.Services;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace BaseCRM.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
public class ResetPasswordController (AccountService accountService
    , IStringLocalizer<IdentityErrorMessages> localizer) : ControllerBase
{

    
    private readonly IStringLocalizer<IdentityErrorMessages> _localizer = localizer;

    [HttpPost]
    public async Task<IActionResult> PostAsync([FromBody] ResetPasswordRequest model)
    {
        await accountService.ResetPasswordAsync(model);
        return Ok(_localizer["SuccessfullPasswordReset"]);

    }
}
