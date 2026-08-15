namespace BudgetTool.Models
{
    public class ComparisonSelection
    {
        public required int AccountId { get; set; }
        public required int PeriodId { get; set; }
        public int ? Month { get; set; }
        public int ? Year { get; set; }
        public required string SelectionSide { get; set; }
        public int SelectionOrder { get; set; }
    }
}