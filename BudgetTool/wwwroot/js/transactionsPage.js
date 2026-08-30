"use strict"

/*TODO:
1. When Okay for selection is clicked, add it to db
2. When remove is clicked, delete from db
*/

let accountTransactionHistory = [];
let monthsForSelectedYear = [];
let monthsGroupedByYear = {};
let transactionItems = new Map();
let leftComparisonSelections = [];
let rightComparisonSelections = [];
let addButtonSideClicked;
let accountId = 1;

let yearsAndMonthsToCompare = [];

let selectedYear = null;
let selectedMonth = null;
let selectedPeriod = null;

let transactionsPieChartLeft;
let transactionsPieChartRight;

let leftChartPrevSelect = document.getElementById("leftChartPrevSelect");
let leftChartNextSelect = document.getElementById("leftChartNextSelect");
let rightChartPrevSelect = document.getElementById("rightChartPrevSelect");
let rightChartNextSelect = document.getElementById("rightChartNextSelect");

let currentLeftSelectionIndex = 0;
let currentRightSelectionIndex = 0;

const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

window.onload = async function () {
    showSpinner();
    const graphs = document.querySelectorAll(".comparison-container");
    await loadTransactionItems(1);
    await loadTransactionHistory();
    await getComparisonSelections(1);
    let leftPeriodId, rightPeriodId;
    if (leftComparisonSelections.length > 0) {
        leftPeriodId = leftComparisonSelections[0].periodId;
    }
    if (rightComparisonSelections.length > 0) {
        rightPeriodId = rightComparisonSelections[0].periodId;
    }
    loadTransactionsPieChart(leftPeriodId, rightPeriodId, accountId);
    hideSpinner();
    graphs.forEach(graph => {
        graph.style.display = "block";
    });
}

const yearSelector = document.getElementById("yearSelector");
yearSelector.classList.add('historySelector-closed');
yearSelector.textContent = "Select Year";
const monthSelector = document.getElementById("monthSelector");
monthSelector.classList.add('historySelector-closed');
monthSelector.textContent = "Select Month";

const buttonCancel = document.getElementById("buttonCancel");
const buttonOkay = document.getElementById("buttonOkay");
const buttonAddComparisonLeft = document.getElementById("btnAddComparisonLeft");
const buttonAddComparisonRight = document.getElementById("btnAddComparisonRight");
const buttonRemoveComparisonLeft = document.getElementById("btnRemoveComparisonLeft");
const buttonRemoveComparisonRight = document.getElementById("btnRemoveComparisonRight");

buttonCancel.addEventListener('click', () => {
    document.getElementById("yearAndMonthsMenuContainer").style.display = "none";
    addButtonSideClicked = "";
});

buttonAddComparisonLeft.addEventListener('click', () => {
    document.getElementById("yearAndMonthsMenuContainer").style.display = "flex";
    addButtonSideClicked = "left";
});

buttonAddComparisonRight.addEventListener('click', () => {
    document.getElementById("yearAndMonthsMenuContainer").style.display = "flex";
    addButtonSideClicked = "right";
});

buttonRemoveComparisonLeft.addEventListener('click', () => { removeComparison("left") });
buttonRemoveComparisonRight.addEventListener('click', () => { removeComparison("right") });

