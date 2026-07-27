let accountTransactionHistory = [];
let selectedYear = null;

const yearSelector = document.getElementById("yearSelector");
yearSelector.classList.add('historySelector-closed');
yearSelector.textContent = "Select Year";

yearSelector.addEventListener("click", (event) => {
    event.stopPropagation();

    const yearOption = event.target.closest(".year-option");

    if (yearOption) {
        selectedYear = yearOption.dataset.year;
        yearSelector.classList.remove("yearMonthDropdownShow");
        yearSelector.classList.add('historySelector-closed');
        yearSelector.textContent = selectedYear;
        return;
    }

    yearSelector.classList.toggle("yearMonthDropdownShow");
    if (yearSelector.classList.contains("yearMonthDropdownShow")) {
        yearSelector.classList.remove('historySelector-closed');
        generateSelectionMenu();
    }
    else {
        yearSelector.classList.add('historySelector-closed');
        yearSelector.textContent = selectedYear || "Select Year";
    }
});

window.addEventListener('click', () => {
    if (yearSelector.classList.contains('yearMonthDropdownShow')) {
        yearSelector.classList.remove('yearMonthDropdownShow');
        yearSelector.classList.add('historySelector-closed');
        yearSelector.textContent = selectedYear || "Select a year";
    }
});

window.onload = async function () {
    await loadTransactionHistory();
    displayData();
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
    yearSelector.innerHTML = "";
    let years = "";
    for (const year in yearsAndMonths) {
        const yearOption = document.createElement("div");
        yearOption.classList.add("year-option");
        yearOption.textContent = year;
        yearOption.dataset.year = year;
        yearSelector.appendChild(yearOption);
    }
}

function displayData() {
    console.log(accountTransactionHistory);
    console.log(groupTransactionsByYear());
}