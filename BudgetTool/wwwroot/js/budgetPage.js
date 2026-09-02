/* TODO:
1. Add ability to delete budget item
2. Add ability to change category
3. When category is selected or already in use, remove from JS array so it can't be selected again
*/

let accountBudgetData;
let budgetPieChart;
let accountId = 1;

window.onload = async function () {
    showSpinner();
    await getCategoriesForAccount(1);
    await loadBudgetForAccount(accountId);
    loadBudgetTable();
    loadBudgetPieChart();
    hideSpinner();
    console.log("transactionCategories", transactionCategories);
    console.log
}

async function loadBudgetForAccount(accountId) {
    var response = await fetch('/Budget/GetBudgetItems?accountId=' + accountId);
    if (!response.ok) {
        console.error("Could not load budget for account " + accountId + ". Status: " + response.status);
        return;
    }
    accountBudgetData = await response.json();
    console.log("budget", accountBudgetData);
}

function loadBudgetTable() {
    let row = document.querySelectorAll('tr');
    if (typeof row !== undefined) {
        for (const currRow of row) {
            currRow.remove();
        }
    }

    let tableBody = document.querySelector('table');
    let headerRow = tableBody.insertRow(0);
    headerRow.insertCell(0).outerHTML = '<th scope="col">Description</th>';
    headerRow.insertCell(1).outerHTML = '<th scope="col">Type</th>';
    headerRow.insertCell(2).outerHTML = '<th scope="col">Income/Expense</th>';
    headerRow.insertCell(3).outerHTML = '<th scope="col">Amount</th>';
    headerRow.insertCell(4).outerHTML = '<th scope="col" style="display:none"></th>';
    for (let i = 0; i < accountBudgetData.length; i++) {
        let currRow = tableBody.insertRow(i + 1);
        let item = accountBudgetData[i];
        console.log("item", item);
        currRow.insertCell(0).outerHTML = '<td>' + item.budgetItemDescription + '</td>';
        currRow.insertCell(1).outerHTML = '<td>' + getCategorySelect(true) + '</td>';
        currRow.cells[1].querySelector('select').value = item.categoryId;
        currRow.insertCell(2).outerHTML = '<td>' + item.budgetItemType + '</td>';
        currRow.insertCell(3).outerHTML = '<td>' + item.budgetItemAmount + '</td>';
        currRow.insertCell(4).outerHTML = '<td style="display:none">' + item.budgetItemId + '</td>';
    }
}

