using BudgetTool.Data;
using BudgetTool.Models;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Text;
using System.Text.Json.Nodes;

namespace BudgetTool.Controllers
{
    public class TransactionItemController : Controller
    {
        private string? ConnectionString { get; set; }

        public TransactionItemController(IConfiguration configuration)
        {
            ConnectionString = configuration.GetConnectionString("NeonConnection");
        }

        public IActionResult TransactionItem()
        {
            return View();
        }

        public async Task<IActionResult> GetTransactionsForPeriod([FromQuery] int[] periodId)
        {
            await using var connection = new NpgsqlConnection(ConnectionString);
            try
            {
                await connection.OpenAsync();
                await using var command = new NpgsqlCommand(
                    """
                    SELECT
                        ti.transaction_item_id,
                        ti.account_id,
                        tp.transaction_period_id,
                        ti.transaction_category_id,
                        ti.transaction_amount,
                        tc.category_label
                    FROM transaction_period tp
                    INNER JOIN transaction_item ti ON tp.transaction_period_id = ti.transaction_period_id
                    INNER JOIN transaction_category tc ON ti.transaction_category_id = tc.transaction_category_id
                    WHERE tp.transaction_period_id = ANY(@periodIds)
                    AND tp.account_id = @accountId;
                    """,
                    connection);
                command.Parameters.AddWithValue("@periodIds", periodId);
                command.Parameters.AddWithValue("@accountId", 1);
                await using var reader = await command.ExecuteReaderAsync();
                var transactionItems = new List<TransactionItem>();
                while (await reader.ReadAsync())
                {
                    transactionItems.Add(new TransactionItem
                    {
                        TransactionId = reader.GetInt16(0),
                        AccountId = reader.GetInt16(1),
                        PeriodId = reader.GetInt16(2),
                        CategoryId = reader.GetInt16(3),
                        Amount = reader.GetDecimal(4),
                        CategoryLabel = reader.GetString(5)
                    });
                }
                return Json(transactionItems);
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
