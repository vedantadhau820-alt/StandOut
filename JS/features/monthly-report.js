/* =========================================================
   MONTHLY REPORT — MISSION TYPE PERFORMANCE
========================================================= */

function getMonthMetrics(year, month) {
    const calculate = window.StandOutCore?.missionHistory?.calculateMonthMetrics ||
        window.calculateMonthMetrics;

    if (typeof calculate !== "function") {
        return { completed: 0, missed: 0, activeDays: 0, improvementPoints: 0, consistency: 0 };
    }

    return calculate(year, month);
}

function resolveReportMonth(year, month) {
    const now = new Date();
    return {
        year: Number.isInteger(year) ? year : now.getFullYear(),
        month: Number.isInteger(month) ? month : now.getMonth()
    };
}


function calculateMissionTypePerformance(year, month) {

    const monthPrefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    const result = {
        hardcore: 0,
        recurring: 0,
        oneTime: 0
    };

    Object.keys(window.missionHistory)
        .filter(date =>
            date.startsWith(monthPrefix)
        )
        .forEach(date => {

            const day =
                window.missionHistory[date];

            const events =
                Array.isArray(day.events)
                    ? day.events
                    : [];

            events.forEach(event => {

                if (event.type === "hardcore") {
                    result.hardcore++;
                }

                else if (
                    event.type === "recurring"
                ) {
                    result.recurring++;
                }

                else if (event.type === "one-time") {
                    result.oneTime++;
                }

            });

        });

    return result;
}
/* =========================================================
   MONTHLY REPORT — DAILY CONSISTENCY DATA
========================================================= */

function calculateDailyConsistency(year, month) {

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();



    const result = [];

    for (let day = 1; day <= daysInMonth; day++) {

        const dateKey =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const dayData =
            window.missionHistory[dateKey];

        const completed =
            Number(dayData?.completed) || 0;

        const missed =
            Number(dayData?.missed) || 0;

        const total =
            completed + missed;

        const consistency =
            total > 0
                ? Math.round(
                    (completed / total) * 100
                )
                : null;

        result.push({
            day,
            date: dateKey,
            completed,
            missed,
            consistency
        });
    }

    return result;
}

/* =========================================================
   MONTHLY REPORT — MISSION PERFORMANCE
========================================================= */

function calculateMissionPerformance(year, month) {

    const monthPrefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    const performance = {
        completed: 0,
        missed: 0,
        total: 0,
        completionRate: 0
    };

    Object.keys(window.missionHistory)
        .filter(date => date.startsWith(monthPrefix))
        .forEach(date => {

            const day =
                window.missionHistory[date];

            performance.completed +=
                Number(day.completed) || 0;

            performance.missed +=
                Number(day.missed) || 0;
        });


    performance.total =
        performance.completed +
        performance.missed;


    if (performance.total > 0) {

        performance.completionRate =
            Math.round(
                (
                    performance.completed /
                    performance.total
                ) * 100
            );

    }


    return performance;
}
/* =========================================================
   MONTHLY REPORT — MONTH OVERVIEW
========================================================= */


function renderMonthlyReport(selectedYear, selectedMonth) {

    const now = new Date();

    // Default to the current month on first load.
    const year = selectedYear ?? now.getFullYear();
    const month = selectedMonth ?? now.getMonth();

    const metrics = getMonthMetrics(year, month);

    const monthName = new Date(year, month, 1)
        .toLocaleDateString([], {
            month: "long",
            year: "numeric"
        });

    // Update the displayed month title.
    const titleElement = document.getElementById("monthlySummaryTitle");
    if (titleElement) {
        titleElement.textContent = monthName;
    }

    // Update the summary metrics.
    const consistencyElement = document.getElementById("monthlyConsistency");
    const completedElement = document.getElementById("monthlyCompleted");
    const missedElement = document.getElementById("monthlyMissed");
    const activeDaysElement = document.getElementById("monthlyActiveDays");
    const pointsElement = document.getElementById("monthlyImprovementPoints");

    if (consistencyElement) consistencyElement.textContent = `${metrics.consistency}%`;
    if (completedElement) completedElement.textContent = metrics.completed;
    if (missedElement) missedElement.textContent = metrics.missed;
    if (activeDaysElement) activeDaysElement.textContent = metrics.activeDays;
    if (pointsElement) pointsElement.textContent = metrics.improvementPoints;

    // Keep every existing report section in sync with the selected month.
    renderMonthlyActivityCalendar(year, month);
    renderMonthlyConsistencyChart(year, month);
    renderMonthlyMissionPerformance(year, month);
    renderMonthlyMomentum(year, month);
    renderMonthlyMomentumChart(year, month);
    renderMonthlyGoalsProgress(year, month);
    renderMonthlyInsights(year, month);
    renderMonthlySummary(year, month);
    renderMonthlyDailyChallenges(year, month);

    // Keep the dropdown synchronized with the displayed report.
    const monthSelect = document.getElementById("monthlyReportMonthSelect");
    if (monthSelect) {
        const selectedValue = `${year}-${String(month + 1).padStart(2, "0")}`;
        if (monthSelect.value !== selectedValue) {
            monthSelect.value = selectedValue;
        }
    }
}

