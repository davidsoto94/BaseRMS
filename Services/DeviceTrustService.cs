using BaseRMS.Entities;
using BaseRMS.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace BaseRMS.Services;

public class DeviceTrustService
{
    private readonly HttpContext _httpContext;
    private readonly AuthRepository _authRepository;

    public DeviceTrustService(IHttpContextAccessor httpContextAccessor, AuthRepository authRepository)
    {
        _httpContext = httpContextAccessor.HttpContext ?? throw new InvalidOperationException("HttpContext is required");
        _authRepository = authRepository;
    }

    /// <summary>
    /// Generates a unique device fingerprint based on User-Agent and IP address
    /// </summary>
    public string GenerateDeviceFingerprint()
    {
        var userAgent = _httpContext.Request.Headers["User-Agent"].ToString();
        var ipAddress = _httpContext.Connection.RemoteIpAddress?.ToString();

        var fingerprint = $"{userAgent}:{ipAddress}";
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(fingerprint));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    /// <summary>
    /// Extracts device name from User-Agent
    /// </summary>
    public string? ExtractDeviceName()
    {
        var userAgent = _httpContext.Request.Headers["User-Agent"].ToString();
        
        if (string.IsNullOrEmpty(userAgent))
            return null;

        // Extract basic device/browser info from User-Agent
        if (userAgent.Contains("Windows"))
            return userAgent.Contains("Chrome") ? "Windows - Chrome" : 
                   userAgent.Contains("Firefox") ? "Windows - Firefox" : "Windows";
        if (userAgent.Contains("Macintosh"))
            return "Mac";
        if (userAgent.Contains("iPhone"))
            return "iPhone";
        if (userAgent.Contains("Android"))
            return "Android";
        if (userAgent.Contains("Linux"))
            return "Linux";

        return "Unknown Device";
    }

    /// <summary>
    /// Checks if device is trusted for the user
    /// </summary>
    public async Task<bool> IsDeviceTrusted(ApplicationUser user, string deviceFingerprint)
    {
        user.TrustedDevices = await _authRepository.GetTrustedDevices().Where(w => w.UserId == user.Id).ToListAsync();
        return user.TrustedDevices.Any(d => d.DeviceFingerprint == deviceFingerprint);
    }

    /// <summary>
    /// Adds a device to the user's trusted devices
    /// </summary>
    public TrustedDevice AddTrustedDevice(ApplicationUser user, string deviceFingerprint, string? deviceName)
    {
        var existingDevice = user.TrustedDevices.FirstOrDefault(d => d.DeviceFingerprint == deviceFingerprint);
        
        if (existingDevice != null)
        {
            existingDevice.LastUsedDate = DateTime.UtcNow;
            return existingDevice;
        }

        var newDevice = new TrustedDevice
        {
            UserId = user.Id,
            DeviceFingerprint = deviceFingerprint,
            DeviceName = deviceName,
            TrustedDate = DateTime.UtcNow,
            LastUsedDate = DateTime.UtcNow
        };

        user.TrustedDevices.Add(newDevice);
        return newDevice;
    }

    /// <summary>
    /// Removes a trusted device
    /// </summary>
    public bool RemoveTrustedDevice(ApplicationUser user, int deviceId)
    {
        var device = user.TrustedDevices.FirstOrDefault(d => d.Id == deviceId);
        if (device != null)
        {
            user.TrustedDevices.Remove(device);
            return true;
        }
        return false;
    }
}
