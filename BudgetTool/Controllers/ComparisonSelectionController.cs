using BudgetTool.Data;
using BudgetTool.Models;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Diagnostics;

namespace BudgetTool.Controllers
{
    public class ComparisonSelectionController : Controller
    {
        private string? ConnectionString { get; set; }

        public ComparisonSelectionController(IConfiguration configuration)
        {
            ConnectionString = configuration.GetConnectionString("NeonConnection");
        }
        public IActionResult ComparisonSelection()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        public async Task<IActionResult> GetComparisonItemsForAccount([FromQuery] int accountID)
        {
            await using var connection = new NpgsqlConnection(ConnectionString);
            try
            {
                await connection.OpenAsync();
                await using var command = new NpgsqlCommand(
                    """
                    SELECT
                      cs.account_id,
                      cs.transaction_period_id,
                      cs.selection_side,
                      cs.selection_order,
                      tp.year,
                      tp.month
                    FROM comparison_selection cs
                    INNER JOIN transaction_period tp ON cs.transaction_period_id = tp.transaction_period_id
                    WHERE cs.account_id = @accountId;
                    """,
                    connection);
                command.Parameters.AddWithValue("@accountId", accountID);
                await using var reader = await command.ExecuteReaderAsync();
                var comparisonSelections = new List<ComparisonSelection>();
                while (await reader.ReadAsync())
                {
                    comparisonSelections.Add(new ComparisonSelection
                    {
                        AccountId = reader.GetInt16(0),
                        PeriodId = reader.GetInt16(1),
                        SelectionSide = reader.GetString(2),
                        SelectionOrder = reader.GetInt16(3),
                        Year = reader.IsDBNull(3) ? null : reader.GetInt16(4),
                        Month = reader.IsDBNull(2) ? null : reader.GetInt16(5)
                    });
                }
                return Json(comparisonSelections);
            }
            catch (Exception e)
            {
                Console.WriteLine("Connection failed.");
                Console.WriteLine(e.Message);
                return Json(e.Message);
            }
        }
    }
}