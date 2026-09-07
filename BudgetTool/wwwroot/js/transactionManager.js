const accountId = 1;
const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

let accountTransactionPeriods = [];
let transactionYears = [];

window.onload = async function () {
    showSpinner();    
    accountTransactionPeriods = await getTransactionPeriods(accountId);
    transactionYears = [...new Set(accountTransactionPeriods.map(period => period.year))];
    createTransactionSelectMenu();
    let yearPeriods = document.querySelectorAll('.selectPeriod');
    console.log("yearPeriods", yearPeriods);
    for (const yearPeriod of yearPeriods) {
        yearPeriod.click();
    }
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