/* =========================================================
   MONTHLY REPORT — MONTH SELECTOR & NAVIGATION
========================================================= */

function initializeMonthlyReportSelector() {
    const monthSelect = document.getElementById("monthlyReportMonthSelect");
    const previousButton = document.getElementById("previousReportMonth");
    const nextButton = document.getElementById("nextReportMonth");

    if (!monthSelect) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Find the earliest month recorded in mission history.
    const historyDates = Object.keys(window.missionHistory || {})
        .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
        .sort();

    let firstYear = currentYear;
    let firstMonth = currentMonth;

    if (historyDates.length > 0) {
        const [year, month] = historyDates[0].split("-").map(Number);
        firstYear = year;
        firstMonth = month - 1;
    }

    // Build options from the earliest recorded month to the current month.
    monthSelect.replaceChildren();

    for (
        let date = new Date(firstYear, firstMonth, 1);
        date <= new Date(currentYear, currentMonth, 1);
        date.setMonth(date.getMonth() + 1)
    ) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const option = document.createElement("option");

        option.value = `${year}-${String(month + 1).padStart(2, "0")}`;
        option.textContent = date.toLocaleDateString([], {
            month: "long",
            year: "numeric"
        });

        monthSelect.appendChild(option);
    }

    function showSelectedMonth() {
        const [year, month] = monthSelect.value.split("-").map(Number);

        if (Number.isInteger(year) && Number.isInteger(month)) {
            renderMonthlyReport(year, month - 1);
        }

        updateNavigationButtons();
    }

    function updateNavigationButtons() {
        const selectedIndex = monthSelect.selectedIndex;

        if (previousButton) {
            previousButton.disabled = selectedIndex <= 0;
        }

        if (nextButton) {
            nextButton.disabled =
                selectedIndex === -1 ||
                selectedIndex >= monthSelect.options.length - 1;
        }
    }

    monthSelect.addEventListener("change", showSelectedMonth);

    if (previousButton) {
        previousButton.addEventListener("click", () => {
            if (monthSelect.selectedIndex > 0) {
                monthSelect.selectedIndex--;
                showSelectedMonth();
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            if (monthSelect.selectedIndex < monthSelect.options.length - 1) {
                monthSelect.selectedIndex++;
                showSelectedMonth();
            }
        });
    }

    // Open the current month by default.
    monthSelect.value =
        `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

    updateNavigationButtons();
    renderMonthlyReport(currentYear, currentMonth);
}

function getMonthlyMomentumHistory(year, month) {

    const history = window.Momentum.getHistory();

    const prefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    return Object.entries(history)
        .filter(([date]) =>
            date.startsWith(prefix)
        )
        .map(([date, data]) => ({
            date: date,
            momentum: Number(data.momentum) || 0
        }))
        .sort((a, b) =>
            a.date.localeCompare(b.date)
        );
}

function generateMonthlyInsights(year, month) {

    const metrics =
        getMonthMetrics(year, month);

    const performance =
        calculateMissionPerformance(year, month);

    const goals =
        calculateMonthlyGoalMetrics(year, month);

    const insights = [];


    /* =========================
       MISSION PERFORMANCE
    ========================= */

    if (performance.total > 0) {

        if (performance.completionRate >= 80) {

            insights.push({
                type: "positive",
                title: "Strong execution",
                text:
                    `You completed ${performance.completionRate}% of your recorded missions.`
            });

        } else if (
            performance.completionRate >= 50
        ) {

            insights.push({
                type: "neutral",
                title: "Decent execution",
                text:
                    `You completed ${performance.completionRate}% of your recorded missions.`
            });

        } else {

            insights.push({
                type: "warning",
                title: "Execution gap",
                text:
                    `You completed ${performance.completionRate}% of your recorded missions.`
            });

        }

    }


    /* =========================
       CONSISTENCY
    ========================= */

    if (metrics.consistency >= 80) {

        insights.push({
            type: "positive",
            title: "Highly consistent",
            text:
                `Your monthly consistency reached ${metrics.consistency}%.`
        });

    } else if (
        metrics.consistency >= 50
    ) {

        insights.push({
            type: "neutral",
            title: "Room to improve consistency",
            text:
                `Your monthly consistency was ${metrics.consistency}%.`
        });

    } else {

        insights.push({
            type: "warning",
            title: "Consistency needs attention",
            text:
                `Your monthly consistency was ${metrics.consistency}%.`
        });

    }


    /* =========================
       GOALS
    ========================= */

    if (goals.total > 0) {

        if (goals.completionRate === 100) {

            insights.push({
                type: "positive",
                title: "Goals completed",
                text:
                    `You completed all ${goals.total} of your monthly goals.`
            });

        } else {

            insights.push({
                type: "neutral",
                title: "Goal progress",
                text:
                    `You completed ${goals.completed} of ${goals.total} goals.`
            });

        }

    }


    /* =========================
       MOMENTUM
    ========================= */

    if (
        metrics.activeDays > 0 &&
        metrics.momentum !== undefined
    ) {

        insights.push({
            type: "positive",
            title: "Momentum built",
            text:
                `Your current Momentum is ${metrics.momentum}.`
        });

    }


    return insights;
}

/* =========================================================
   MONTHLY REPORT — MOMENTUM METRICS
========================================================= */

function calculateMonthlyMomentum(year, month) {

    const prefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    const history =
        window.Momentum.getHistory();

    const entries =
        Object.entries(history)
            .filter(([date]) =>
                date.startsWith(prefix)
            )
            .sort(
                ([a], [b]) =>
                    a.localeCompare(b)
            );


    const result = {
        started: 0,
        peak: 0,
        ended: 0,
        longest: 0,
        history: []
    };


    if (entries.length === 0) {
        return result;
    }


    /* =========================
       HISTORY
    ========================= */

    result.history =
        entries.map(
            ([date, data]) => ({
                date,
                momentum:
                    Number(data.momentum) || 0,
                energy:
                    Number(data.energy) || 0
            })
        );


    /* =========================
       STARTED
    ========================= */

    result.started =
        result.history[0].momentum;


    /* =========================
       ENDED
    ========================= */

    result.ended =
        result.history[
            result.history.length - 1
        ].momentum;


    /* =========================
       PEAK
    ========================= */

    result.peak =
        Math.max(
            ...result.history.map(
                item => item.momentum
            )
        );


    /* =========================
       LONGEST
    ========================= */

    let currentStreak = 0;

    result.history.forEach(
        item => {

            if (item.momentum > 0) {

                currentStreak =
                    item.momentum;

                result.longest =
                    Math.max(
                        result.longest,
                        currentStreak
                    );

            } else {

                currentStreak = 0;

            }

        }
    );


    return result;
}

/* =========================================================
   MONTHLY REPORT — DAILY CHALLENGES
========================================================= */

/* =========================================================
   MONTHLY REPORT — DAILY CHALLENGE METRICS
========================================================= */

function calculateMonthlyDailyChallenges(year, month) {

    const monthPrefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    const now = new Date();

    const isCurrentMonth =
        year === now.getFullYear() &&
        month === now.getMonth();

    const totalDays =
        isCurrentMonth
            ? now.getDate()
            : daysInMonth;

    let completed = 0;
    let points = 0;

    Object.keys(window.missionHistory)
        .filter(date =>
            date.startsWith(monthPrefix)
        )
        .forEach(date => {

            const events =
                Array.isArray(
                    window.missionHistory[date]?.events
                )
                    ? window.missionHistory[date].events
                    : [];

            events.forEach(event => {

                if (
                    event.type === "daily-challenge" &&
                    event.status === "completed"
                ) {

                    completed++;

                    points +=
                        Number(
                            event.pointsDelta
                        ) || 0;

                }

            });

        });


    return {
        completed,
        total: totalDays,
        points,
        rate:
            totalDays > 0
                ? Math.round(
                    (completed / totalDays) * 100
                )
                : 0
    };
}

/* =========================================================
   MONTHLY REPORT — DAILY CHALLENGE UI
========================================================= */

function renderMonthlyDailyChallenges(year, month) {

    const data =
        calculateMonthlyDailyChallenges(
            year,
            month
        );


    const count =
        document.getElementById(
            "monthlyDailyChallengeCount"
        );

    const progress =
        document.getElementById(
            "monthlyDailyChallengeProgress"
        );

    const rate =
        document.getElementById(
            "monthlyDailyChallengeRate"
        );

    const points =
        document.getElementById(
            "monthlyDailyChallengePoints"
        );

    const message =
        document.getElementById(
            "monthlyDailyChallengeMessage"
        );


    if (count) {

        count.textContent =
            `${data.completed} / ${data.total}`;

    }


    if (progress) {

        progress.style.width =
            `${Math.min(data.rate, 100)}%`;

    }


    if (rate) {

        rate.textContent =
            `${data.rate}%`;

    }


    if (points) {

        points.textContent =
            `+${data.points} IP`;

    }


    if (message) {

        if (data.completed === 0) {

            message.textContent =
                "No Daily Challenges completed yet.";

        } else if (
            data.completed === data.total
        ) {

            message.textContent =
                "You conquered every Daily Challenge this month.";

        } else if (
            data.rate >= 75
        ) {

            message.textContent =
                "Excellent consistency. You kept showing up.";

        } else if (
            data.rate >= 50
        ) {

            message.textContent =
                "Good work. Keep building the habit.";

        } else {

            message.textContent =
                "Every challenge conquered is progress.";

        }

    }

}

function generateMonthlySummary(year, month) {

    const metrics =
        getMonthMetrics(year, month);

    const performance =
        calculateMissionPerformance(year, month);

    const goals =
        calculateMonthlyGoalMetrics(year, month);

    const dailyChallenges =
        calculateMonthlyDailyChallenges(
            year,
            month
        );

    const monthName =
        new Date(year, month, 1)
            .toLocaleDateString([], {
                month: "long"
            });



    let opening;

    if (performance.total === 0) {

        opening =
            `${monthName} doesn't have enough recorded data for a meaningful summary.`;

    } else if (performance.completionRate >= 80) {

        opening =
            `${monthName} was a strong execution month.`;

    } else if (performance.completionRate >= 50) {

        opening =
            `${monthName} was a moderately productive month.`;

    } else {

        opening =
            `${monthName} was a challenging month.`;
    }


    let consistencyInsight;

    if (performance.total === 0) {

        consistencyInsight =
            `There isn't enough recorded activity to evaluate consistency.`;

    } else if (metrics.consistency >= 80) {

        consistencyInsight =
            `You maintained strong consistency at ${metrics.consistency}%.`;

    } else if (metrics.consistency >= 50) {

        consistencyInsight =
            `Your consistency was ${metrics.consistency}%, leaving room to build a stronger routine.`;

    } else {

        consistencyInsight =
            `Your consistency was ${metrics.consistency}%, making consistency the biggest area to improve.`;
    }

    let goalInsight = "";

    if (goals.total > 0) {

        if (goals.completionRate === 100) {

            goalInsight =
                `You completed all ${goals.total} of your goals.`;

        } else {

            goalInsight =
                `You completed ${goals.completed} of ${goals.total} goals.`;
        }

    }

    let dailyChallengeInsight = "";

    if (dailyChallenges === 1) {

        dailyChallengeInsight =
            "You conquered 1 Daily Challenge this month.";

    } else if (dailyChallenges > 1) {

        dailyChallengeInsight =
            `You conquered ${dailyChallenges} Daily Challenges this month.`;

    }


    return {
        month: monthName,
        opening,
        completionRate:
            performance.completionRate,
        consistency:
            metrics.consistency,
        completedMissions:
            performance.completed,
        missedMissions:
            performance.missed,
        goalsCompleted:
            goals.completed,
        goalsTotal:
            goals.total,
        summary:
            `${opening} You completed ${performance.completionRate}% of your recorded missions. ${consistencyInsight} ${dailyChallengeInsight} ${goalInsight}`
    };
}
/* =========================================================
   MONTHLY REPORT — MISSION PERFORMANCE UI
========================================================= */

