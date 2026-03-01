using BaseRMS.DTOs;
using BaseRMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace BaseRMS.Controllers;

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
