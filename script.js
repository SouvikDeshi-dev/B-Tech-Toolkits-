"use strict";

/* =========================================================
   BTECH TOOLKIT PRO
   ========================================================= */


/* ================= PAGE NAVIGATION ================= */

const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navButtons.forEach(button => {

    button.addEventListener("click", () => {

        const pageId = button.dataset.page;

        navButtons.forEach(btn => btn.classList.remove("active"));
        pages.forEach(page => page.classList.remove("active"));

        button.classList.add("active");

        const page = document.getElementById(pageId);

        if (page) {
            page.classList.add("active");
        }
    });

});


/* ================= DARK MODE ================= */

const themeBtn = document.getElementById("themeBtn");

const savedTheme = localStorage.getItem("btech-theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀️";
}

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const dark = document.body.classList.contains("dark");

    themeBtn.textContent = dark ? "☀️" : "🌙";

    localStorage.setItem(
        "btech-theme",
        dark ? "dark" : "light"
    );
});


/* =========================================================
   SCIENTIFIC CALCULATOR
   ========================================================= */

const display = document.getElementById("display");
const historyDisplay = document.getElementById("historyDisplay");
const angleBtn = document.getElementById("angleBtn");

let angleMode = "DEG";
let lastAnswer = 0;


/* Prevent physical keyboard from opening calculator input */
display.addEventListener("keydown", event => {
    event.preventDefault();
});


/* ANGLE MODE */

angleBtn.addEventListener("click", () => {

    angleMode = angleMode === "DEG" ? "RAD" : "DEG";

    angleBtn.textContent = angleMode;

    const badge = document.querySelector(".badge");

    if (badge) {
        badge.textContent = angleMode;
    }
});


/* BUTTONS */

document.querySelectorAll(".calc-grid button, .calc-tools button")
    .forEach(button => {

        button.addEventListener("click", () => {

            const value = button.dataset.value;
            const action = button.dataset.action;

            if (value !== undefined) {
                appendCalculatorValue(value);
                return;
            }

            if (action === "clear") {
                clearCalculator();
                return;
            }

            if (action === "backspace") {
                backspace();
                return;
            }

            if (action === "equals") {
                calculate();
                return;
            }

            if (action === "ans") {
                appendCalculatorValue(String(lastAnswer));
            }

        });

    });


function appendCalculatorValue(value) {

    if (display.value === "Error") {
        display.value = "";
    }

    display.value += value;
}


function clearCalculator() {

    display.value = "";
    historyDisplay.textContent = "";
}


function backspace() {

    display.value = display.value.slice(0, -1);
}


/* =========================================================
   CALCULATOR ENGINE
   ========================================================= */

function factorial(n) {

    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        throw new Error("Invalid factorial");
    }

    if (n > 170) {
        throw new Error("Number too large");
    }

    let result = 1;

    for (let i = 2; i <= n; i++) {
        result *= i;
    }

    return result;
}


function toRadians(x) {
    return angleMode === "DEG"
        ? x * Math.PI / 180
        : x;
}


function fromRadians(x) {
    return angleMode === "DEG"
        ? x * 180 / Math.PI
        : x;
}


