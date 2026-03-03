namespace BaseRMS.DTOs;

public class RegisterDTO
{
    public required string Name { get; set; }
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public List<string> roles { get; set; } = new List<string>();
}
