namespace BudgetTool.Data
{
    using Microsoft.EntityFrameworkCore;
    using BudgetTool.Models;

    public class NeonDbContext : DbContext
    {
        public NeonDbContext(DbContextOptions<NeonDbContext> options) : base(options)
        {
        }

        // Define your DbSets (Tables) here
        public DbSet<TransactionPeriod> TransactionHistory { get; set; }
    }
}
