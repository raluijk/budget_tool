using BudgetTool.Data;
using BudgetTool.Models;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Text;
using System.Text.Json.Nodes;

namespace BudgetTool.Controllers
{
    public class TransactionPeriodController : Controller
    {
        private string? ConnectionString { get; set; }

        public TransactionPeriodController(IConfiguration configuration)
        {
            ConnectionString = configuration.GetConnectionString("NeonConnection");
        }

        public IActionResult TransactionPeriod()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactionPeriods()
        {
            await using var connection = new NpgsqlConnection(ConnectionString);
            try
            {
                await connection.OpenAsync();
                await using var command = new NpgsqlCommand("SELECT * FROM transaction_period;", connection);
                await using var reader = await command.ExecuteReaderAsync();
                var transactionPeriod = new List<TransactionPeriod>();
                while (await reader.ReadAsync())
                {
                    transactionPeriod.Add(new TransactionPeriod
                    {
                        TransactionPeriodId = reader.GetInt16(0),
                        Month = reader.GetInt16(1),
                        Year = reader.GetInt16(2),
                        AccountID = reader.GetInt16(3)
                    });
                }
                return Json(transactionPeriod);
            }
            catch (Exception e)
            {
                Console.WriteLine("Connection failed.");
                Console.WriteLine(e.Message);
                return Json(e.Message);
            }
        }

        public async Task<IActionResult> GetTransactionPeriodID(int month, int year, int accountId)
        {
            int transactionPeriodId = 0;
            await using var connection = new NpgsqlConnection(ConnectionString);
            try
            {
                await connection.OpenAsync();
                await using var command = new NpgsqlCommand("SELECT transaction_period_id FROM transaction_period WHERE month = @month AND year = @year AND account_id = @account_id;", connection);
                command.Parameters.AddWithValue("month", month);
                command.Parameters.AddWithValue("year", year);
                command.Parameters.AddWithValue("account_id", accountId);
                var result = await command.ExecuteScalarAsync();
                if (result != null && result != DBNull.Value)
                {
                    transactionPeriodId = Convert.ToInt32(result);
                } else
                {
                    return NotFound($"No transaction period found for month {month}, year {year}, and account ID {accountId}.");
                }
                return Ok(transactionPeriodId);
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
