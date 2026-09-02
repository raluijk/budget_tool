using BudgetTool.Models;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace BudgetTool.Controllers
{
    public class TransactionCategoryController : Controller
    {
        private string? ConnectionString { get; set; }

        public TransactionCategoryController(IConfiguration configuration)
        {
            ConnectionString = configuration.GetConnectionString("NeonConnection");
        }
        public IActionResult Category()
        {
            return View();
        }

        public async Task<IActionResult> GetCategoriesForAccount([FromQuery] int accountID)
        {
            await using var connection = new NpgsqlConnection(ConnectionString);
            try
            {
                await connection.OpenAsync();
                await using var command = new NpgsqlCommand(
                    """
                    SELECT *
                    FROM transaction_category
                    WHERE account_id = 1
                      AND (is_active = true
                        OR is_active ISNULL);
                    """,
                    connection);
                command.Parameters.AddWithValue("@accountId", accountID);
                await using var reader = await command.ExecuteReaderAsync();
                var transactionCategories = new List<TransactionCategory>();
                while (await reader.ReadAsync())
                {
                    transactionCategories.Add(new TransactionCategory
                    {
                        TransactionCategoryId = reader.GetInt16(0),
                        AccountId = reader.GetInt16(1),
                        CategoryLabel = reader.GetString(2)
                    });
                }
                return Json(transactionCategories);
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