function renderMonthlyMissionPerformance(year, month) {

    const performance =
        calculateMissionPerformance(
            year,
            month
        );

    const rate =
        document.getElementById(
            "missionCompletionRate"
        );

    const completed =
        document.getElementById(
            "missionPerformanceCompleted"
        );

    const missed =
        document.getElementById(
            "missionPerformanceMissed"
        );

    const total =
        document.getElementById(
            "missionPerformanceTotal"
        );


    if (rate) {
        rate.textContent =
            `${performance.completionRate}%`;
    }

    if (completed) {
        completed.textContent =
            performance.completed;
    }

    if (missed) {
        missed.textContent =
            performance.missed;
    }

    if (total) {
        total.textContent =
            performance.total;
    }

    const types =
        calculateMissionTypePerformance(
            year,
            month
        );

    const hardcore =
        document.getElementById(
            "missionHardcoreCount"
        );

    const recurring =
        document.getElementById(
            "missionRecurringCount"
        );

    const oneTime =
        document.getElementById(
            "missionOneTimeCount"
        );

    if (hardcore) {
        hardcore.textContent =
            types.hardcore;
    }

    if (recurring) {
        recurring.textContent =
            types.recurring;
    }

    if (oneTime) {
        oneTime.textContent =
            types.oneTime;
    }
}

