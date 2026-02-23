using BaseCRM.DTOs;
using BaseCRM.Entities;
using BaseCRM.Localization;
using BaseCRM.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace BaseCRM.Controllers;

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