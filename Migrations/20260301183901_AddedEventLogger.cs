using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BaseRMS.Migrations
{
    /// <inheritdoc />
    public partial class AddedEventLogger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "event_logs",
                schema: "rms",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    trigger_user_email = table.Column<string>(type: "text", nullable: true),
                    affected_users_emails = table.Column<string[]>(type: "text[]", nullable: true),
                    event_types = table.Column<string>(type: "text", nullable: true),
                    description_code = table.Column<string>(type: "text", nullable: true),
                    description_english = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_event_logs", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "event_logs",
                schema: "rms");
        }
    }
}