function renderMonthlyMomentumChart(year, month) {

    const container =
        document.getElementById(
            "monthlyMomentumChart"
        );

    if (!container) {
        return;
    }

    const history =
        getMonthlyMomentumHistory(
            year,
            month
        );

    container.replaceChildren();


    const yAxis =
        document.getElementById(
            "momentumGraphYAxis"
        );

    const xAxis =
        document.getElementById(
            "momentumGraphXAxis"
        );

    const peakLabel =
        document.getElementById(
            "monthlyMomentumPeakLabel"
        );


    if (yAxis) {
        yAxis.replaceChildren();
    }

    if (xAxis) {
        xAxis.replaceChildren();
    }


    /* =========================================
       EMPTY STATE
    ========================================= */

    if (history.length === 0) {

        const emptyState = document.createElement("div");
        emptyState.className = "momentum-graph-empty";
        emptyState.textContent = "No Momentum data for this month.";
        container.replaceChildren(emptyState);

        return;
    }


    /* =========================================
       VALUES
    ========================================= */

    const values =
        history.map(
            item => Number(item.momentum) || 0
        );


    const maxMomentum =
        Math.max(...values, 1);


    const graphMax =
        Math.max(
            1,
            Math.ceil(maxMomentum / 5) * 5
        );


    /* =========================================
       PEAK LABEL
    ========================================= */

    if (peakLabel) {

        peakLabel.textContent =
            `Peak ${maxMomentum}`;

    }


    /* =========================================
       Y AXIS
    ========================================= */

    if (yAxis) {

        const steps = 4;

        for (
            let i = steps;
            i >= 0;
            i--
        ) {

            const value =
                Math.round(
                    (graphMax / steps) * i
                );

            const label =
                document.createElement("span");

            label.textContent = value;

            yAxis.appendChild(label);
        }
    }


    /* =========================================
       SVG
    ========================================= */

    const width = 1000;
    const height = 300;

    const paddingTop = 18;
    const paddingBottom = 18;
    const paddingLeft = 8;
    const paddingRight = 8;

    const graphWidth =
        width -
        paddingLeft -
        paddingRight;

    const graphHeight =
        height -
        paddingTop -
        paddingBottom;


    const points =
        history.map(
            (item, index) => {

                const x =
                    history.length === 1
                        ? width / 2
                        : paddingLeft +
                        (
                            index /
                            (history.length - 1)
                        ) *
                        graphWidth;


                const y =
                    paddingTop +
                    graphHeight -
                    (
                        item.momentum /
                        graphMax
                    ) *
                    graphHeight;


                return {
                    x,
                    y,
                    date: item.date,
                    momentum: item.momentum
                };

            }
        );


    const svg =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );


    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );

    svg.setAttribute(
        "preserveAspectRatio",
        "none"
    );


    /* =========================================
       GRID
    ========================================= */

    const gridSteps = 4;

    for (
        let i = 0;
        i <= gridSteps;
        i++
    ) {

        const y =
            paddingTop +
            (
                graphHeight /
                gridSteps
            ) *
            i;


        const line =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );


        line.setAttribute(
            "x1",
            0
        );

        line.setAttribute(
            "x2",
            width
        );

        line.setAttribute(
            "y1",
            y
        );

        line.setAttribute(
            "y2",
            y
        );

        line.setAttribute(
            "class",
            "momentum-grid-line"
        );


        svg.appendChild(line);
    }


    /* =========================================
       AREA
    ========================================= */

    const areaPoints = [
        `${points[0].x},${height}`,
        ...points.map(
            point =>
                `${point.x},${point.y}`
        ),
        `${points[points.length - 1].x},${height}`
    ];


    const area =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polygon"
        );


    area.setAttribute(
        "points",
        areaPoints.join(" ")
    );

    area.setAttribute(
        "class",
        "momentum-chart-area-fill"
    );


    svg.appendChild(area);


    /* =========================================
       LINE
    ========================================= */

    const line =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polyline"
        );


    line.setAttribute(
        "points",
        points
            .map(
                point =>
                    `${point.x},${point.y}`
            )
            .join(" ")
    );


    line.setAttribute(
        "class",
        "momentum-chart-line"
    );


    svg.appendChild(line);


    /* =========================================
       POINTS
    ========================================= */

    points.forEach(
        point => {

            const circle =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "circle"
                );


            circle.setAttribute(
                "cx",
                point.x
            );

            circle.setAttribute(
                "cy",
                point.y
            );

            circle.setAttribute(
                "r",
                "5"
            );

            circle.setAttribute(
                "class",
                "momentum-chart-point"
            );


            svg.appendChild(circle);

        }
    );


    container.appendChild(svg);


    /* =========================================
       X AXIS
    ========================================= */

    if (xAxis) {

        const labels = [];


        if (history.length <= 5) {

            history.forEach(
                item => {

                    labels.push(item);

                }
            );

        } else {

            labels.push(
                history[0]
            );

            labels.push(
                history[
                Math.floor(
                    history.length / 2
                )
                ]
            );

            labels.push(
                history[
                history.length - 1
                ]
            );

        }


        labels.forEach(
            item => {

                const label =
                    document.createElement(
                        "span"
                    );


                const date =
                    new Date(
                        item.date + "T00:00:00"
                    );


                label.textContent =
                    date.toLocaleDateString(
                        [],
                        {
                            day: "numeric",
                            month: "short"
                        }
                    );


                xAxis.appendChild(
                    label
                );

            }
        );

    }

}

