namespace BudgetTool.Data
{
    using Microsoft.EntityFrameworkCore;
    using BudgetTool.Models;

    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Define your DbSets (Tables) here
        public DbSet<BudgetItem> BudgetItems { get; set; }
    }
}
