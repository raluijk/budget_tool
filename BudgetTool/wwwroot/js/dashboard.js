let accountId = 1;
let budgetItems = [];

let accountTransactionData = new Map();

window.onload = async function () {
    showSpinner();
    await loadBudgetForAccount(accountId);

    accountTransactionData = await loadTransactionItems(accountId, [1]);
    updateBudgetRowValues();
    console.log("accountTransactionData", accountTransactionData);
    hideSpinner();
}

async function loadBudgetForAccount(accountId) {
    var response = await fetch('/Budget/GetBudgetItems?accountId=' + accountId);
    if (!response.ok) {
        console.error("Could not load budget for account " + accountId + ". Status: " + response.status);
        return;
    }
    budgetItems = await response.json();
}

function calculateBudgetTotal() {
    let amount = 0;
    budgetItems.forEach(budgetItem => { amount += budgetItem.budgetItemAmount; });
    return amount;
}

function calculateTransactionsTotal() {
    let amount = 0;
    accountTransactionData.forEach(transactionItems => {
        amount += transactionItems.reduce((sum, item) => sum + item.amount, 0);
    });
    return amount;
}

function updateBudgetRowValues() {
    const budgetTotal = calculateBudgetTotal();
    const transactionsTotal = calculateTransactionsTotal();

    const budgetTotalDiv = document.getElementById("budget");
    budgetTotalDiv.innerText += " " + currencyFormatter.format(budgetTotal);
    const transactionsTotalDiv = document.getElementById("spent");
    transactionsTotalDiv.innerText = currencyFormatter.format(transactionsTotal);

    const remaining = document.getElementById("remaining");
    remaining.innerText = currencyFormatter.format(budgetTotal - transactionsTotal);
    const percentageRemaining = document.getElementById("percentageRemaining");
    percentageRemaining.innerText = `${(100 - (transactionsTotal * 100 / budgetTotal)).toFixed(2)}% of budget`;
}