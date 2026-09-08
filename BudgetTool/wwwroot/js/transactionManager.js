const accountId = 1;
const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let selectedMonth;
let selectedYear;
let selectedPeriod;

let accountTransactionPeriods = [];
let transactionYears = [];
let accountTransactionData = new Map();

window.onload = async function () {
    showSpinner();
    accountTransactionPeriods = await getTransactionPeriods(accountId, 1);
    transactionYears = [...new Set(accountTransactionPeriods.map(period => period.year))];
    createTransactionSelectMenu();
    let yearPeriods = document.querySelectorAll('.selectPeriod');
    console.log("yearPeriods", yearPeriods);
    for (const yearPeriod of yearPeriods) {
        yearPeriod.click();
    }
    accountTransactionData = await loadTransactionItems(accountId);
    await getCategoriesForAccount();
    loadTransactionTable(1);
    hideSpinner();
}

function toggleMonths() {
    let year = event.target.innerText;
    event.target.classList.toggle("expanded");
    var monthDivs = document.querySelectorAll(`[name="${year}"]`);
    for (const monthDiv of monthDivs) {
        if (monthDiv.style.display === "none") {
            monthDiv.style.display = "block";
        } else {
            monthDiv.style.display = "none";
        }
    }
    monthDivs[monthDivs.length - 1].classList.toggle("monthsExpanded");
}

function createTransactionSelectMenu() {
    let periodOptions = document.createElement("div");
    periodOptions.id = "periodOptions";

    for (const year of transactionYears) {
        let yearDiv = document.createElement("div");
        yearDiv.classList.add("yearPeriod", "selectPeriod");
        yearDiv.setAttribute("onclick", "toggleMonths(this)");
        yearDiv.innerText = year;
        let monthDivs = accountTransactionPeriods.filter(period => period.year === year);
        periodOptions.appendChild(yearDiv);
        let count = 0;
        for (const monthDiv of monthDivs) {
            count++;
            let className = count == monthDivs.length ? "monthsExpanded" : "monhtsCollapsed";
            let monthOption = document.createElement("div");
            monthOption.classList.add("month-option");
            monthOption.classList.add(className);
            monthOption.setAttribute("name", year);
            monthOption.innerText = monthOrder[monthDiv.month - 1];
            periodOptions.appendChild(monthOption);
        }
    }

    let newPeriodDiv = document.createElement("div");
    newPeriodDiv.id = "newPeriod";
    newPeriodDiv.classList.add("yearPeriod");
    newPeriodDiv.setAttribute("onclick", "addNewPeriod()");
    newPeriodDiv.innerText = "Add New Period";
    periodOptions.appendChild(newPeriodDiv);

    document.getElementById("periodSelector").insertBefore(periodOptions, document.getElementById("selectPeriod"));
}

async function addNewPeriod() {
    
}

document.getElementById("selectPeriod").addEventListener("click", async (event) => {
    showSpinner();
    //todo: first try to get local data, if not found, then get from server
    var response = await fetch(`/TransactionPeriod/GetTransactionPeriodID?month=${selectedMonth}&year=${selectedYear}&accountId=${accountId}`);
    if (!response.ok) {
        console.error("Could not load transaction period. Status: " + response.status);
        return;
    }
    selectedPeriod = await response.json();
    console.log("selectedPeriod", selectedPeriod);
    accountTransactionData = await loadTransactionItems(accountId, [selectedPeriod]);
    loadTransactionTable(selectedPeriod);
    console.log("NEW accountTransactionPeriods", accountTransactionPeriods);
    loadTransactionTable(selectedPeriod);
    hideSpinner();
});

document.getElementById("periodSelector").addEventListener("click", async (event) => {
    document.querySelectorAll(".month-option").forEach(option => option.classList.remove("selected"));
    const monthOption = event.target.closest(".month-option");
    selectedMonth = monthOrder.findIndex(month => month === monthOption?.innerText) + 1;
    selectedYear = parseInt(monthOption?.getAttribute("name"));
    if (monthOption) {
        monthOption.classList.toggle("selected");
    }
});

function loadTransactionTable(periodId) {
    let row = document.querySelectorAll('tr');
    for (const currRow of row) {
        currRow.remove();
    }

    let tableBody = document.querySelector('table');
    let headerRow = tableBody.insertRow(0);
    headerRow.insertCell(0).outerHTML = '<th scope="col">Description</th>';
    headerRow.insertCell(1).outerHTML = '<th scope="col">Type</th>';
    headerRow.insertCell(2).outerHTML = '<th scope="col">Income/Expense</th>';
    headerRow.insertCell(3).outerHTML = '<th scope="col">Amount</th>';
    headerRow.insertCell(4).outerHTML = '<th scope="col" style="display:none"></th>';

    let currentPeriodTransactions = accountTransactionData.get(periodId) ||[];

    currentPeriodTransactions.forEach((item, i) => {
        let currRow = tableBody.insertRow(i + 1);
        console.log("item", item);
        currRow.insertCell(0).outerHTML = '<td>' + '</td>';
        currRow.insertCell(1).outerHTML = '<td>' + getCategorySelect(true) + '</td>';
       // currRow.cells[1].querySelector('select').value = item.categoryId;
        currRow.insertCell(2).outerHTML = '<td>' + '</td>';
        currRow.insertCell(3).outerHTML = '<td>' + item.amount + '</td>';
        currRow.insertCell(4).outerHTML = '<td style="display:none">' + item.TransactionId + '</td>';
    });
}