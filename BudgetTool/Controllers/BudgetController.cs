using BudgetTool.Data;
using BudgetTool.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Client;
using Npgsql;
using System.Diagnostics;

namespace BudgetTool.Controllers
{
    public class BudgetController : Controller
    {
        private string? ConnectionString { get; set; }

        public BudgetController(IConfiguration configuration)
        {
            ConnectionString = configuration.GetConnectionString("NeonConnection");
        }

        public IActionResult Budget()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetBudgetItems(decimal accountId)
        {
            await using var connection = new NpgsqlConnection(ConnectionString);
            try
            {
                await connection.OpenAsync();
                await using var command = new NpgsqlCommand(
                    """
                    SELECT
                        bi.budget_item_id,
                        bi.budget_item_description,
                        bi.category_id,
                        bi.budget_item_type,
                        bi.budget_item_amount,
                        bi.account_id,
                        bi.last_modified_datetime,
                        tc.category_label
                    FROM budget_item bi
                    INNER JOIN transaction_category tc ON bi.category_id = tc.transaction_category_id
                    WHERE bi.account_id = 1;
                    """,
                    connection);
                command.Parameters.AddWithValue("@accountId", accountId);
                await using var reader = await command.ExecuteReaderAsync();
                var budgetItems = new List<BudgetItem>();
                while (await reader.ReadAsync())
                {
                    budgetItems.Add(new BudgetItem
                    {
                        BudgetItemId = reader.GetInt16(0),
                        BudgetItemDescription = reader.GetString(1),
                        CategoryId = reader.GetInt16(2),
                        BudgetItemType = reader.GetString(3),
                        BudgetItemAmount = reader.GetInt16(4),
                        AccountId = reader.GetInt16(5),
                        LastModifiedDateTime = reader.GetDateTime(6),
                        CategoryLabel = reader.GetString(7),
                    });
                }
                return Json(budgetItems);
            }
            catch (Exception e)
            {
                Console.WriteLine("Connection failed.");
                Console.WriteLine(e.Message);
                return Json(e.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateBudgetItems([FromQuery] decimal accountId)
        {
            return Json("");
        }

        [HttpPost]
        public async Task<IActionResult> AddBudgetItems([FromBody] BudgetItem budgetItems)
        {
            return Json("");
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