function getMonthlyEnergyHistory(year, month) {

    const history = window.Momentum.getHistory();

    const prefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    return Object.entries(history)
        .filter(([date]) =>
            date.startsWith(prefix)
        )
        .map(([date, data]) => ({
            date: date,
            energy: Number(data.energy) || 0
        }))
        .sort((a, b) =>
            a.date.localeCompare(b.date)
        );
}
/* =========================================================
   MONTHLY REPORT — MOMENTUM JOURNEY UI
========================================================= */

function renderMonthlyMomentum(year, month) {

    ({ year, month } = resolveReportMonth(year, month));

    const momentum =
        calculateMonthlyMomentum(
            year,
            month
        );


    const ended =
        document.getElementById(
            "monthlyMomentumEnded"
        );

    const started =
        document.getElementById(
            "monthlyMomentumStarted"
        );

    const peak =
        document.getElementById(
            "monthlyMomentumPeak"
        );

    const endedStat =
        document.getElementById(
            "monthlyMomentumEndedStat"
        );

    const longest =
        document.getElementById(
            "monthlyMomentumLongest"
        );


    if (ended) {
        ended.textContent =
            momentum.ended;
    }

    if (started) {
        started.textContent =
            momentum.started;
    }

    if (peak) {
        peak.textContent =
            momentum.peak;
    }

    if (endedStat) {
        endedStat.textContent =
            momentum.ended;
    }

    if (longest) {
        longest.textContent =
            `${momentum.longest} ${momentum.longest === 1
                ? "DAY"
                : "DAYS"
            }`;
    }

}

