let accountTransactionHistory = [];

window.onload = async function () {
    await loadTransactionHistory();
    displayData();
    generateSelectionMenu();
}

async function loadTransactionHistory() {
    var response = await fetch('/TransactionHistory/GetTransactionPeriods');
    if (!response.ok) {
        console.error("Could not load transaction history. Status: " + response.status);
        return;
    }
    accountTransactionHistory = await response.json();
}

function groupTransactionsByYear() {
    const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let monthArray = [];
    let currentMonth;
    const groupedByYear = accountTransactionHistory.reduce((monthsPerYear, item) => {
        (monthsPerYear[item.year] ??= []).push(item.month);
        return monthsPerYear;
    }, {});

    for (const year in groupedByYear) {
        groupedByYear[year].sort((a, b) => a - b);
    }
    for (const year in groupedByYear) {
        monthArray = groupedByYear[year];
        for (i = 0; i < monthArray.length; i++) {
            currentMonth = monthArray[i];
            monthArray[i] = monthOrder[currentMonth - 1];
        }
    }
    return groupedByYear;
}

function generateSelectionMenu() {
    let yearsAndMonths = groupTransactionsByYear();

    yearSelector = document.getElementById("yearSelector");
    let years = "";
    for (const year in yearsAndMonths) {
        years += year;
    }
    yearSelector.innerHTML = years;
}

function displayData() {
    console.log(accountTransactionHistory);
    console.log(groupTransactionsByYear());
}