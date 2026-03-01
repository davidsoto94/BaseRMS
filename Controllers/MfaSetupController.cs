using BaseRMS.DTOs;
using BaseRMS.Entities;
using BaseRMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BaseRMS.Controllers;

[Route("api/v1/mfa")]
[ApiController]
[Authorize]
public class MfaController (UserManager<ApplicationUser> userManager, 
    MfaService mfaService, 
    DeviceTrustService deviceTrustService,
    AccountService accountService) : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly MfaService _mfaService = mfaService;
    private readonly DeviceTrustService _deviceTrustService = deviceTrustService;
    private readonly AccountService _accountService = accountService;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await _accountService.GetApplicationUser(User);
        return Ok(new { enabled = await _mfaService.IsMfaEnable(user) });
    }

    [HttpPost("setup")]
    public async Task<IActionResult> Setup()
    {
        var user = await _accountService.GetApplicationUser(User);
        return Ok(await _mfaService.GenerateMfaSetupAsync(user));
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] MfaVerifyRequest request)
    {
        var user = await _accountService.GetApplicationUser(User);
        var result = await _mfaService.VerifyAndEnableMfaAsync(user, request);
        return Created(string.Empty, new { result.enabled, result.recoveryCodes });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete()
    {
        var user = await _accountService.GetApplicationUser(User);
        await _mfaService.DisableMfaAsync(user);
        return NoContent();
    }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] MfaVerifyRequest request)
    {
        var user = await _accountService.GetApplicationUser(User);
        await _mfaService.VerifyMfaCodeAsync(user, request);
        var accessToken = await _accountService.GetAccessTokenWithRefreshToken(user);
        return Ok(new { verified = true, accessToken });
    }

    [HttpPost("verify/trust-device")]
    public async Task<IActionResult> VerifyAndTrustDevice([FromBody] MfaVerifyRequest request)
    {

        var user = await _accountService.GetApplicationUser(User);
        await _mfaService.VerifyMfaCodeAsync(user, request);
        // Trust this device after successful MFA verification
        var deviceFingerprint = _deviceTrustService.GenerateDeviceFingerprint();
        var deviceName = _deviceTrustService.ExtractDeviceName();
        _deviceTrustService.AddTrustedDevice(user, deviceFingerprint, deviceName);
        await _userManager.UpdateAsync(user);

        // Generate and return full access token
        var accessToken = await _accountService.GetAccessTokenWithRefreshToken(user);

        return Ok(new { verified = true, deviceTrusted = true, accessToken });
    }
}
