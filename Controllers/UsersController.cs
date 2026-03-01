using BaseRMS.Entities;
using BaseRMS.Localization;
using BaseRMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace BaseRMS.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
public class UsersController (AccountService accountService,
    UserManager<ApplicationUser> userManager,
    IStringLocalizer<IdentityErrorMessages> localizer) : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly IStringLocalizer<IdentityErrorMessages> _localizer = localizer;

    /// <summary>
    /// Get a list of all users
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Get()
    {
        var user = await _userManager.GetUserAsync(User);
        var isAuthorizedToViewUsers = await accountService.IsAuthorizedToViewUsers(user);
        if (!isAuthorizedToViewUsers)
        {
            return Unauthorized(_localizer["UnauthorizedAccess"].Value);
        }
        var users = await _userManager.Users.Select(s => new
            {
                s.Id,
                s.Name,
                s.LastName,
                s.Email,
                s.EmailConfirmed
            }).ToListAsync();
        return Ok(users);
    }
}
