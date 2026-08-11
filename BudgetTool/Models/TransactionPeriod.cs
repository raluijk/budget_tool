namespace BudgetTool.Models
{
    public class TransactionPeriod
    {
        public required int TransactionPeriodId { get; set; }
        public required int Month { get; set; }
        public required int Year { get; set; }
        public int AccountID { get; set; }
    }
}