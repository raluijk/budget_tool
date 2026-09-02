namespace BudgetTool.Models
{
    public class TransactionCategory
    {
        public int TransactionCategoryId { get; set; }
        public required int AccountId { get; set; }
        public required string CategoryLabel { get; set; }
    }
}
