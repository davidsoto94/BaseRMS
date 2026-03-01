using BaseRMS.Localization;
using BaseRMS.Services;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace BaseRMS.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
public class ForgotPasswordController (
    AccountService accountService,
    IStringLocalizer<IdentityErrorMessages> localizer
    ) : ControllerBase
{

    private readonly IStringLocalizer<IdentityErrorMessages> _localizer = localizer;

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] ForgotPasswordRequest model)
    {
        await accountService.ForgotPassword(model.Email);
        return Ok(_localizer["SuccessfulForgotPassword"].Value);
    }

}