buttonOkay.addEventListener('click', async () => {
    let selectionToAdd = {};
    let updateResult;
    document.getElementById("yearAndMonthsMenuContainer").style.display = "none";
    if (buttonRemoveComparisonLeft.style.display == "none") {
        buttonRemoveComparisonLeft.style.display = "flex";
    }
    if (buttonRemoveComparisonRight.style.display == "none") {
        buttonRemoveComparisonRight.style.display = "flex";
    }
    let numericMonth = monthOrder.indexOf(selectedMonth) + 1;
    var response = await fetch(`/TransactionPeriod/GetTransactionPeriodID?month=${numericMonth}&year=${selectedYear}&accountId=${accountId}`);
    if (!response.ok) {
        console.error("Could not load transaction period. Status: " + response.status);
        return;
    }
    selectedPeriod = await response.json();
    selectionToAdd = {
        accountId: accountId,
        periodId: selectedPeriod,
        month: parseInt(numericMonth),
        year: selectedYear,
        selectionSide: "left",
        selectionOrder: currentLeftSelectionIndex + 1
    };
    loadTransactionItems(1, [selectedPeriod]);
    if (addButtonSideClicked === "left") {
        if (leftComparisonSelections.some(cs => cs.periodId == selectedPeriod)) {
            const foundIndex = leftComparisonSelections.findIndex(cs => cs.periodId == selectedPeriod);
            cycleComparisonSelections("left", foundIndex - currentLeftSelectionIndex);
            return;
        }
        selectionToAdd.selectionSide = "left";
        console.log("left selectionToAdd", selectionToAdd);
        updateResult = updateComparisonSelections(selectionToAdd);
        if (!updateResult) {
            return;
        }
        for (let i = currentLeftSelectionIndex + 1; i < leftComparisonSelections.length; i++) {
            leftComparisonSelections[i].selectionOrder += 1;
        }
        leftComparisonSelections.splice(currentLeftSelectionIndex + 1, 0, selectionToAdd);
        cycleComparisonSelections("left", 1);
    } else if (addButtonSideClicked === "right") {
        if (rightComparisonSelections.some(cs => cs.periodId == selectedPeriod)) {
            const foundIndex = rightComparisonSelections.findIndex(cs => cs.periodId == selectedPeriod);
            cycleComparisonSelections("right", foundIndex - currentRightSelectionIndex);
            return;
        }
        selectionToAdd.selectionSide = "right";
        console.log("right selectionToAdd", selectionToAdd);
        updateResult = updateComparisonSelections(selectionToAdd);
        if (!updateResult) {
            return true;
        }
        for (let i = currentRightSelectionIndex + 1; i < rightComparisonSelections.length; i++) {
            rightComparisonSelections[i].selectionOrder += 1;
        }
        rightComparisonSelections.splice(currentRightSelectionIndex + 1, 0, selectionToAdd);
        cycleComparisonSelections("right", 1);
    }
    addButtonSideClicked = "";
});

async function updateComparisonSelections(selectionToAdd) {
    console.log("selectionToAdd", selectionToAdd);
    try {
        const response = await fetch('/ComparisonSelection/UpdateComparisonSelections', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(selectionToAdd)
        });
        console.log("response", response);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Success:', data.message);
        selectionToAdd.comparisonSelectionId = data.comparisonSelectionId;
        console.log("selectionToAdd 2", selectionToAdd);
        return true;
    } catch (error) {
        console.error('Error sending data:', error);
        return false;
    }
}

