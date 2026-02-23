using BaseCRM.Configurations;
using BaseCRM.DTOs;
using BaseCRM.Entities;
using BaseCRM.Enums;
using BaseCRM.Extensions;
using BaseCRM.Localization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.Security.Claims;
using System.Web;

namespace BaseCRM.Services;

public class AccountService (
    UserManager<ApplicationUser> userManager,
    RoleManager<ApplicationRole> roleManager,
    SignInManager<ApplicationUser> signInManager,
    IEmailSender emailSender,
    EmailTemplateService emailTemplateService,
    DeviceTrustService deviceTrustService,
    IdentityErrorLocalizerService identityErrorLocalizer,
    JWTTokenService jwtTokenService,
    IHttpContextAccessor httpContextAccessor,
    IStringLocalizer<EmailTemplates> emailLocalizer,
    IStringLocalizer<IdentityErrorMessages> identityLocalizer)
{

    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly RoleManager<ApplicationRole> _roleManager = roleManager;
    private readonly SignInManager<ApplicationUser> _signInManager = signInManager;
    private readonly EmailTemplateService _emailTemplateService = emailTemplateService;
    private readonly DeviceTrustService _deviceTrustService = deviceTrustService;
    private readonly IdentityErrorLocalizerService _identityErrorLocalizer = identityErrorLocalizer;
    private readonly IStringLocalizer<EmailTemplates> _emailLocalizer = emailLocalizer;
    private readonly IStringLocalizer<IdentityErrorMessages> _identityLocalizer = identityLocalizer;
    private readonly HttpContext _httpContext = httpContextAccessor.HttpContext ?? throw new InvalidOperationException("HttpContext is required");


    public async Task<ApplicationUser> GetApplicationUser(ClaimsPrincipal claims)
    {

        var userId = claims.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            throw new UnauthorizedAccessException();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new KeyNotFoundException();
        }
        return user;
    }

    public async Task<LoginResponse> LoginUser(LoginDTO loginDTO)
    {
        var user = await _userManager.FindByEmailAsync(loginDTO.Email);
        if (user == null)
        {
            throw new ArgumentException(_identityLocalizer["InvalidCredentials"].Value );
        }
        var result = await _signInManager.CheckPasswordSignInAsync(
            user, loginDTO.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            throw new ArgumentException(_identityLocalizer["InvalidCredentials"].Value);
        }
        var isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
        var deviceFingerprint = _deviceTrustService.GenerateDeviceFingerprint();
        var isDeviceTrusted = await _deviceTrustService.IsDeviceTrusted(user, deviceFingerprint);

        // RequireSetupMfa: true = user must SET UP MFA (doesn't have it yet)
        // MfaRequired: true = user has MFA enabled AND device is not trusted
        var mfaRequired = isTwoFactorEnabled && !isDeviceTrusted;

        string? accessToken = null;
        string? tempToken = null;

        if (mfaRequired || !isTwoFactorEnabled)
        {
            // Generate scoped token for MFA verification only
            tempToken = await jwtTokenService.GenerateJwtToken(user, scope: "mfa_verification");
        }
        else
        {
            // Generate full access token
            accessToken = await GetAccessTokenWithRefreshToken(user);
        }

        var response = new LoginResponse
        {
            AccessToken = accessToken,
            TempToken = tempToken,
            RequireSetupMfa = !isTwoFactorEnabled,
            MfaRequired = mfaRequired
        };
        return response;
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var errors = new List<ValidationError>();

        if (string.IsNullOrWhiteSpace(request.Email))
            errors.Add(new ValidationError { Field = "email", Message = _identityLocalizer["EmailRequired"].Value });

        if (string.IsNullOrWhiteSpace(request.ResetCode))
            errors.Add(new ValidationError { Field = "token", Message = _identityLocalizer["TokenRequired"].Value });

        if (string.IsNullOrWhiteSpace(request.NewPassword))
            errors.Add(new ValidationError { Field = "newPassword", Message = _identityLocalizer["PasswordRequired"].Value });

        if (errors.Any())
            throw new ValidationException(errors);

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return;
        }

        var result = await _userManager.ResetPasswordAsync(user, request.ResetCode, request.NewPassword);
        if (!result.Succeeded)
        {
            var localizedErrors = result.Errors.Select(s => new ValidationError
            {
                Field = s.Code,
                Message = _identityErrorLocalizer.LocalizeError(s)
            });
            throw new ValidationException(localizedErrors);
        }
        await _userManager.UpdateSecurityStampAsync(user);
        
    }

    public async Task ForgotPassword(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
        {
            return;
        }

        // Generate a password reset token
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var urlEncodedToken = HttpUtility.UrlEncode(token);
        var resetPasswordUrl = $"{Environment.GetEnvironmentVariable(Constants.ClientUrl)}/reset-password?email={email}&token={urlEncodedToken}";

        // Get localized email body
        var emailBody = await _emailTemplateService.GetResetPasswordEmailHtmlAsync(resetPasswordUrl, DateTime.Now.Year);
        var emailSubject = _emailLocalizer["EmailSubjectResetPassword"].Value;

        // Send the email with localized content
        await emailSender.SendEmailAsync(email, emailSubject, emailBody);
    }

    public async Task RegisterNewUser(RegisterDTO newUserData, ClaimsPrincipal claims)
    {
        var user = await  GetApplicationUser(claims);
        var isAuthorizedToAdd = await IsAuthorizedToAddNewUser(user);
        if (!isAuthorizedToAdd)
        {
            throw new UnauthorizedAccessException(_identityLocalizer["UnauthorizedAccess"].Value);
        }
        var newUser = await _userManager.FindByEmailAsync(newUserData.Email);

        if(newUser != null)
        {
            throw new ValidationException(new List<ValidationError>
            {
                new ValidationError
                {
                    Field = "email",
                    Message = string.Format(
                        _identityLocalizer["DuplicateEmail"].Value,
                        newUserData.Email)
                }
            });
        }

        newUser = new ApplicationUser
        {
            UserName = newUserData.Email,
            Name = newUserData.Name,
            LastName = newUserData.LastName,
            Email = newUserData.Email,
        };        

        var result = await _userManager.CreateAsync(user);
        if (!result.Succeeded)
        {
            throw new ValidationException(result.Errors.Select(s => new ValidationError
            {
                Field = s.Code,
                Message = _identityErrorLocalizer.LocalizeError(s)
            }));
        }

        newUserData.roles = await RolesToBeAdded(newUserData.roles, user);
        var currentRoles = _roleManager.Roles.Where(w => newUserData.roles.Contains(w.Name!)).Select(s => s.Name!).ToList();
        foreach (var role in currentRoles)
        {
            await _userManager.AddToRoleAsync(user, role);
        }

        await SendConfirmationEmail(user);
    }

    public async Task<(bool Success, string? AccessToken, string? RefreshToken, string? Error)> RefreshToken(string refreshToken, string ipAddress)
    {
        var user = await _userManager.Users
            .Include(u => u.RefreshTokens)
            .SingleOrDefaultAsync(u => u.RefreshTokens
                .Any(t => t.Token == refreshToken));

        if (user == null)
            return (false, null, null, "Invalid token");

        var token = user.RefreshTokens.SingleOrDefault(t => t.Token == refreshToken);

        if (token == null)
            return (false, null, null, "Invalid token");

        // If token is revoked, reject the request
        if (token.Revoked != null)
            return (false, null, null, "Token has been revoked");

        // If token is expired, replace it with a new one
        if (token.IsExpired)
        {
            var newRefreshToken = jwtTokenService.GenerateRefreshToken(ipAddress);
            token.ReplacedByToken = newRefreshToken.Token;
            token.Revoked = DateTime.Now;
            await _userManager.UpdateAsync(user);

            var newAccessToken = await jwtTokenService.GenerateJwtToken(user);
            return (true, newAccessToken, newRefreshToken.Token, null);
        }

        // Token is valid, generate new tokens
        var newAccessTokenValid = await jwtTokenService.GenerateJwtToken(user);

        return (true, newAccessTokenValid, null, null);
    }

    private async Task<List<string>> RolesToBeAdded(List<string> rolesAttempted, ApplicationUser requestUser)
    {
        var userRoles = (await _userManager.GetRolesAsync(requestUser)).ToList();
        return rolesAttempted.Where(w => userRoles.Contains(w)).ToList();
    }

    public async Task ConfirmEmail(string userId, string token)
    {
        if (userId == null || token == null) throw new ArgumentException(_identityLocalizer["DefaultError"].Value);

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) throw new ArgumentException(_identityLocalizer["DefaultError"].Value);

        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (!result.Succeeded)
        {
            throw new ArgumentException(_identityLocalizer["DefaultError"].Value);
        }
    }

    public async Task<bool> IsAuthorizedToAddNewUser(ApplicationUser? requestUser)
    {
        if (requestUser is null)
        {
            return false;
        }

        var permitions = await UserPermitions(requestUser);
        if (permitions.Contains(PermissionEnum.AddUser))
        {
            return true;
        }
        return false;
    }
    public async Task<bool> IsAuthorizedToViewUsers(ApplicationUser? requestUser)
    {
        if (requestUser is null)
        {
            return false;
        }

        var permitions = await UserPermitions(requestUser);
        if (permitions.Contains(PermissionEnum.ViewUser))
        {
            return true;
        }
        return false;
    }

    private async Task<List<PermissionEnum>> UserPermitions(ApplicationUser requestUser)
    {
        var userRoles = (await _userManager.GetRolesAsync(requestUser)).ToList();
        return (await _roleManager.Roles
            .Where(w => w.Name != null && userRoles.Contains(w.Name))
            .Select(s => s.Permitions)
            .ToListAsync())
            .SelectMany(s => s)
            .ToList();
    }

    public async Task SendConfirmationEmail(ApplicationUser user)
    {
        string code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var urlEncodedCode = HttpUtility.UrlEncode(code);
        var confirmationUrl = $"{Environment.GetEnvironmentVariable(Constants.ClientUrl)}/confirm-email?userId={user.Id}&token={urlEncodedCode}";

        // Get localized email body
        var emailBody = await _emailTemplateService.GetConfirmationEmailHtmlAsync(user.Name ?? "User", confirmationUrl, DateTime.Now.Year);
        var emailSubject = _emailLocalizer["EmailSubjectConfirmEmail"].Value;

        // Send the confirmation email
        await emailSender.SendEmailAsync(user.Email!, emailSubject, emailBody);
    }

    public async Task<string?> GetAccessTokenWithRefreshToken(ApplicationUser user)
    {
        if (!_httpContext.Request.Cookies.TryGetValue("refreshToken", out var refreshToken) || string.IsNullOrEmpty(refreshToken))
        {
            var ipAddress = _httpContext.Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
            var newToken = jwtTokenService.GenerateRefreshToken(ipAddress);
            _httpContext.Response.Cookies.Append("refreshToken", newToken.Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });
            user.RefreshTokens.Add(newToken);
            await _userManager.UpdateAsync(user);
        }
        var accessToken = await jwtTokenService.GenerateJwtToken(user);
        return accessToken;

    }

    public async Task RevokeRefreshToken(string refreshToken, string ipAddress)
    {
        var user = await _userManager.Users
            .Include(u => u.RefreshTokens)
            .SingleOrDefaultAsync(u => u.RefreshTokens
                .Any(t => t.Token == refreshToken));

        if (user == null)
            throw new ArgumentException(_identityLocalizer["InvalidToken"].Value);

        var token = user.RefreshTokens.SingleOrDefault(t => t.Token == refreshToken);

        if (token == null)
            throw new ArgumentException(_identityLocalizer["InvalidToken"].Value);

        // If token is already revoked, return success
        if (token.Revoked != null)
            return;

        // Revoke the token
        token.Revoked = DateTime.UtcNow;
        token.RevokedByIp = ipAddress;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var localizedErrors = _identityErrorLocalizer.LocalizeErrors(result.Errors ?? []);
            throw new ArgumentException(string.Join(", ", localizedErrors ?? []));
        }
    }
}
