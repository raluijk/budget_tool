using BudgetTool.Data;
using BudgetTool.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Client;
using Npgsql;
using System.Diagnostics;

namespace BudgetTool.Controllers
{
    public class TransactionManagerController : Controller
    {
        private string? ConnectionString { get; set; }

        public TransactionManagerController(IConfiguration configuration)
        {
            ConnectionString = configuration.GetConnectionString("NeonConnection");
        }

        public IActionResult TransactionManager()
        {
            return View();
        }
    }
}
