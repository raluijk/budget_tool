let accountBudgetData;
let budgetPieChart;
let accountId = 1;

window.onload = async function () {
    showSpinner();
    await loadBudgetForAccount(accountId);
    loadBudgetTable();
    loadBudgetPieChart();
    hideSpinner();
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
    console.log("tableBody", tableBody);
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
        currRow.insertCell(1).outerHTML = '<td>' + item.categoryLabel + '</td>';
        currRow.insertCell(2).outerHTML = '<td>' + item.budgetItemType + '</td>';
        currRow.insertCell(3).outerHTML = '<td>' + item.budgetItemAmount + '</td>';
        currRow.insertCell(4).outerHTML = '<td style="display:none">' + item.budgetItemId + '</td>';
    }
}

async function updateBudgetForAccount() {
    let tableBody = document.querySelector('table');
    let rows = tableBody.rows;

    let updatedAccountBudgetData = [];

    for (var i = 1; i < rows.length; i++) {
        let row = rows[i];
        let description = getCellValue(row.cells[0]);
        let category = getCellValue(row.cells[1]);
        let amount = parseFloat(getCellValue(row.cells[3]));
        let id = parseInt(getCellValue(row.cells[4]));

        let currentBudgetItem = accountBudgetData.find(item => item.budgetItemId == id);

        /* The description and category must be valid at least, and one of the values must have been changed */
        if ((description && category) &&
            (description != currentBudgetItem.budgetItemDescription ||
                category != currentBudgetItem.categoryId ||
                  amount != currentBudgetItem.budgetItemAmount)) {
            updatedAccountBudgetData.push({
                budgetItemId: id,
                accountId: accountId,
                description: description,
                category: category,
                amount: amount
            });
        } /* Now we have an array of budget items where one of the fields were changed */
    }

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
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
    } catch (error) {
        console.error('Error sending data:', error);
        return false;
    }

    /* Now we need to merge the updated and current budget items together */
    for (const updatedItem in updatedAccountBudgetData) {
        const index = accountBudgetData.findIndex(item => item.budgetItemId === updatedItem.budgetItemId);
        if (index !== 0) {
            accountBudgetData[index] = { ...accountBudgetData[index], ...updatedItem };
        }
    }

    budgetPieChart.data.labels = accountBudgetData.map(x => x.description);
    budgetPieChart.data.datasets[0].data = accountBudgetData.map(x => x.amount);
    budgetPieChart.update();
}

function getCellValue(cell) {
    const input = cell.querySelector('input');
    return input ? input.value : cell.innerText;
}

function loadBudgetPieChart() {
    const ctx = document.getElementById('budgetPieChart').getContext('2d');
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
        cols += '<td><input class="form-control rounded-0" type="text" name="description" placeholder="Description"></td>';
        cols += '<td><input class="form-control rounded-0" type="text" name="category" placeholder="Category"></td>';
        cols += '<td><input class="form-control rounded-0" type="text" name="income_expense" placeholder="Income/Expense"></td>';
        cols += '<td><input class="form-control rounded-0" type="text" name="amount" placeholder="Amount"></td>';
        cols += '<td><button class="btn btn-danger rounded-0" id ="deleteRow"><i class="fa fa-trash"></i></button</td>';

        // Insert the columns inside a row
        newRow.append(cols);

        // Insert the row inside a table
        $("table").append(newRow);
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
    });
}

function disableTableCells() {
    document.querySelectorAll('td').forEach(td => {
        td.contentEditable = 'false';
    });
    loadBudgetTable();
}