async function deleteComparisonSelection(selectionToDelete) {
    try {
        const response = await fetch('/ComparisonSelection/DeleteComparisonSelection', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(selectionToDelete)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Success:', data.message);
    } catch (error) {
        console.error('Error sending data:', error);
    }
}

leftChartPrevSelect.addEventListener('click', () => {
    cycleComparisonSelections("left", -1);
});

leftChartNextSelect.addEventListener('click', () => {
    cycleComparisonSelections("left", 1);
});

rightChartPrevSelect.addEventListener('click', () => {
    cycleComparisonSelections("right", -1);
});

rightChartNextSelect.addEventListener('click', () => {
    cycleComparisonSelections("right", 1);
});

function removeComparison(side) {
    if (side === "left") {
        console.log("item to remove", leftComparisonSelections[currentLeftSelectionIndex]);
        deleteComparisonSelection(leftComparisonSelections[currentLeftSelectionIndex]);
        leftComparisonSelections.splice(currentLeftSelectionIndex, 1);
    }
    if (side === "right") {
        deleteComparisonSelection(rightComparisonSelections[currentRightSelectionIndex]);
        rightComparisonSelections.splice(currentRightSelectionIndex, 1);
    }
    cycleComparisonSelections(side, -1);
}

function cycleComparisonSelections(comparisonSide, direction) {
    let accountId = 1;
    let itemsForPeriod;
    if (comparisonSide === "left") {
        if (leftComparisonSelections.length == 0) {
            transactionsPieChartLeft.destroy();
            document.getElementById("graph-title-left").innerText = "Please add a transaction period";
            buttonRemoveComparisonLeft.style.display = "none";
            return;
        }
        currentLeftSelectionIndex += direction;
        if (currentLeftSelectionIndex < 0) {
            currentLeftSelectionIndex = leftComparisonSelections.length - 1;
        } else if (currentLeftSelectionIndex >= leftComparisonSelections.length) {
            currentLeftSelectionIndex = 0;
        }
        itemsForPeriod = getItemsForPeriodAndAccount(leftComparisonSelections[currentLeftSelectionIndex].periodId, accountId);
        renderPieChart('transactionsPieChartLeft', itemsForPeriod, 'left');
        updatePreviewLabels("left", currentLeftSelectionIndex);
    } else if (comparisonSide === "right") {
        if (rightComparisonSelections.length == 0) {
            transactionsPieChartRight.destroy();
            document.getElementById("graph-title-right").innerText = "Please add a transaction period";
            buttonRemoveComparisonRight.style.display = "none";
            return;
        }
        currentRightSelectionIndex += direction;
        if (currentRightSelectionIndex < 0) {
            currentRightSelectionIndex = rightComparisonSelections.length - 1;
        } else if (currentRightSelectionIndex >= rightComparisonSelections.length) {
            currentRightSelectionIndex = 0;
        }
        itemsForPeriod = getItemsForPeriodAndAccount(rightComparisonSelections[currentRightSelectionIndex].periodId, accountId);
        renderPieChart('transactionsPieChartRight', itemsForPeriod, 'right');
        updatePreviewLabels("right", currentRightSelectionIndex);
    }
}

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
        selectedYear = Number(yearOption.dataset.year);
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
    var response = await fetch('/TransactionPeriod/GetTransactionPeriods');
    if (!response.ok) {
        console.error("Could not load transaction history. Status: " + response.status);
        return;
    }
    accountTransactionHistory = await response.json();
}

function groupTransactionsByYear() {
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
        for (let i = 0; i < monthArray.length; i++) {
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
    for (const month of monthsForSelectedYear) {
        const monthOption = document.createElement("div");
        monthOption.classList.add("month-option");
        monthOption.textContent = month;
        monthOption.dataset.month = month;
        monthSelector.appendChild(monthOption);
    }

}

function loadTransactionsPieChart(periodId1, periodId2, accountId) {
    const itemsForPeriod1 = getItemsForPeriodAndAccount(periodId1, accountId);
    const itemsForPeriod2 = getItemsForPeriodAndAccount(periodId2, accountId);

    if (itemsForPeriod1 != null) {
        renderPieChart('transactionsPieChartLeft', itemsForPeriod1, 'left');
    }
    if (itemsForPeriod1 == null || itemsForPeriod1.length == 0) {
        document.getElementById("graph-title-left").innerText = "Please add a transaction period";
        buttonRemoveComparisonLeft.style.display = "none";
    }
    if (itemsForPeriod2 != null) {
        renderPieChart('transactionsPieChartRight', itemsForPeriod2, 'right');
    }
    if (itemsForPeriod2 == null || itemsForPeriod2.length == 0) {
        document.getElementById("graph-title-right").innerText = "Please add a transaction period";
        buttonRemoveComparisonRight.style.display = "none";
    }
}

function getItemsForPeriodAndAccount(periodId, accountId) {
    const items = transactionItems.get(periodId) || [];
    return items.filter(item => item.accountId === accountId);
}

function groupByCategoryTotal(items) {
    return items.reduce((totals, item) => {
        totals[item.categoryLabel] = (totals[item.categoryLabel] || 0) + item.amount;
        return totals;
    }, {});
}

function renderPieChart(canvasId, items, side) {
    const grouped = groupByCategoryTotal(items);
    const sortedEntries = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
    const labels = sortedEntries.map(entry => entry[0]);
    const data = sortedEntries.map(entry => entry[1]);

    const ctx = document.getElementById(canvasId).getContext('2d');

    if (side === 'left' && transactionsPieChartLeft) {
        transactionsPieChartLeft.destroy();
    }
    if (side === 'right' && transactionsPieChartRight) {
        transactionsPieChartRight.destroy();
    }

    const chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{ data: data }]
        },
        options: { radius: '80%' }
    });

    if (side === 'left') {
        transactionsPieChartLeft = chart;
    } else {
        transactionsPieChartRight = chart;
    }
}