function renderMonthlyInsights(year, month) {

    const container =
        document.getElementById(
            "monthlyInsights"
        );

    if (!container) {
        return;
    }

    const insights =
        generateMonthlyInsights(
            year,
            month
        );

    container.replaceChildren();


    if (insights.length === 0) {

        const emptyState = document.createElement("div");
        emptyState.className = "monthly-insight-empty";
        emptyState.textContent = "Not enough data to generate insights yet.";
        container.appendChild(emptyState);

        return;
    }


    const fragment = document.createDocumentFragment();
    const allowedInsightTypes = new Set(["positive", "neutral", "warning"]);

    insights.forEach(insight => {

        const item = document.createElement("div");
        const insightType = allowedInsightTypes.has(insight.type)
            ? insight.type
            : "neutral";
        item.className = `monthly-insight monthly-insight-${insightType}`;

        const indicator = document.createElement("div");
        indicator.className = "monthly-insight-indicator";

        const content = document.createElement("div");
        content.className = "monthly-insight-content";

        const title = document.createElement("strong");
        title.textContent = String(insight.title ?? "");

        const description = document.createElement("span");
        description.textContent = String(insight.text ?? "");

        content.append(title, description);
        item.append(indicator, content);
        fragment.appendChild(item);

    });

    container.replaceChildren(fragment);

}

