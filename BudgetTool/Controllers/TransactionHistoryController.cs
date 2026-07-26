using BudgetTool.Data;
using BudgetTool.Models;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Text;
using System.Text.Json.Nodes;

namespace BudgetTool.Controllers
{
    public class TransactionHistoryController : Controller
    {
        private string? ConnectionString { get; set; }

        public TransactionHistoryController(IConfiguration configuration)
        {
            ConnectionString = configuration.GetConnectionString("NeonConnection");
        }

        public IActionResult TransactionHistory()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactionPeriods()
        {
            Console.WriteLine("Test");
            await using var connection = new NpgsqlConnection(ConnectionString);
            try
            {
                await connection.OpenAsync();
                await using var command = new NpgsqlCommand("SELECT * FROM transactions_period;", connection);
                await using var reader = await command.ExecuteReaderAsync();
                var transactionPeriod = new List<TransactionPeriod>();
                while (await reader.ReadAsync())
                {
                    transactionPeriod.Add(new TransactionPeriod
                    {
                        Id = reader.GetInt16(0),
                        Month = reader.GetInt16(1),
                        Year = reader.GetInt16(2),
                        AccountID = reader.GetInt16(2)
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
    }
}
