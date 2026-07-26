let accountBudgetData;
let budgetPieChart;

window.onload = async function () {
    await loadBudgetForAccount(1);
    loadBudgetTable();
    loadBudgetPieChart();
}

async function loadBudgetForAccount(accountId) {
    var response = await fetch('/Budget/GetBudgetForAccount?accountId=' + accountId);
    if (!response.ok) {
        console.error("Could not load budget for account " + accountId + ". Status: " + response.status);
        return;
    }
    accountBudgetData = await response.json();
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
    for (let i = 0; i < accountBudgetData.length; i++) {
        let currRow = tableBody.insertRow(i + 1);
        let item = accountBudgetData[i];
        currRow.insertCell(0).outerHTML = '<td>' + item.description + '</td>';
        currRow.insertCell(1).outerHTML = '<td>' + item.category + '</td>';
        currRow.insertCell(2).outerHTML = '<td></td>';
        currRow.insertCell(3).outerHTML = '<td>' + item.amount + '</td>';
    }
}

async function updateBudgetForAccount() {
    let tableBody = document.querySelector('table');
    let rows = tableBody.rows;
    if (accountBudgetData.length > 0) {
        const deleteResponse = await fetch('/Budget/DeleteBudgetForAccount?accountId=' + 1, {
            method: 'POST'
        });

        if (!deleteResponse.ok) {
            console.error('Failed to delete budget items:', deleteResponse.statusText);
            return;
        }
    }

    accountBudgetData = [];

    for (var i = 1; i < rows.length; i++) {
        let row = rows[i];
        let description = getCellValue(row.cells[0]);
        let category = getCellValue(row.cells[1]);
        let amount = parseFloat(getCellValue(row.cells[3]));

        if (description && category) {
            accountBudgetData.push({
                accountId: 1,
                description: description,
                category: category,
                amount: amount
            });
        }
    }

    const saveResponse = await fetch('/Budget/SaveBudgetForAccount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(accountBudgetData)
    });

    if (!saveResponse.ok) {
        console.error("Could not save budget for account. Status: " + saveResponse.status);
        return;
    }

    var result = await saveResponse.json();

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
            labels: accountBudgetData.map(x => x.description),
            datasets: [{
                data: accountBudgetData.map(x => x.amount),
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