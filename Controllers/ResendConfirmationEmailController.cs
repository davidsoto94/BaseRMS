using BaseRMS.Entities;
using BaseRMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BaseRMS.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
public class ResendConfirmationEmailController (UserManager<ApplicationUser> userManager,
    AccountService accountService): ControllerBase
{
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Post(string userId)
    {
        //get user by ID and then resend email confirmation email if its not confirmed
        var user = await userManager.FindByIdAsync(userId);
        if (user == null) {
            return NotFound();
        }
        await accountService.SendConfirmationEmail(user);
        return Ok();
    }
}
