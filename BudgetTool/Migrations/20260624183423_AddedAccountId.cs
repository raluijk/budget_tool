using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BudgetTool.Migrations
{
    /// <inheritdoc />
    public partial class AddedAccountId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AccountId",
                table: "BudgetItems",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccountId",
                table: "BudgetItems");
        }
    }
}
