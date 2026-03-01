using BaseRMS.Localization;
using Microsoft.Extensions.Localization;

namespace BaseRMS.Services;

/// <summary>
/// Service for loading and rendering localized email templates
/// </summary>
public class EmailTemplateService(IStringLocalizer<EmailTemplates> localizer)
{
    private readonly IStringLocalizer<EmailTemplates> _localizer = localizer;

    /// <summary>
    /// Gets the HTML for a confirmation email with localized content
    /// </summary>
    public async Task<string> GetConfirmationEmailHtmlAsync(string userName, string confirmationUrl, int currentYear)
    {
        var greeting = string.Format(_localizer["EmailGreeting"].Value, userName);
        var welcomeMessage = _localizer["EmailConfirmEmailWelcome"].Value;
        var buttonText = _localizer["EmailConfirmButton"].Value;
        var copyLinkText = _localizer["EmailCopyLink"].Value;
        var warningText = _localizer["EmailConfirmEmailWarning"].Value;
        var copyrightText = string.Format(_localizer["EmailFooterCopyright"].Value, currentYear);
        var disclaimerText = _localizer["EmailFooterDisclaimer"].Value;

        var html = @$"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{_localizer["EmailSubjectConfirmEmail"].Value}</title>
</head>
<body style=""margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;"">
    <div style=""max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); overflow: hidden;"">

        <!-- Header -->
        <div style=""background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;"">
            <h1 style=""color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;"">{_localizer["EmailSubjectConfirmEmail"].Value}</h1>
        </div>

        <!-- Content -->
        <div style=""padding: 40px 30px;"">
            <p style=""color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;"">
                {greeting}
            </p>

            <p style=""color: #555555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;"">
                {welcomeMessage}
            </p>

            <!-- CTA Button -->
            <div style=""text-align: center; margin: 30px 0;"">
                <a href=""{confirmationUrl}"" style=""display: inline-block; background-color: #667eea; color: #ffffff; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; transition: background-color 0.3s ease;"">
                    {buttonText}
                </a>
            </div>

            <p style=""color: #999999; font-size: 14px; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;"">
                {copyLinkText}
            </p>

            <div style=""background-color: #f8f8f8; padding: 15px; border-radius: 4px; word-break: break-all; overflow-wrap: break-word;"">
                <p style=""color: #667eea; font-size: 13px; margin: 0; font-family: 'Courier New', monospace;"">
                    {confirmationUrl}
                </p>
            </div>

            <p style=""color: #777777; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;"">
                {warningText}
            </p>
        </div>

        <!-- Footer -->
        <div style=""background-color: #1e1e1e; padding: 20px 30px; text-align: center; border-top: 1px solid #404040;"">
            <p style=""color: #888888; font-size: 13px; margin: 0 0 10px 0;"">
                {copyrightText}
            </p>
            <p style=""color: #bbbbbb; font-size: 12px; margin: 0;"">
                {disclaimerText}
            </p>
        </div>

    </div>
</body>
</html>";

        return html;
    }

    /// <summary>
    /// Gets the HTML for a password reset email with localized content
    /// </summary>
    public async Task<string> GetResetPasswordEmailHtmlAsync(string resetPasswordUrl, int currentYear)
    {
        var greeting = _localizer["EmailGreeting"].Value;
        var resetMessage = _localizer["EmailResetPasswordMessage"].Value;
        var buttonText = _localizer["EmailResetPasswordButton"].Value;
        var copyLinkText = _localizer["EmailCopyLink"].Value;
        var warningText = _localizer["EmailResetPasswordWarning"].Value;
        var copyrightText = string.Format(_localizer["EmailFooterCopyright"].Value, currentYear);
        var disclaimerText = _localizer["EmailFooterDisclaimer"].Value;

        var html = @$"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{_localizer["EmailSubjectResetPassword"].Value}</title>
</head>
<body style=""margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1a1a1a;"">
    <div style=""max-width: 600px; margin: 0 auto; background-color: #2d2d2d; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); overflow: hidden;"">

        <!-- Header -->
        <div style=""background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;"">
            <h1 style=""color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;"">{_localizer["EmailSubjectResetPassword"].Value}</h1>
        </div>

        <!-- Content -->
        <div style=""padding: 40px 30px;"">
            <p style=""color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;"">
                {greeting},
            </p>

            <p style=""color: #b0b0b0; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;"">
                {resetMessage}
            </p>

            <!-- CTA Button -->
            <div style=""text-align: center; margin: 30px 0;"">
                <a href=""{resetPasswordUrl}"" style=""display: inline-block; background-color: #667eea; color: #ffffff; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; transition: background-color 0.3s ease;"">
                    {buttonText}
                </a>
            </div>

            <p style=""color: #888888; font-size: 14px; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;"">
                {copyLinkText}
            </p>

            <div style=""background-color: #1e1e1e; padding: 15px; border-radius: 4px; word-break: break-all; overflow-wrap: break-word; border: 1px solid #404040;"">
                <p style=""color: #9db8ff; font-size: 13px; margin: 0; font-family: 'Courier New', monospace;"">
                    {resetPasswordUrl}
                </p>
            </div>

            <p style=""color: #a0a0a0; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;"">
                {warningText}
            </p>
        </div>

        <!-- Footer -->
        <div style=""background-color: #1e1e1e; padding: 20px 30px; text-align: center; border-top: 1px solid #404040;"">
            <p style=""color: #888888; font-size: 13px; margin: 0 0 10px 0;"">
                {copyrightText}
            </p>
            <p style=""color: #bbbbbb; font-size: 12px; margin: 0;"">
                {disclaimerText}
            </p>
        </div>

    </div>
</body>
</html>";

        return html;
    }
}
