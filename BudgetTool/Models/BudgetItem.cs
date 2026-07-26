namespace BudgetTool.Models
{
    public class BudgetItem
    {
        public int Id { get; set; }
        public decimal AccountId { get; set; }
        public required string Description { get; set; }
        public string? Category { get; set; }
        public decimal Amount { get; set; }
    }
}
