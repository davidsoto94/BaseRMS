namespace BaseRMS.DTOs;

public class LoginResponse
{
    public string? AccessToken { get; set; }
    public string? TempToken { get; set; }
    public bool? RequireSetupMfa { get; set; }
    public bool? MfaRequired { get; set; }
}
