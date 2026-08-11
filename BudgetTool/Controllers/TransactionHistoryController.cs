using Microsoft.AspNetCore.Mvc;

namespace BudgetTool.Controllers
{
    public class TransactionHistoryController : Controller
    {
        public IActionResult TransactionHistory()
        {
            return View();
        }
    }
}
