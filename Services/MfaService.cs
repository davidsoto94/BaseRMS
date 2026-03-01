using BaseRMS.DTOs;
using BaseRMS.Entities;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using System.Text;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace BaseRMS.Services;

public class MfaService(UserManager<ApplicationUser> userManager,
    IdentityErrorLocalizerService identityErrorLocalizer)
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly IdentityErrorLocalizerService _identityErrorLocalizer = identityErrorLocalizer;

    public async Task<bool> IsMfaEnable(ApplicationUser user)
    {
        var isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
        return isTwoFactorEnabled;
    }

    public async Task<MfaSetupDto> GenerateMfaSetupAsync(ApplicationUser user)
    {
        // Reset authenticator key if needed
        await _userManager.ResetAuthenticatorKeyAsync(user);
        var unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);

        if (string.IsNullOrEmpty(unformattedKey))
        {
            throw new ArgumentException("Failed to generate authenticator key");
        }

        var formattedKey = FormatKey(unformattedKey);
        var qrCode = GenerateQrCode(user.Email!, unformattedKey);

        return new MfaSetupDto
        {
            QrCode = qrCode,
            ManualKey = formattedKey
        };

    }

    public async Task<(bool enabled, List<string>? recoveryCodes)> VerifyAndEnableMfaAsync(ApplicationUser user, MfaVerifyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            throw new ArgumentException("Code is required");
        }

        var authenticatorCode = request.Code.Replace(" ", "").Replace("-", "");

        if (authenticatorCode.Length != 6 || !authenticatorCode.All(char.IsDigit))
        {
            throw new ArgumentException("Invalid authenticator code format");
        }

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(
            user, _userManager.Options.Tokens.AuthenticatorTokenProvider, authenticatorCode);

        if (!isValid)
        {
            throw new ArgumentException("Invalid authenticator code");
        }

        if (!user.TwoFactorEnabled)
        {
            var result = await _userManager.SetTwoFactorEnabledAsync(user, true);
            if (result.Succeeded)
            {
                return (true, null);
            }
            var errors = result.Errors.Select(e => e.Description);
            throw new ArgumentException(string.Join(", ", errors ?? []));
        }

        var recoveryCodes = await GenerateRecoveryCodesAsync(user);
        return (true, recoveryCodes.ToList());
    }

    public async Task DisableMfaAsync(ApplicationUser user)
    {
        var result = await _userManager.SetTwoFactorEnabledAsync(user, false);
        if (!result.Succeeded)
        {
            var localizedErrors = _identityErrorLocalizer.LocalizeErrors(result.Errors ?? []);
            throw new ArgumentException(string.Join(", ", localizedErrors ?? []));
        }
    }

    public async Task VerifyMfaCodeAsync(ApplicationUser user, MfaVerifyRequest request)
    {

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            throw new ArgumentException("Code is required");
        }

        if (!await _userManager.GetTwoFactorEnabledAsync(user))
        {
            throw new ArgumentException("MFA is not enabled");
        }

        var authenticatorCode = request.Code.Replace(" ", "").Replace("-", "");

        if (authenticatorCode.Length != 6 || !authenticatorCode.All(char.IsDigit))
        {
            throw new ArgumentException("Invalid authenticator code format");
        }

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(
            user, _userManager.Options.Tokens.AuthenticatorTokenProvider, authenticatorCode);
        if (!isValid)
        {
            throw new ArgumentException("Invalid authenticator code");
        }
    }


    public async Task<List<string>> GenerateRecoveryCodesAsync(ApplicationUser user)
    {
        var result = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);
        if (result is null)
        {
            throw new Exception("Failed to generate recovery codes");
        }
        return [.. result];
    }

    private string FormatKey(string unformattedKey)
    {
        var result = new StringBuilder();
        int count = 0;
        foreach (var c in unformattedKey)
        {
            result.Append(c);
            count++;
            if (count % 4 == 0 && count != unformattedKey.Length)
            {
                result.Append(" ");
            }
        }
        return result.ToString();
    }

    private string GenerateQrCode(string email, string key)
    {
        // Return a placeholder QR code URI for now; actual QR code generation can be done client-side
        // This simplifies dependencies while still providing the necessary information
        return $"otpauth://totp/BaseRMS:{email}?secret={key}&issuer=BaseRMS";
    }
}
