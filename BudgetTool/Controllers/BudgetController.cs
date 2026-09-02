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
                return StatusCode(500, "Could not connect to the database.");
            }
        }

        [HttpPost]
        [HttpPost]
        public async Task<IActionResult> UpdateBudgetItems([FromBody] List<BudgetItem> budgetItems)
        {
            
            if (budgetItems == null || budgetItems.Count == 0)
            {
                return BadRequest("No budget items were provided.");
            }

            await using var connection = new NpgsqlConnection(ConnectionString);
            try
            {
                await connection.OpenAsync();
                await using var transaction = await connection.BeginTransactionAsync();

                try
                {
                    foreach (var item in budgetItems)
                    {
                        if (item.BudgetItemId.HasValue)
                        {
                            await using var updateCommand = new NpgsqlCommand(
                            """
                            UPDATE budget_item
                            SET budget_item_description = @description,
                                category_id = @categoryId,
                                budget_item_amount = @amount,
                                budget_item_type = @type,
                                last_modified_datetime = NOW()
                            WHERE budget_item_id = @budgetItemId
                              AND account_id = @accountId;
                            """,
                            connection, transaction);
                            updateCommand.Parameters.AddWithValue("@description", item.BudgetItemDescription);
                            updateCommand.Parameters.AddWithValue("@categoryId", item.CategoryId);
                            updateCommand.Parameters.AddWithValue("@amount", item.BudgetItemAmount);
                            updateCommand.Parameters.AddWithValue("@type", item.BudgetItemType);
                            updateCommand.Parameters.AddWithValue("@budgetItemId", item.BudgetItemId);
                            updateCommand.Parameters.AddWithValue("@accountId", item.AccountId);
                            await updateCommand.ExecuteNonQueryAsync();
                        }
                        else
                        {
                            await using var insertCommand = new NpgsqlCommand(
                                """
                                INSERT INTO budget_item (account_id, budget_item_description, category_id, budget_item_amount, budget_item_type, last_modified_datetime)
                                VALUES (@accountId, @description, @categoryId, @amount, @type, NOW());
                                """,
                                connection, transaction);
                            insertCommand.Parameters.AddWithValue("@accountId", item.AccountId);
                            insertCommand.Parameters.AddWithValue("@description", item.BudgetItemDescription);
                            insertCommand.Parameters.AddWithValue("@categoryId", item.CategoryId);
                            insertCommand.Parameters.AddWithValue("@amount", item.BudgetItemAmount);
                            insertCommand.Parameters.AddWithValue("@type", item.BudgetItemType);
                            await insertCommand.ExecuteNonQueryAsync();
                        }
                    }

                    await transaction.CommitAsync();
                    return Ok(new { success = true });
                }
                catch (Exception e)
                {
                    Console.WriteLine("Update failed.");
                    Console.WriteLine(e.Message);
                    await transaction.RollbackAsync();
                    return StatusCode(500, "Failed to update budget items." + e.Message);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("Connection failed.");
                Console.WriteLine(e.Message);
                return StatusCode(500, "Could not connect to the database." + e.Message);
            }
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
