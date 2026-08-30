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
                      cs.comparison_selection_id,
                      cs.account_id,
                      cs.transaction_period_id,
                      cs.selection_side,
                      cs.selection_order,
                      tp.year,
                      tp.month
                    FROM comparison_selection cs
                    INNER JOIN transaction_period tp ON cs.transaction_period_id = tp.transaction_period_id
                    WHERE cs.account_id = @accountId
                    ORDER BY cs.selection_side, cs.selection_order;
                    """,
                    connection);
                command.Parameters.AddWithValue("@accountId", accountID);
                await using var reader = await command.ExecuteReaderAsync();
                var comparisonSelections = new List<ComparisonSelection>();
                while (await reader.ReadAsync())
                {
                    comparisonSelections.Add(new ComparisonSelection
                    {
                        ComparisonSelectionID = reader.GetInt16(0),
                        AccountId = reader.GetInt16(1),
                        PeriodId = reader.GetInt16(2),
                        SelectionSide = reader.GetString(3),
                        SelectionOrder = reader.GetInt16(4),
                        Year = reader.IsDBNull(3) ? null : reader.GetInt16(5),
                        Month = reader.IsDBNull(2) ? null : reader.GetInt16(6)
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

        public async Task<IActionResult> UpdateComparisonSelections([FromBody] ComparisonSelection comparisonSelection)
        {
            await using var connection = new NpgsqlConnection(ConnectionString);
            try
            {
                await connection.OpenAsync();
                await using var transaction = await connection.BeginTransactionAsync();

                try
                {
                    await using var updateCommand = new NpgsqlCommand(
                    """
                        UPDATE comparison_selection
                        SET selection_order = selection_order + 1
                        WHERE account_id = @accountID
                          AND selection_side = @side
                          AND selection_order >= @selectionOrder;
                        """,
                    connection, transaction);
                    updateCommand.Parameters.AddWithValue("@accountID", comparisonSelection.AccountId);
                    updateCommand.Parameters.AddWithValue("@side", comparisonSelection.SelectionSide);
                    updateCommand.Parameters.AddWithValue("@selectionOrder", comparisonSelection.SelectionOrder);
                    await updateCommand.ExecuteNonQueryAsync();

                    await using var insertCommand = new NpgsqlCommand(
                    """
                        INSERT INTO comparison_selection (account_id, transaction_period_id, selection_side, selection_order)
                        VALUES (@accountId, @periodId, @side, @selectionOrder)
                        RETURNING comparison_selection_id;
                    """,
                    connection, transaction);
                    insertCommand.Parameters.AddWithValue("@accountId", comparisonSelection.AccountId);
                    insertCommand.Parameters.AddWithValue("@periodId", comparisonSelection.PeriodId);
                    insertCommand.Parameters.AddWithValue("@side", comparisonSelection.SelectionSide);
                    insertCommand.Parameters.AddWithValue("@selectionOrder", comparisonSelection.SelectionOrder);
                    var result = await insertCommand.ExecuteScalarAsync();

                    if (result == null)
                    {
                        throw new InvalidOperationException("Insert did not return a comparison_selection_id.");
                    }

                    var newID = (int)result;

                    await transaction.CommitAsync();
                    return Ok(new { success = true, comparisonSelectionId = newID });
                }
                catch (Exception e)
                {
                    Console.WriteLine("Update failed.");
                    Console.WriteLine(e.Message);
                    await transaction.RollbackAsync();
                    return StatusCode(500, "Failed to update comparison selections." + e.Message);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("Connection failed.");
                Console.WriteLine(e.Message);
                return StatusCode(500, e.Message);
            }
        }

        public async Task<IActionResult> DeleteComparisonSelection([FromBody] ComparisonSelection comparisonSelection)
        {
            await using var connection = new NpgsqlConnection(ConnectionString);
            try
            {
                await connection.OpenAsync();
                await using var transaction = await connection.BeginTransactionAsync();

                try
                {
                    await using var deleteCommand = new NpgsqlCommand(
                    """
                        DELETE FROM comparison_selection
                        WHERE comparison_selection_id = @comparisonSelectionId;
                    """,
                    connection, transaction);
                    deleteCommand.Parameters.AddWithValue("@comparisonSelectionId", comparisonSelection.ComparisonSelectionID);
                    await deleteCommand.ExecuteNonQueryAsync();

                    await using var updateCommand = new NpgsqlCommand(
                    """
                        UPDATE comparison_selection
                        SET selection_order = selection_order - 1
                        WHERE account_id = @accountId
                          AND selection_side = @side
                          AND selection_order > @selectionOrder;
                        """,
                    connection, transaction);
                    updateCommand.Parameters.AddWithValue("@accountId", comparisonSelection.AccountId);
                    updateCommand.Parameters.AddWithValue("@side", comparisonSelection.SelectionSide);
                    updateCommand.Parameters.AddWithValue("@selectionOrder", comparisonSelection.SelectionOrder);
                    await updateCommand.ExecuteNonQueryAsync();

                    await transaction.CommitAsync();
                    return Ok(new { success = true });
                }
                catch (Exception e)
                {
                    Console.WriteLine("Delete failed.");
                    Console.WriteLine(e.Message);
                    await transaction.RollbackAsync();
                    return StatusCode(500, "Failed to delete comparison selections." + e.Message);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("Connection failed.");
                Console.WriteLine(e.Message);
                return StatusCode(500, e.Message);
            }
        }
    }
}