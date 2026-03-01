namespace BaseRMS.DTOs;

public class MfaSetupDto
{
    public string QrCode { get; set; } = string.Empty;
    public string ManualKey { get; set; } = string.Empty;
}
