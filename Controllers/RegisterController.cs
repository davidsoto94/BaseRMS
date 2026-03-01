using BaseRMS.DTOs;
using BaseRMS.Localization;
using BaseRMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace BaseRMS.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
public class RegisterController(
    AccountService accountService,
    IStringLocalizer<IdentityErrorMessages> localizer) : ControllerBase
{
    
    private readonly IStringLocalizer<IdentityErrorMessages> _localizer = localizer;

    
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Post(RegisterDTO model)
    {
        
        await accountService.RegisterNewUser(model, User);
        return Ok(_localizer["SuccessfulRegistration"].Value);
    }
}