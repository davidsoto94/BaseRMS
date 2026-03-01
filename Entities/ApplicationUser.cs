using Microsoft.AspNetCore.Identity;

namespace BaseRMS.Entities;

public class ApplicationUser : IdentityUser
{
    public string? Name { get; set; }
    public string? LastName { get; set; }
    public List<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public List<TrustedDevice> TrustedDevices { get; set; } = new List<TrustedDevice>();
}
