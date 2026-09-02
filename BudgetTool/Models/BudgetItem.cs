namespace BudgetTool.Models
{
    public class BudgetItem
    {
        public int? BudgetItemId { get; set; }
        public string? BudgetItemDescription { get; set; }
        public required int CategoryId { get; set; }
        public required string BudgetItemType { get; set; }
        public required decimal BudgetItemAmount { get; set; }
        public required int AccountId { get; set; }
        public DateTime? LastModifiedDateTime { get; set; }
        public string? CategoryLabel { get; set; }
    }
}
