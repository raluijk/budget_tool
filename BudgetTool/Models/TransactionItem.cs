namespace BudgetTool.Models
{
    public class TransactionItem
    {
        public required int TransactionId { get; set; }
        public required int AccountId { get; set; }
        public required int PeriodId { get; set; }
        public int CategoryId { get; set; }
        public decimal Amount { get; set; }
        public string ? CategoryLabel { get; set; }
    }
}