async function updateBudgetForAccount() {
    showSpinner();
    let tableBody = document.querySelector('table');
    let rows = tableBody.rows;

    let updatedAccountBudgetData = [];

    for (var i = 1; i < rows.length; i++) {
        let row = rows[i];
        let description = getCellValue(row.cells[0], 'input');
        let category = parseInt(getCellValue(row.cells[1], 'select'));
        let type = getCellValue(row.cells[2], 'input');
        let amount = parseFloat(getCellValue(row.cells[3], 'input'));
        let id = parseInt(getCellValue(row.cells[4], 'input'));
        console.log("accountBudgetData", accountBudgetData);
        

        /* The description and category must be valid at least, and one of the values must have been changed */
        if (description && category) {
            let currentBudgetItem = accountBudgetData.find(item => item.budgetItemId == id);
            console.log("currentBudgetItem", currentBudgetItem, "id", id);

            if (currentBudgetItem == NaN || currentBudgetItem == undefined) {
                console.log("currentBudgetItem is undefined or NaN, adding new budget item");
                updatedAccountBudgetData.push({
                    budgetItemId: id,
                    accountId: accountId,
                    budgetItemType: type,
                    budgetItemDescription: description,
                    categoryId: category,
                    budgetItemAmount: amount
                });
            } else if (description != currentBudgetItem.budgetItemDescription ||
                          category != currentBudgetItem.categoryId ||
                amount != currentBudgetItem.budgetItemAmount) {
                console.log("currentBudgetItem has changed, adding to updatedAccountBudgetData");
                console.log("description", description, "currentBudgetItem.budgetItemDescription", currentBudgetItem.budgetItemDescription);
                console.log("category", category, "currentBudgetItem.categoryId", currentBudgetItem.categoryId);
                console.log("amount", amount, "currentBudgetItem.budgetItemAmount", currentBudgetItem.budgetItemAmount);
                let updateIndex = accountBudgetData.findIndex(item => item.budgetItemId === id);
                accountBudgetData.splice(updateIndex, 1);
                updatedAccountBudgetData.push({
                    budgetItemId: id,
                    accountId: accountId,
                    budgetItemType: type,
                    budgetItemDescription: description,
                    categoryId: category,
                    budgetItemAmount: amount
                });
            }
        } /* Now we have an array of budget items where one of the fields were changed */
    }
    console.log("updatedAccountBudgetData", updatedAccountBudgetData);
    if (updatedAccountBudgetData.length === 0) {
        return true; // nothing changed, nothing to save
    }

    try {
        const response = await fetch('/Budget/UpdateBudgetItems', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedAccountBudgetData)
        });
        console.log("JSON.stringify(updatedAccountBudgetData)", JSON.stringify(updatedAccountBudgetData));
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Server responded with error:", errorBody);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
    } catch (error) {
        console.error('Error sending data:', error);
        return false;
    }

    /* Now we need to merge the updated and current budget items together */
    for (let i = 0; i < updatedAccountBudgetData.length; i++) {
        const updatedItem = updatedAccountBudgetData[i];
        console.log("updatedItem", updatedItem);
        const index = accountBudgetData.findIndex(item => item.budgetItemId === updatedItem.budgetItemId);
        console.log("index", index, "accountBudgetData", accountBudgetData);
        if (index == -1) {
            accountBudgetData.push(updatedItem);
        }
    }

    console.log("accountBudgetData after merge", accountBudgetData);

    loadBudgetPieChart();
    hideSpinner();
}

function getCellValue(cell, elementType) {
    console.log("cell", cell);
    let textToReturn;
    const input = cell.querySelector(elementType);
    console.log("input", input, "VAL", cell.value);
    return input ? input.value : cell.innerText;
}

function loadBudgetPieChart() {
    const ctx = document.getElementById('budgetPieChart').getContext('2d');
    if (budgetPieChart) {
        budgetPieChart.destroy();
    }
    console.log("accountBudgetData", accountBudgetData);
    budgetPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: accountBudgetData.map(x => x.categoryLabel),
            datasets: [{
                data: accountBudgetData.map(x => x.budgetItemAmount),
            }]
        },
        options: {
            radius: '80%'
        }
    });
}

$(function () {

    // Start counting from the third row

    $("#insertRow").on("click", function (event) {
        event.preventDefault();

        var newRow = $("<tr>");
        var cols = '';

        // Table columns
        cols += '<td><input class="updateCell" type="text" name="description" placeholder="Description"></td>';
        cols += '<td>' + getCategorySelect() + '</td>';
        cols += '<td><input class="updateCell" type="text" name="income_expense" placeholder="Income/Expense"></td>';
        cols += '<td><input class="updateCell" type="text" name="amount" placeholder="Amount"></td>';
        cols += '<td><button class="btn btn-danger rounded-0" id ="deleteRow"><i class="fa fa-trash"></i></button</td>';

        // Insert the columns inside a row
        newRow.append(cols);

        // Insert the row inside a table
        $("table").append(newRow);

        const tableContainer = document.getElementById('tableContainer');
        tableContainer.scrollTop = tableContainer.scrollHeight;
    });

    // Remove row when delete btn is clicked
    $("table").on("click", "#deleteRow", function (event) {
        $(this).closest("tr").remove();
        counter -= 1
    });
});

function enableTableCells() {
    document.querySelectorAll('td').forEach(td => {
        td.contentEditable = 'true';
        td.classList.add("updateCell");
    });
}

function disableTableCells() {
    document.querySelectorAll('td').forEach(td => {
        td.contentEditable = 'false';
        td.classList.remove("updateCell");
    });
    loadBudgetTable();
}