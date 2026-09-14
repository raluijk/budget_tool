let accountId = 1;
let budgetItems = [];

let accountTransactionData = new Map();

window.onload = async function () {
    showSpinner();
    await loadBudgetForAccount(accountId);

    accountTransactionData = await loadTransactionItems(accountId, [1]);
    updateBudgetRowValues();
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

    const remainingText = document.getElementById("remainingText");
    const remainingDiv = document.getElementById("remaining");
    const percentageRemaining = document.getElementById("percentageRemaining");
    let remainingAmount = budgetTotal - transactionsTotal;
    if (remainingAmount >= 0) {
        remainingText.innerText = "Remaining";
        remainingDiv.innerText = currencyFormatter.format(remainingAmount);
        percentageRemaining.innerText = `${(100 - (transactionsTotal * 100 / budgetTotal)).toFixed(2)}% of budget`;
    } else {
        remainingText.innerText = "Over";
        remainingDiv.innerText = currencyFormatter.format(Math.abs(remainingAmount));
        percentageRemaining.innerText = `${Math.abs((remainingAmount * 100 / budgetTotal)).toFixed(2)}% of budget`;
    }

    const biggestOverspend = getBiggestOverspend();
    const over = document.getElementById("biggestOverspendCategory");
    over.innerText = biggestOverspend.category;
    const percentageOver = document.getElementById("overSpendAmount");
    percentageOver.innerText = currencyFormatter.format(biggestOverspend.amount);
}

function flattenTransactionItems() {
    let flattenedTransactions = [];
    let itemIndex = {};
    for (const [key, value] of accountTransactionData) {
        value.forEach(item => {
            itemIndex = flattenedTransactions.findIndex(transaction => transaction.categoryId === item.categoryId);
            if (itemIndex !== -1) {
                flattenedTransactions[itemIndex].amount = item.amount;
            } else {
                flattenedTransactions.push(item);
            }
        })
    }
    return flattenedTransactions;
}

function getBiggestOverspend() {
    let flattenedTransactionItems = flattenTransactionItems();
    let biggestOverspend = {"category": "", "amount": 0};
    let transactionIndex;
    let currentTransactionItem;
    let difference;
    budgetItems.forEach(budgetItem => {
        transactionIndex = flattenedTransactionItems.findIndex(transactionItem => transactionItem.categoryId === budgetItem.categoryId);
        if (transactionIndex > -1) {
            currentTransactionItem = flattenedTransactionItems[transactionIndex];
            difference = currentTransactionItem.amount - budgetItem.budgetItemAmount;
            if (difference > biggestOverspend.amount) {
                biggestOverspend.category = currentTransactionItem.categoryLabel;
                biggestOverspend.amount = difference;
            }
        }
    });
    return biggestOverspend;
}