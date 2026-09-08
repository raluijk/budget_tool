// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
let transactionCategories = [];

const loadingSpinner = document.getElementById("loading-overlay");

function showSpinner() {
    loadingSpinner.classList.remove("loader-hidden");
}

function hideSpinner() {
    loadingSpinner.classList.add("loader-hidden");
}

async function getCategoriesForAccount(accountId) {
    var response = await fetch('/TransactionCategory/GetCategoriesForAccount?accountID=' + accountId);
    if (!response.ok) {
        console.error("Could not load categories for account " + accountId + ". Status: " + response.status);
        return;
    }
    transactionCategories = await response.json();
    console.log("categories", transactionCategories);
}

function getCategorySelect() {
    return getCategorySelect(false);
}

function getCategorySelect(disabled) {
    let categorySelect;
    console.log("transactionCategories", transactionCategories);
    if (transactionCategories.length > 0) {
        categorySelect = '<select ' + (disabled ? 'disabled="true"' : '') + ' name="category" id="category">';
        for (const category of transactionCategories) {
            categorySelect += '<option value="' + category.transactionCategoryId + '">' + category.categoryLabel + '</option>';
        }
        categorySelect += '</select>';
    }
    console.log("categorySelect", categorySelect);
    return categorySelect;
}

async function getTransactionPeriods(accountId) {
    var response = await fetch('/TransactionPeriod/GetTransactionPeriodsForAccount?accountId=' + accountId);
    if (!response.ok) {
        console.error("Could not load transaction periods. Status: " + response.status);
        return;
    }
    let result = await response.json();
    return result;
}

async function loadTransactionItems(accountId, periodIds = null) {
    let transactions = new Map();
    const parameters = new URLSearchParams();
    if (periodIds) {
        periodIds.forEach(periodId => parameters.append('periodId', periodId));
    }
    parameters.append('accountId', 1);
    var response = await fetch(`/TransactionItem/GetTransactionsForPeriod?${parameters.toString()}`);
    if (!response.ok) {
        console.error("Could not load transactions for account " + accountId + ". Status: " + response.status);
        return;
    }
    const items = await response.json();
    let currentItem;
    for (let i = 0; i < items.length; i++) {
        currentItem = items[i];
        if (!transactions.has(currentItem.periodId)) {
            transactions.set(currentItem.periodId, []);
        }
        transactions.get(currentItem.periodId).push(currentItem);
    }
    return transactions;
}