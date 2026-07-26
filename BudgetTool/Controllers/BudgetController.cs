using BudgetTool.Data;
using BudgetTool.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace BudgetTool.Controllers
{
    public class BudgetController : Controller
    {
        private readonly ApplicationDbContext _context;

        public BudgetController(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult Budget()
        {
            var product = _context.BudgetItems.ToList();
            return View(product);
        }

        [HttpGet]
        public IActionResult GetBudgetForAccount(decimal accountId)
        {
            var items = _context.BudgetItems
                .Where(x => x.AccountId == accountId)
                .Select(x => new { x.AccountId, x.Description, x.Category, x.Amount })
                .ToList();

            return Json(items);
        }

        [HttpPost]
        public async Task<IActionResult> DeleteBudgetForAccount([FromQuery] decimal accountId)
        {
            var items = _context.BudgetItems
                .Where(x => x.AccountId == accountId)
                .ToList();

            if (!items.Any())
                return NotFound();

            _context.BudgetItems.RemoveRange(items);
            await _context.SaveChangesAsync();
            return Json(items);
        }

        [HttpPost]
        public async Task<IActionResult> SaveBudgetForAccount([FromBody] List<BudgetItem> budgetItems)
        {
            await _context.BudgetItems.AddRangeAsync(budgetItems);
            await _context.SaveChangesAsync();
            return Ok(budgetItems);
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
