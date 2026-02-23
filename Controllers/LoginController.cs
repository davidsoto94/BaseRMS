using BaseCRM.DTOs;
using BaseCRM.Entities;
using BaseCRM.Localization;
using BaseCRM.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace BaseCRM.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
public class LoginController (AccountService accountService): ControllerBase
{

    [HttpPost]
    public async Task<IActionResult> Post(LoginDTO loginDTO)
    {
        var response = await accountService.LoginUser(loginDTO);
        return Ok(response);
    }
}
