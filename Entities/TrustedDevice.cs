namespace BaseRMS.Entities;

public class TrustedDevice
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }
    public string DeviceFingerprint { get; set; } = string.Empty;
    public string? DeviceName { get; set; }
    public DateTime TrustedDate { get; set; }
    public DateTime LastUsedDate { get; set; }
}
