using BaseRMS.Enums;

namespace BaseRMS.Entities;


public class EventLogger
{
    public int Id { get; set; }
    public string? TriggerUserEmail { get; set; }
    public ICollection<string>? AffectedUsersEmails { get; set; }
    public ICollection<EventTypeEnum> EventTypes { get; set; } = [];
    /// <summary>
    /// The code to be used by the localization to show to the user in a UI. This code should be used to get the localized string from the localization resources.
    /// </summary>
    public string? DescriptionCode { get; set; }
    /// <summary>
    /// To be used if it needs to be checked direclty in the DB or as a fallback if the localization fails. Should not be shown to the user directly, but can be used for debugging or logging purposes.
    /// </summary>
    public string? DescriptionEnglish { get; set; }

}