function renderMonthlySummary(year, month) {

    ({ year, month } = resolveReportMonth(year, month));

    const summary =
        generateMonthlySummary(
            year,
            month
        );

    const title =
        document.getElementById(
            "monthlySummaryTitle"
        );

    const text =
        document.getElementById(
            "monthlySummaryText"
        );

    const completion =
        document.getElementById(
            "monthlySummaryCompletion"
        );

    const consistency =
        document.getElementById(
            "monthlySummaryConsistency"
        );

    const goals =
        document.getElementById(
            "monthlySummaryGoals"
        );


    if (title) {
        title.textContent =
            summary.month;
    }


    if (text) {
        text.textContent =
            summary.summary;
    }


    if (completion) {
        completion.textContent =
            `${summary.completionRate}%`;
    }


    if (consistency) {
        consistency.textContent =
            `${summary.consistency}%`;
    }


    if (goals) {
        goals.textContent =
            `${summary.goalsCompleted}/${summary.goalsTotal}`;
    }

}
/* =========================================================
   MONTHLY REPORT — ACTIVITY CALENDAR
========================================================= */

function renderMonthlyActivityCalendar(year, month) {

    const container =
        document.getElementById(
            "monthlyActivityCalendar"
        );

    if (!container) return;

    container.replaceChildren();


    /* =========================
       MONTH INFORMATION
    ========================= */

    const firstDay =
        new Date(
            year,
            month,
            1
        );

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    /*
     * JavaScript:
     *
     * Sunday = 0
     * Monday = 1
     * ...
     *
     * Our calendar starts Monday.
     */
    const firstWeekday =
        (firstDay.getDay() + 6) % 7;


    /* =========================
       WEEKDAY HEADERS
    ========================= */

    const weekdays = [
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT",
        "SUN"
    ];

    weekdays.forEach(day => {

        const header =
            document.createElement("div");

        header.className =
            "calendar-weekday";

        header.textContent =
            day;

        container.appendChild(header);

    });


    /* =========================
       EMPTY CELLS
    ========================= */

    for (
        let i = 0;
        i < firstWeekday;
        i++
    ) {

        const empty =
            document.createElement("div");

        empty.className =
            "calendar-day calendar-empty";

        container.appendChild(empty);

    }


    /* =========================
       DAYS
    ========================= */

    const today =
        getISTDate();

    const todayKey =
        today.toISOString()
            .slice(0, 10);


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dateKey =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const dayData =
            window.missionHistory[dateKey];


        const cell =
            document.createElement("div");

        cell.className =
            "calendar-day";


        /* =========================
           DAY NUMBER
        ========================= */

        const number =
            document.createElement("span");

        number.className =
            "calendar-day-number";

        number.textContent =
            day;

        cell.appendChild(number);


        /* =========================
           ACTIVITY STATE
        ========================= */

        const events =
            dayData &&
                Array.isArray(dayData.events)
                ? dayData.events
                : [];


        const hasCompleted =
            events.some(
                event =>
                    event.status === "completed"
            );

        const hasMissed =
            events.some(
                event =>
                    event.status === "missed"
            );


        if (hasCompleted && hasMissed) {

            cell.classList.add(
                "calendar-partial"
            );

        }
        else if (hasCompleted) {

            cell.classList.add(
                "calendar-active"
            );

        }
        else if (hasMissed) {

            cell.classList.add(
                "calendar-missed"
            );

        }
        else {

            cell.classList.add(
                "calendar-no-activity"
            );

        }

        /* =========================
           TODAY
        ========================= */

        if (dateKey === todayKey) {

            cell.classList.add(
                "calendar-today"
            );

        }


        container.appendChild(cell);

    }

}

function calculateMonthlyGoalMetrics(year, month) {

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);

    const goals = window.goalsData.filter(goal => {

        const deadline =
            goal.deadline
                ? new Date(goal.deadline)
                : null;

        const achievedAt =
            goal.achievedAt
                ? new Date(goal.achievedAt)
                : null;

        return (
            (deadline && deadline >= start && deadline < end) ||
            (achievedAt && achievedAt >= start && achievedAt < end)
        );
    });

    const completed =
        goals.filter(goal => goal.achieved).length;

    const active =
        goals.filter(goal =>
            !goal.achieved &&
            new Date(goal.deadline) >= new Date()
        ).length;

    const missed =
        goals.filter(goal =>
            !goal.achieved &&
            goal.deadline &&
            new Date(goal.deadline) < new Date()
        ).length;

    const total = goals.length;

    const completionRate =
        total > 0
            ? Math.round((completed / total) * 100)
            : 0;

    return {
        completed,
        active,
        missed,
        total,
        completionRate
    };
}
/* =========================================================
   MONTHLY REPORT — CONSISTENCY GRAPH
========================================================= */

