using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseRMS.Migrations
{
    /// <inheritdoc />
    public partial class SmallChangeInEventLogger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "event_types",
                schema: "rms",
                table: "event_logs",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "event_types",
                schema: "rms",
                table: "event_logs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