function prepareExpression(expression) {

    let exp = expression;

    /* Constants */

    exp = exp.replace(/π/g, "PI");

    /*
       Add multiplication where appropriate:
       2π -> 2*PI
       2( -> 2*(
       )( -> )*(
       2sin -> 2*sin
    */

    exp = exp.replace(/(\d|\))(?=(PI|E|\())/g, "$1*");

    exp = exp.replace(/(PI|E|\))(?=\d)/g, "$1*");

    /* Percentage */

    exp = exp.replace(
        /(\d+(?:\.\d+)?)%/g,
        "($1/100)"
    );

    /* Factorials */

    let previous;

    do {

        previous = exp;

        exp = exp.replace(
            /(\d+(?:\.\d+)?|\([^()]*\))!/g,
            "fact($1)"
        );

    } while (exp !== previous);


    /* Power */

    exp = exp.replace(/\^/g, "**");

    /* Functions */

    exp = exp.replace(/sqrt\(/g, "sqrt(");
    exp = exp.replace(/log\(/g, "log10(");
    exp = exp.replace(/ln\(/g, "ln(");

    exp = exp.replace(/sin\(/g, "sin(");
    exp = exp.replace(/cos\(/g, "cos(");
    exp = exp.replace(/tan\(/g, "tan(");

    exp = exp.replace(/asin\(/g, "asin(");
    exp = exp.replace(/acos\(/g, "acos(");
    exp = exp.replace(/atan\(/g, "atan(");

    /* Reciprocal */

    exp = exp.replace(
        /1\/(\d+(?:\.\d+)?)/g,
        "(1/$1)"
    );

    return exp;
}


function calculate() {

    const original = display.value.trim();

    if (!original) {
        return;
    }

    try {

        const expression = prepareExpression(original);

        /*
          Only allow mathematical characters/functions.
          This prevents arbitrary JavaScript execution.
        */

        const safePattern =
            /^[0-9+\-*/().,\sA-Za-z_]*$/;

        if (!safePattern.test(expression)) {
            throw new Error("Invalid expression");
        }

        const sin = x => Math.sin(toRadians(x));
        const cos = x => Math.cos(toRadians(x));
        const tan = x => Math.tan(toRadians(x));

        const asin = x => fromRadians(Math.asin(x));
        const acos = x => fromRadians(Math.acos(x));
        const atan = x => fromRadians(Math.atan(x));

        const sqrt = x => Math.sqrt(x);
        const log10 = x => Math.log10(x);
        const ln = x => Math.log(x);

        const PI = Math.PI;
        const E = Math.E;

        const fact = factorial;

        /*
          Function is used only after the expression has
          passed the character/function whitelist.
        */

        const result = Function(
            "sin",
            "cos",
            "tan",
            "asin",
            "acos",
            "atan",
            "sqrt",
            "log10",
            "ln",
            "PI",
            "E",
            "fact",
            `"use strict"; return (${expression});`
        )(
            sin,
            cos,
            tan,
            asin,
            acos,
            atan,
            sqrt,
            log10,
            ln,
            PI,
            E,
            fact
        );

        if (!Number.isFinite(result)) {
            throw new Error("Math error");
        }

        lastAnswer = result;

        historyDisplay.textContent =
            original + " =";

        display.value = formatNumber(result);

    } catch (error) {

        historyDisplay.textContent =
            "Invalid expression";

        display.value = "Error";

    }
}


function formatNumber(number) {

    if (Object.is(number, -0)) {
        number = 0;
    }

    if (Math.abs(number) >= 1e12 ||
        (Math.abs(number) > 0 && Math.abs(number) < 1e-9)) {

        return number.toExponential(8);
    }

    return Number(
        number.toPrecision(12)
    ).toString();
}


/* Keyboard calculator support */

document.addEventListener("keydown", event => {

    const calculatorPage =
        document.getElementById("calculator");

    if (!calculatorPage.classList.contains("active")) {
        return;
    }

    const allowed =
        "0123456789+-*/().%^";

    if (allowed.includes(event.key)) {

        event.preventDefault();

        appendCalculatorValue(event.key);
    }

    if (event.key === "Enter") {
        event.preventDefault();
        calculate();
    }

    if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
    }

    if (event.key === "Escape") {
        event.preventDefault();
        clearCalculator();
    }

});


/* =========================================================
   FORMULA LIBRARY
   ========================================================= */

const formulas = [

    {
        category: "electrical",
        title: "Ohm's Law",
        formula: "V = I × R",
        description: "Voltage = Current × Resistance"
    },

    {
        category: "electrical",
        title: "Electrical Power",
        formula: "P = VI = I²R = V²/R",
        description: "Power consumed by a resistive circuit"
    },

    {
        category: "electrical",
        title: "Electrical Energy",
        formula: "E = Pt",
        description: "Energy = Power × Time"
    },

    {
        category: "electrical",
        title: "Series Resistance",
        formula: "Rₜ = R₁ + R₂ + ...",
        description: "Equivalent resistance in series"
    },

    {
        category: "electrical",
        title: "Parallel Resistance",
        formula: "1/Rₜ = 1/R₁ + 1/R₂ + ...",
        description: "Equivalent resistance in parallel"
    },

    {
        category: "electrical",
        title: "Kirchhoff Current Law",
        formula: "ΣI = 0",
        description: "Algebraic sum of currents at a node"
    },

    {
        category: "electrical",
        title: "Kirchhoff Voltage Law",
        formula: "ΣV = 0",
        description: "Algebraic sum of voltages around a closed loop"
    },

    {
        category: "ac",
        title: "RMS Voltage",
        formula: "Vᵣₘₛ = Vₘ/√2",
        description: "RMS value of a sinusoidal voltage"
    },

    {
        category: "ac",
        title: "Inductive Reactance",
        formula: "Xᴸ = 2πfL",
        description: "Reactance of an inductor"
    },

    {
        category: "ac",
        title: "Capacitive Reactance",
        formula: "Xᶜ = 1/(2πfC)",
        description: "Reactance of a capacitor"
    },

    {
        category: "ac",
        title: "Impedance",
        formula: "Z = √(R² + X²)",
        description: "Magnitude of impedance in a simple AC circuit"
    },

    {
        category: "ac",
        title: "Power Factor",
        formula: "PF = cosφ = P/S",
        description: "Ratio of active power to apparent power"
    },

    {
        category: "ac",
        title: "Apparent Power",
        formula: "S = VI",
        description: "Apparent power in VA"
    },

    {
        category: "ac",
        title: "Three Phase Power",
        formula: "P = √3 Vᴸ Iᴸ cosφ",
        description: "Balanced three-phase active power"
    },

    {
        category: "machines",
        title: "Transformer EMF",
        formula: "E = 4.44 f N Φₘ",
        description: "RMS induced EMF of a transformer winding"
    },

    {
        category: "machines",
        title: "Transformer Turns Ratio",
        formula: "V₁/V₂ = N₁/N₂",
        description: "Ideal transformer voltage ratio"
    },

    {
        category: "machines",
        title: "Synchronous Speed",
        formula: "Nₛ = 120f/P",
        description: "Synchronous speed in RPM"
    },

    {
        category: "machines",
        title: "Slip",
        formula: "s = (Nₛ − N)/Nₛ",
        description: "Slip of an induction motor"
    },

    {
        category: "machines",
        title: "DC Motor Back EMF",
        formula: "Eᵦ = V − IₐRₐ",
        description: "Back EMF equation of a DC motor"
    },

    {
        category: "electronics",
        title: "Diode Equation",
        formula: "I = Iₛ(e^(V/ηVₜ) − 1)",
        description: "Idealized diode current equation"
    },

    {
        category: "electronics",
        title: "Capacitor Energy",
        formula: "E = ½CV²",
        description: "Energy stored in a capacitor"
    },

    {
        category: "electronics",
        title: "Inductor Energy",
        formula: "E = ½LI²",
        description: "Energy stored in an inductor"
    },

    {
        category: "electronics",
        title: "RC Time Constant",
        formula: "τ = RC",
        description: "Time constant of an RC circuit"
    },

    {
        category: "math",
        title: "Quadratic Equation",
        formula: "x = (−b ± √(b²−4ac))/2a",
        description: "Roots of ax² + bx + c = 0"
    },

    {
        category: "math",
        title: "Derivative",
        formula: "d(xⁿ)/dx = nxⁿ⁻¹",
        description: "Basic power rule"
    },

    {
        category: "math",
        title: "Integral",
        formula: "∫xⁿdx = xⁿ⁺¹/(n+1) + C",
        description: "For n ≠ −1"
    },

    {
        category: "math",
        title: "Pythagorean Identity",
        formula: "sin²θ + cos²θ = 1",
        description: "Fundamental trigonometric identity"
    }

];


const formulaContainer =
    document.getElementById("formulaContainer");

const formulaSearch =
    document.getElementById("formulaSearch");

let selectedCategory = "all";


function renderFormulas() {

    const search =
        formulaSearch.value.toLowerCase().trim();

    const filtered = formulas.filter(item => {

        const categoryMatch =
            selectedCategory === "all" ||
            item.category === selectedCategory;

        const text =
            `${item.title} ${item.formula} ${item.description}`
            .toLowerCase();

        const searchMatch =
            text.includes(search);

        return categoryMatch && searchMatch;

    });


    if (filtered.length === 0) {

        formulaContainer.innerHTML = `
            <div class="card">
                <p>No formula found.</p>
            </div>
        `;

        return;
    }


    formulaContainer.innerHTML =
        filtered.map(item => `

            <article class="formula-card">

                <h3>${escapeHTML(item.title)}</h3>

                <div class="formula">
                    ${escapeHTML(item.formula)}
                </div>

                <p>
                    ${escapeHTML(item.description)}
                </p>

            </article>

        `).join("");

}


document.querySelectorAll(".formula-filter")
    .forEach(button => {

        button.addEventListener("click", () => {

            document.querySelectorAll(".formula-filter")
                .forEach(btn =>
                    btn.classList.remove("active")
                );

            button.classList.add("active");

            selectedCategory =
                button.dataset.category;

            renderFormulas();

        });

    });


formulaSearch.addEventListener(
    "input",
    renderFormulas
);


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


renderFormulas();


/* =========================================================
   CGPA CALCULATOR
   ========================================================= */

let semesters =
    JSON.parse(
        localStorage.getItem("btech-semesters") || "[]"
    );

const semTable =
    document.getElementById("semTable");

function renderSemesters() {

    semTable.innerHTML = "";

    semesters.forEach((semester, index) => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(semester.name)}</td>
            <td>${semester.sgpa.toFixed(2)}</td>
            <td>${semester.credits}</td>
            <td>
                <button class="remove-sem"
                        data-index="${index}">
                    ✕
                </button>
            </td>
        `;

        semTable.appendChild(row);
    });


    document
        .querySelectorAll(".remove-sem")
        .forEach(button => {

            button.addEventListener("click", () => {

                const index =
                    Number(button.dataset.index);

                semesters.splice(index, 1);

                saveSemesters();
                renderSemesters();

            });

        });


    calculateCGPA();
}


function calculateCGPA() {

    let totalPoints = 0;
    let totalCredits = 0;

    semesters.forEach(semester => {

        totalPoints +=
            semester.sgpa * semester.credits;

        totalCredits +=
            semester.credits;

    });


    const cgpa =
        totalCredits === 0
            ? 0
            : totalPoints / totalCredits;

    document.getElementById("cgpaResult")
        .textContent = cgpa.toFixed(2);
}


function saveSemesters() {

    localStorage.setItem(
        "btech-semesters",
        JSON.stringify(semesters)
    );
}


document.getElementById("addSem")
    .addEventListener("click", () => {

        const name =
            document.getElementById("semName")
                .value.trim();

        const sgpa =
            Number(
                document.getElementById("sgpa").value
            );

        const credits =
            Number(
                document.getElementById("credits").value
            );


        if (!name) {
            alert("Enter semester name.");
            return;
        }

        if (!Number.isFinite(sgpa) ||
            sgpa < 0 ||
            sgpa > 10) {

            alert("SGPA must be between 0 and 10.");
            return;
        }

        if (!Number.isFinite(credits) ||
            credits <= 0) {

            alert("Enter valid credits.");
            return;
        }


        semesters.push({
            name,
            sgpa,
            credits
        });

        saveSemesters();
        renderSemesters();


        document.getElementById("semName").value = "";
        document.getElementById("sgpa").value = "";
        document.getElementById("credits").value = "";

    });


document.getElementById("clearCgpa")
    .addEventListener("click", () => {

        if (!semesters.length) {
            return;
        }

        semesters = [];

        saveSemesters();
        renderSemesters();

    });


renderSemesters();


/* =========================================================
   ATTENDANCE CALCULATOR
   ========================================================= */

document.getElementById("calculateAttendance")
    .addEventListener("click", calculateAttendance);


function calculateAttendance() {

    const total =
        Number(
            document.getElementById("totalClasses").value
        );

    const attended =
        Number(
            document.getElementById("attendedClasses").value
        );

    const required =
        Number(
            document.getElementById("requiredAttendance").value
        );

    const future =
        Number(
            document.getElementById("futureClasses").value
        );


    if (
        !Number.isFinite(total) ||
        !Number.isFinite(attended) ||
        total <= 0 ||
        attended < 0 ||
        attended > total
    ) {

        alert("Enter valid class numbers.");
        return;
    }


    if (
        !Number.isFinite(required) ||
        required < 0 ||
        required > 100
    ) {

        alert("Required attendance must be 0–100%.");
        return;
    }


    if (
        !Number.isFinite(future) ||
        future < 0
    ) {

        alert("Enter valid future classes.");
        return;
    }


    const current =
        attended / total * 100;


    /*
      Number of additional consecutive classes needed
      to reach the required percentage.

      (attended + x)/(total + x) >= target/100
    */

    let needed = 0;

    if (current < required) {

        if (required >= 100) {

            needed = Infinity;

        } else {

            needed = Math.ceil(
                (required * total - 100 * attended) /
                (100 - required)
            );

        }

    }


    const maximumFutureAttendance =
        (attended + future) /
        (total + future) *
        100;


    const canReach =
        current >= required ||
        maximumFutureAttendance >= required;


    document.getElementById("attendancePercent")
        .textContent =
        current.toFixed(2) + "%";


    document.getElementById("classesNeeded")
        .textContent =
        needed === Infinity
            ? "∞"
            : needed;


    const status =
        document.getElementById("attendanceStatus");

    if (current >= required) {

        status.textContent = "Already Eligible";
        status.style.color = "var(--success)";

    } else if (canReach) {

        status.textContent = "Yes";
        status.style.color = "var(--success)";

    } else {

        status.textContent = "No";
        status.style.color = "var(--danger)";
    }

}


/* =========================================================
   STUDY PLANNER
   ========================================================= */

let tasks =
    JSON.parse(
        localStorage.getItem("btech-tasks") || "[]"
    );


const taskList =
    document.getElementById("taskList");


function saveTasks() {

    localStorage.setItem(
        "btech-tasks",
        JSON.stringify(tasks)
    );

}


function renderTasks() {

    taskList.innerHTML = "";

    if (tasks.length === 0) {

        taskList.innerHTML = `
            <div class="result-box">
                <span>No tasks added yet.</span>
            </div>
        `;

        updateProgress();
        return;
    }


    tasks.forEach((task, index) => {

        const taskElement =
            document.createElement("div");

        taskElement.className =
            "task" + (task.done ? " done" : "");


        taskElement.innerHTML = `

            <input
                type="checkbox"
                class="task-check"
                data-index="${index}"
                ${task.done ? "checked" : ""}
            >

            <div class="task-info">

                <div class="task-title">
                    ${escapeHTML(task.title)}
                </div>

                <div class="task-meta">
                    ${escapeHTML(task.subject)}
                    • ${escapeHTML(task.date)}
                    • ${task.duration} min
                </div>

            </div>

            <button
                class="delete-task"
                data-index="${index}">
                🗑️
            </button>

        `;

        taskList.appendChild(taskElement);

    });


    document
        .querySelectorAll(".task-check")
        .forEach(check => {

            check.addEventListener("change", () => {

                const index =
                    Number(check.dataset.index);

                tasks[index].done =
                    check.checked;

                saveTasks();
                renderTasks();

            });

        });


    document
        .querySelectorAll(".delete-task")
        .forEach(button => {

            button.addEventListener("click", () => {

                const index =
                    Number(button.dataset.index);

                tasks.splice(index, 1);

                saveTasks();
                renderTasks();

            });

        });


    updateProgress();

}


function updateProgress() {

    const total = tasks.length;

    const completed =
        tasks.filter(task => task.done).length;

    const percentage =
        total === 0
            ? 0
            : Math.round(
                completed / total * 100
            );


    document.getElementById("progressText")
        .textContent = percentage + "%";

    document.getElementById("progressFill")
        .style.width = percentage + "%";
}


document.getElementById("addTask")
    .addEventListener("click", () => {

        const title =
            document.getElementById("taskInput")
                .value.trim();

        const subject =
            document.getElementById("subjectInput")
                .value;

        const date =
            document.getElementById("dateInput")
                .value;

        const duration =
            Number(
                document.getElementById("durationInput")
                    .value
            );


        if (!title) {
            alert("Enter a study task.");
            return;
        }

        if (!date) {
            alert("Select a date.");
            return;
        }

        if (!Number.isFinite(duration) ||
            duration <= 0) {

            alert("Enter valid study duration.");
            return;
        }


        tasks.push({
            title,
            subject,
            date,
            duration,
            done: false
        });


        saveTasks();
        renderTasks();


        document.getElementById("taskInput").value = "";
        document.getElementById("durationInput").value = "";

    });


document.getElementById("clearTasks")
    .addEventListener("click", () => {

        tasks =
            tasks.filter(task => !task.done);

        saveTasks();
        renderTasks();

    });


/* Set today's date */

const today =
    new Date().toISOString().split("T")[0];

document.getElementById("dateInput")
    .value = today;


/* Initial planner render */

renderTasks();
