using BaseRMS.Enums;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace BaseRMS.Entities;

public class ApplicationRole : IdentityRole
{
    [Column("permitions", TypeName = "varchar(500)")]
    public ICollection<PermissionEnum> Permitions { get; set; } = [];
}
