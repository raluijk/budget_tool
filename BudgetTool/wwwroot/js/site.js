// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
let transactionCategories;

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