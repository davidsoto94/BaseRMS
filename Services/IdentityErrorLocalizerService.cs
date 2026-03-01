using BaseRMS.Localization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;

namespace BaseRMS.Services;

/// <summary>
/// Service for localizing identity errors
/// </summary>
public class IdentityErrorLocalizerService(IStringLocalizer<IdentityErrorMessages> localizer)
{
    private readonly IStringLocalizer<IdentityErrorMessages> _localizer = localizer;

    /// <summary>
    /// Localizes a collection of IdentityError objects
    /// </summary>
    public IEnumerable<string> LocalizeErrors(IEnumerable<IdentityError> errors)
    {
        return errors.Select(error => LocalizeError(error));
    }

    /// <summary>
    /// Localizes a single IdentityError
    /// </summary>
    public string LocalizeError(IdentityError error)
    {
        var localizedMessage = error.Code switch
        {
            "PasswordTooShort" => _localizer["PasswordTooShort", error.Description.ExtractPasswordMinLength()].Value,
            "PasswordRequiresNonAlphanumeric" => _localizer["PasswordRequiresNonAlphanumeric"].Value,
            "PasswordRequiresDigit" => _localizer["PasswordRequiresDigit"].Value,
            "PasswordRequiresLower" => _localizer["PasswordRequiresLower"].Value,
            "PasswordRequiresUpper" => _localizer["PasswordRequiresUpper"].Value,
            "InvalidUserName" => _localizer["InvalidUserName"].Value,
            "InvalidEmail" => _localizer["InvalidEmail"].Value,
            "DuplicateUserName" => _localizer["DuplicateUserName", ExtractValue(error.Description)].Value,
            "DuplicateEmail" => _localizer["DuplicateEmail", ExtractValue(error.Description)].Value,
            "UserAlreadyHasPassword" => _localizer["UserAlreadyHasPassword"].Value,
            "UserAlreadyInRole" => _localizer["UserAlreadyInRole", ExtractValue(error.Description)].Value,
            "UserNotInRole" => _localizer["UserNotInRole", ExtractValue(error.Description)].Value,
            "InvalidRoleName" => _localizer["InvalidRoleName"].Value,
            "DuplicateRoleName" => _localizer["DuplicateRoleName", ExtractValue(error.Description)].Value,
            "ConcurrencyFailure" => _localizer["ConcurrencyFailure"].Value,
            _ => _localizer["DefaultError"].Value
        };

        // Return the value only, without any debug information
        return string.IsNullOrEmpty(localizedMessage) ? error.Description : localizedMessage;
    }

    /// <summary>
    /// Extracts a value from the error description (typically in quotes)
    /// </summary>
    private static string ExtractValue(string description)
    {
        var startIndex = description.IndexOf('\'');
        var lastIndex = description.LastIndexOf('\'');

        if (startIndex != -1 && lastIndex != -1 && startIndex < lastIndex)
        {
            return description.Substring(startIndex + 1, lastIndex - startIndex - 1);
        }

        return description;
    }
}

/// <summary>
/// Extension methods for string utilities
/// </summary>
internal static class StringExtensions
{
    /// <summary>
    /// Extracts the password minimum length from the error description
    /// </summary>
    internal static string ExtractPasswordMinLength(this string description)
    {
        var words = description.Split(' ');
        foreach (var word in words)
        {
            if (int.TryParse(word, out var length))
            {
                return length.ToString();
            }
        }
        return "8";
    }
}