async function loadTransactionItems(accountId, periodIds = null) {
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
        if (!transactionItems.has(currentItem.periodId)) {
            transactionItems.set(currentItem.periodId, []);
        }
        transactionItems.get(currentItem.periodId).push(currentItem);
    }
}

async function getComparisonSelections(accountId) {
    let selectionItem = {};
    try {
        var response = await fetch("/ComparisonSelection/GetComparisonItemsForAccount?accountId=" + accountId);
    }  catch (error) {
       console.error("Error fetching comparison selections: ", error);
       return;
    }
    if (!response.ok) {
        console.error("Could not load transactions for account " + accountId + ". Status: " + response.status);
        return;
    }
    const comparisonSelections = await response.json();
    console.log("Comparison Selections: ", comparisonSelections);
    leftComparisonSelections = comparisonSelections.filter(item => item.selectionSide === 'left').sort((a, b) => a.selectionOrder - b.selectionOrder);
    rightComparisonSelections = comparisonSelections.filter(item => item.selectionSide === 'right').sort((a, b) => a.selectionOrder - b.selectionOrder);
    updatePreviewLabels("left", 0);
    updatePreviewLabels("right", 0);
}

function updatePreviewLabels(comparisonSide, currentOrder) {
    let previousItem, nextItem, currentItem;
    const graphTitle = document.querySelector(`#graph-title-${comparisonSide}`);
    const leftArrowContainer = document.querySelector(`#${comparisonSide}ChartPrevText`);
    const rightArrowContainer = document.querySelector(`#${comparisonSide}ChartNextText`);
    const leftArrowSelectContainer = document.querySelector(`#${comparisonSide}ChartPrevSelect`);
    const rightArrowSelectContainer = document.querySelector(`#${comparisonSide}ChartNextSelect`);
    const leftArrowText = document.querySelector(`#${comparisonSide}ChartPrevText .period-label`);
    const rightArrowText = document.querySelector(`#${comparisonSide}ChartNextText .period-label`);
    const currentSelections = comparisonSide === "left" ? leftComparisonSelections : rightComparisonSelections;
    if (currentSelections == null || currentSelections.length < 2) {
        if (currentSelections == null || currentSelections.length == 0) {
            graphTitle.innerText = "";
        } else {
            currentItem = currentSelections[currentOrder];
            graphTitle.innerText = monthOrder[currentItem.month - 1] + " " + currentItem.year;
        }
        leftArrowContainer.style.display = "none";
        rightArrowContainer.style.display = "none";
        leftArrowSelectContainer.style.display = "none";
        rightArrowSelectContainer.style.display = "none";
        return;
    }
    leftArrowContainer.style.display = "block";
    rightArrowContainer.style.display = "block";
    leftArrowSelectContainer.style.display = "block";
    rightArrowSelectContainer.style.display = "block";
    switch (currentOrder) {
        case 0:
            previousItem = currentSelections[currentSelections.length - 1];
            nextItem = currentSelections[currentOrder + 1];
            break;
        case currentSelections.length - 1:
            previousItem = currentSelections[currentOrder - 1];
            nextItem = currentSelections[0];
            break;
        default:
            previousItem = currentSelections[currentOrder - 1];
            nextItem = currentSelections[currentOrder + 1];
            break;
    }
    currentItem = currentSelections[currentOrder];
    graphTitle.innerText = monthOrder[currentItem.month - 1] + " " + currentItem.year;
    leftArrowText.innerText = monthOrder[previousItem.month - 1] + " " + previousItem.year;
    rightArrowText.innerText = monthOrder[nextItem.month - 1] + " " + nextItem.year;
}