function renderMonthlyConsistencyChart(year, month) {

    const container =
        document.getElementById(
            "monthlyConsistencyChart"
        );

    if (!container) return;

    container.replaceChildren();

    const data =
        calculateDailyConsistency(
            year,
            month
        );


    /* =========================
       CHART
    ========================= */

    const chart =
        document.createElement("div");

    chart.className =
        "consistency-chart-inner";


    /* =========================
       Y AXIS
    ========================= */

    const yAxis =
        document.createElement("div");

    yAxis.className =
        "consistency-y-axis";

    [100, 75, 50, 25, 0]
        .forEach(value => {

            const label =
                document.createElement("span");

            label.textContent =
                value + "%";

            yAxis.appendChild(label);

        });


    chart.appendChild(yAxis);


    /* =========================
       GRAPH AREA
    ========================= */

    const graph =
        document.createElement("div");

    graph.className =
        "consistency-graph-area";


    /* =========================
       GRID
    ========================= */

    [100, 75, 50, 25, 0]
        .forEach(value => {

            const line =
                document.createElement("div");

            line.className =
                "consistency-grid-line";

            line.style.bottom =
                `${value}%`;

            graph.appendChild(line);

        });


    /* =========================
       SVG
    ========================= */

    const svg =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

    svg.classList.add(
        "consistency-svg"
    );

    svg.setAttribute(
        "viewBox",
        `0 0 ${data.length * 20} 100`
    );

    svg.setAttribute(
        "preserveAspectRatio",
        "none"
    );


    /* =========================
       POINTS
    ========================= */

    const points = [];

    data.forEach((item, index) => {

        if (item.consistency === null) {
            return;
        }

        const x =
            index * 20 + 10;

        const y =
            100 - item.consistency;

        points.push({
            x,
            y,
            item
        });

    });


    /* =========================
       LINE
    ========================= */

    if (points.length > 1) {

        const path =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "polyline"
            );

        path.setAttribute(
            "points",
            points
                .map(point =>
                    `${point.x},${point.y}`
                )
                .join(" ")
        );

        path.classList.add(
            "consistency-line"
        );

        svg.appendChild(path);

    }


    /* =========================
       POINT DOTS
    ========================= */

    points.forEach(point => {

        const circle =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            );

        circle.setAttribute(
            "cx",
            point.x
        );

        circle.setAttribute(
            "cy",
            point.y
        );

        circle.setAttribute(
            "r",
            "2"
        );

        circle.classList.add(
            "consistency-point"
        );

        svg.appendChild(circle);

    });


    graph.appendChild(svg);


    /* =========================
       X AXIS
    ========================= */

    const xAxis =
        document.createElement("div");

    xAxis.className =
        "consistency-x-axis";

    data.forEach(item => {

        const label =
            document.createElement("span");

        /*
         * Only show useful labels.
         */
        if (
            item.day === 1 ||
            item.day % 7 === 0 ||
            item.day === data.length
        ) {
            label.textContent =
                item.day;
        }

        xAxis.appendChild(label);

    });

    graph.appendChild(xAxis);

    chart.appendChild(graph);

    container.appendChild(chart);
}

function getMonthlyGoalProgress(year, month) {

    const metrics =
        calculateMonthlyGoalMetrics(
            year,
            month
        );

    return {
        ...metrics,
        progress: metrics.completionRate
    };
}

function renderMonthlyGoalsProgress(year, month) {

    const metrics =
        getMonthlyGoalProgress(
            year,
            month
        );

    const progressValue =
        document.getElementById(
            "monthlyGoalsProgressValue"
        );

    const completedText =
        document.getElementById(
            "monthlyGoalsCompletedText"
        );

    const progressBar =
        document.getElementById(
            "monthlyGoalsProgressBar"
        );

    const completed =
        document.getElementById(
            "monthlyGoalsCompleted"
        );

    const missed =
        document.getElementById(
            "monthlyGoalsMissed"
        );

    const active =
        document.getElementById(
            "monthlyGoalsActive"
        );


    if (progressValue) {
        progressValue.textContent =
            `${metrics.progress}%`;
    }


    if (completedText) {
        completedText.textContent =
            `${metrics.completed} of ${metrics.total}`;
    }


    if (progressBar) {
        progressBar.style.width =
            `${metrics.progress}%`;
    }


    if (completed) {
        completed.textContent =
            metrics.completed;
    }


    if (missed) {
        missed.textContent =
            metrics.missed;
    }


    if (active) {
        active.textContent =
            metrics.active;
    }

}


export const monthlyReport = Object.freeze({
    initializeMonthlyReportSelector,
    renderMonthlyReport,
    renderMonthlySummary,
    renderMonthlyMomentum
});
