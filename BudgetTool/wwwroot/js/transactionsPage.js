let accountTransactionHistory = [];
let monthsForSelectedYear = [];
let monthsGroupedByYear = {};

let yearsAndMonthsToCompare = [];

let selectedYear = null;
let selectedMonth = null;

let transactionsPieChartLeft;
let transactionsPieChartRight;

window.onload = async function () {
    await loadTransactionHistory();
    loadTransactionsPieChart();
    displayData();
}

const yearSelector = document.getElementById("yearSelector");
yearSelector.classList.add('historySelector-closed');
yearSelector.textContent = "Select Year";
const monthSelector = document.getElementById("monthSelector");
monthSelector.classList.add('historySelector-closed');
monthSelector.textContent = "Select Month";

const buttonCancel = document.getElementById("buttonCancel");
const buttonOkay = document.getElementById("buttonOkay");

buttonCancel.addEventListener('click', () => {
    document.getElementById("yearAndMonthsMenuContainer").style.display = "none";
});

buttonOkay.addEventListener('click', () => {
    document.getElementById("yearAndMonthsMenuContainer").style.display = "none";
    yearsAndMonthsToCompare.push({ year: selectedYear, month: selectedMonth });
});

yearSelector.addEventListener("click", (event) => {
    event.stopPropagation();

    const yearOption = event.target.closest(".year-option");

    monthSelector.classList.add('historySelector-closed');
    monthSelector.textContent = "Select Month";
    if (monthSelector.style.display == "block") {
        monthSelector.style.display = "none";
    } else {
        monthSelector.style.display = "block";
    }

    if (yearOption) {
        selectedYear = yearOption.dataset.year;
        yearSelector.classList.remove("yearMonthDropdownShow");
        yearSelector.classList.add('historySelector-closed');
        yearSelector.textContent = selectedYear;
        monthsForSelectedYear = monthsGroupedByYear[selectedYear];
        return;
    }

    yearSelector.classList.toggle("yearMonthDropdownShow");
    if (yearSelector.classList.contains("yearMonthDropdownShow")) {
        yearSelector.classList.remove('historySelector-closed');
        generateYearSelectionMenu();
    }
    else {
        yearSelector.classList.add('historySelector-closed');
        yearSelector.textContent = selectedYear || "Select Year";
    }
});

monthSelector.addEventListener("click", (event) => {
    event.stopPropagation();

    const monthOption = event.target.closest(".month-option");

    if (monthOption) {
        selectedMonth = monthOption.dataset.month;
        monthSelector.classList.remove("yearMonthDropdownShow");
        monthSelector.classList.add('historySelector-closed');
        monthSelector.textContent = selectedMonth;
        return;
    }

    monthSelector.classList.toggle("yearMonthDropdownShow");
    if (monthSelector.classList.contains("yearMonthDropdownShow")) {
        monthSelector.classList.remove('historySelector-closed');
        generateMonthSelectionMenu();
    }
    else {
        monthSelector.classList.add('historySelector-closed');
        monthSelector.textContent = selectedMonth || "Select Month";
    }
});

function handleDropdownSelection(event, optionClass, optionKey, menuSelector, defaultText) {
    event.stopPropagation();

    const clickedOption = event.target.closest(optionClass);

    if (clickedOption) {
        const value = clickedOption.dataset[optionKey];
        menuSelector.classList.remove("yearMonthDropdownShow");
        menuSelector.classList.add('historySelector-closed');
        menuSelector.textContent = value;
        return;
    }

    menuSelector.classList.toggle("yearMonthDropdownShow");
    if (menuSelector.classList.contains("yearMonthDropdownShow")) {
        menuSelector.classList.remove('historySelector-closed');
        generateMonthSelectionMenu();
    }
    else {
        menuSelector.classList.add('historySelector-closed');
        menuSelector.textContent = value || defaultText;
    }
};

window.addEventListener('click', () => {
    monthSelector.style.display = 'block';
    if (yearSelector.classList.contains('yearMonthDropdownShow')) {
        yearSelector.classList.remove('yearMonthDropdownShow');
        yearSelector.classList.add('historySelector-closed');
        yearSelector.textContent = selectedYear || "Select a year";
    }
    if (monthSelector.classList.contains('yearMonthDropdownShow')) {
        monthSelector.classList.remove('yearMonthDropdownShow');
        monthSelector.classList.add('historySelector-closed');
        monthSelector.textContent = selectedMonth || "Select a month";
    }
});

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
    monthsGroupedByYear = groupedByYear
}

function generateYearSelectionMenu() {
    groupTransactionsByYear();
    yearSelector.innerHTML = "";
    let years = "";
    for (const year in monthsGroupedByYear) {
        const yearOption = document.createElement("div");
        yearOption.classList.add("year-option");
        yearOption.textContent = year;
        yearOption.dataset.year = year;
        yearSelector.appendChild(yearOption);
    }
}

function generateMonthSelectionMenu() {
    monthSelector.innerHTML = "";
    let months = "";
    console.log("Months for selected year: ", monthsForSelectedYear);
    for (const month of monthsForSelectedYear) {
        const monthOption = document.createElement("div");
        monthOption.classList.add("month-option");
        monthOption.textContent = month;
        monthOption.dataset.month = month;
        monthSelector.appendChild(monthOption);
    }

}

function loadTransactionsPieChart() {
    const ctxRight = document.getElementById('transactionsPieChartRight').getContext('2d');
    const ctxLeft = document.getElementById('transactionsPieChartLeft').getContext('2d');
    let accountTransactionData = [
        { "description": "Sample Transaction1", "amount": 100, "category": "Sample Category1", "date": "2024-01-01" },
        { "description": "Sample Transaction2", "amount": 200, "category": "Sample Category2", "date": "2024-01-01" },
        { "description": "Sample Transaction3", "amount": 300, "category": "Sample Category3", "date": "2024-01-01" },
        { "description": "Sample Transaction4", "amount": 400, "category": "Sample Category4", "date": "2024-01-01" },
        { "description": "Sample Transaction5", "amount": 500, "category": "Sample Category5", "date": "2024-01-01" }
    ];
    transactionsPieChartRight = new Chart(ctxRight, {
        type: 'pie',
        data: {
            labels: accountTransactionData.map(x => x.description),
            datasets: [{
                data: accountTransactionData.map(x => x.amount),
            }]
        },
        options: {
            radius: '80%'
        }
    });
    transactionsPieChartLeft = new Chart(ctxLeft, {
        type: 'pie',
        data: {
            labels: accountTransactionData.map(x => x.description),
            datasets: [{
                data: accountTransactionData.map(x => x.amount),
            }]
        },
        options: {
            radius: '80%'
        }
    });
}

function displayData() {
    console.log(accountTransactionHistory);
    console.log(groupTransactionsByYear());
}