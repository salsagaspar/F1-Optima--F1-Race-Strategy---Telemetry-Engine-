// F1 Race Strategy Optimizer & Pit Stop Simulator
// Core Simulation & Optimization Logic

let f1Data = null;

// Stint length constraints by tyre compound
const TYRE_CONSTRAINTS = {
    'Soft': { min: 5, max: 22, base_penalty: 0.0, degradation: 0.18 },
    'Medium': { min: 5, max: 32, base_penalty: 0.7, degradation: 0.09 },
    'Hard': { min: 5, max: 45, base_penalty: 1.6, degradation: 0.04 },
    'Inter': { min: 5, max: 32, base_penalty: 2.2, degradation: 0.11 },
    'Wet': { min: 5, max: 38, base_penalty: 4.2, degradation: 0.06 }
};

// Load F1 Data from global F1_DATA variable (bypasses local fetch CORS block)
function loadF1Data() {
    if (typeof F1_DATA !== 'undefined') {
        f1Data = F1_DATA;
        populateSelectors();
        runOptimization(); // Run initial optimization
    } else {
        console.error("F1_DATA global variable is not defined. Make sure f1_data.js is loaded.");
    }
}

// Populate Dropdown Selectors
function populateSelectors() {
    const circuitSelect = document.getElementById('circuit-select');
    const driverSelect = document.getElementById('driver-select');

    // Sort circuits by country
    const sortedCircuits = [...f1Data.circuits].sort((a, b) => a.country.localeCompare(b.country));
    sortedCircuits.forEach(c => {
        const option = document.createElement('option');
        option.value = c.circuit_id;
        option.textContent = `${c.country} - ${c.circuit_name}`;
        circuitSelect.appendChild(option);
    });

    // Populate drivers
    f1Data.drivers.forEach(d => {
        const option = document.createElement('option');
        option.value = d.driver_name;
        option.textContent = `${d.driver_name} (${d.team_name})`;
        driverSelect.appendChild(option);
    });

    // Set default values (Silverstone & Leclerc)
    circuitSelect.value = "27879658"; 
    driverSelect.value = "Charles Leclerc";
}

// Simulate Lap-by-Lap
function simulateRace(circuit, driver, weather, totalLaps, strategy) {
    let currentTyre = strategy.compounds[0];
    let tyreAge = 0;
    let fuelWeight = 100; // start with 100kg fuel
    const fuelBurnPerLap = 1.4; // 1.4kg fuel burned per lap on average
    
    // Base lap speed calculation (derived from circuit avg speed/length)
    const baseSpeedKmh = 212; // simplified baseline
    const baseLapTimeSec = (circuit.track_length_km / baseSpeedKmh) * 3600;

    // Driver & Team adjustments
    const driverAdj = (driver.driver_avg_finish_pos - 10.5) * 0.12; 
    const teamAdj = (driver.team_avg_points - 3.8) * -0.15; 

    let totalRaceTime = 0;
    let lapsData = [];
    let pitStopCount = 0;

    for (let lap = 1; lap <= totalLaps; lap++) {
        let isPitStop = false;
        let pitDelay = 0;
        if (strategy.stopLaps.includes(lap)) {
            isPitStop = true;
            pitStopCount++;
            currentTyre = strategy.compounds[pitStopCount];
            tyreAge = 0;
            pitDelay = circuit.pit_stop_overhead_sec;
        }

        const tyre = TYRE_CONSTRAINTS[currentTyre];
        let tyrePenalty = tyre.base_penalty;
        
        // Non-linear tyre degradation (degradation accelerates as tyres get older)
        const wearRate = tyre.degradation;
        const turnsPerKm = circuit.turns_per_km || 3.0;
        const turnDensityMultiplier = 1 + (turnsPerKm - 3.0) * 0.08;
        const tempMultiplier = 1 + (circuit.avg_temp_max_c - 25) * 0.008;
        
        let tyreWear = (tyreAge * wearRate * turnDensityMultiplier * tempMultiplier);
        tyrePenalty += tyreWear * (1 + tyreAge * 0.02); // accelerated degradation

        let tyreWearPct = Math.min(100, (tyreAge / tyre.max) * 100);

        let weatherPenalty = 0;
        const slickTyres = ['Soft', 'Medium', 'Hard'];
        if (weather === 'Wet') {
            if (slickTyres.includes(currentTyre)) {
                weatherPenalty = 14.0;
            } else if (currentTyre === 'Inter') {
                weatherPenalty = 3.5;
            }
        } else if (weather === 'Mixed') {
            if (slickTyres.includes(currentTyre)) {
                weatherPenalty = 5.5;
            } else if (currentTyre === 'Wet') {
                weatherPenalty = 2.5;
            }
        } else { // Dry/Cloudy
            if (currentTyre === 'Inter') {
                weatherPenalty = 3.5; 
                tyreWearPct = Math.min(100, tyreWearPct * 2.0); // fast degradation in dry
            } else if (currentTyre === 'Wet') {
                weatherPenalty = 6.0;
                tyreWearPct = Math.min(100, tyreWearPct * 3.0); // extremely fast degradation
            }
        }

        const fuelSaving = (fuelWeight - 100) * -0.035; // car gets faster as fuel burns

        const lapTime = baseLapTimeSec + driverAdj + teamAdj + tyrePenalty + weatherPenalty + fuelSaving + pitDelay;
        totalRaceTime += lapTime;

        lapsData.push({
            lap: lap,
            lap_time: lapTime,
            tyre_compound: currentTyre,
            tyre_wear_pct: tyreWearPct,
            fuel_weight_kg: fuelWeight,
            is_pit_stop: isPitStop
        });

        tyreAge++;
        fuelWeight = Math.max(2, fuelWeight - fuelBurnPerLap);
    }

    return {
        totalRaceTime: totalRaceTime,
        laps: lapsData
    };
}

// Generate all valid strategies to evaluate
function getValidStrategies(totalLaps, weather) {
    const slickCompounds = ['Soft', 'Medium', 'Hard'];
    const wetCompounds = ['Inter', 'Wet'];
    const availableCompounds = (weather === 'Wet' || weather === 'Mixed') 
        ? [...slickCompounds, ...wetCompounds] 
        : slickCompounds;

    let strategies = [];

    // 0-Stop
    availableCompounds.forEach(c => {
        if (totalLaps <= TYRE_CONSTRAINTS[c].max) {
            strategies.push({ stops: 0, stopLaps: [], compounds: [c] });
        }
    });

    // 1-Stop
    availableCompounds.forEach(c1 => {
        availableCompounds.forEach(c2 => {
            const minPit = TYRE_CONSTRAINTS[c1].min;
            const maxPit = Math.min(totalLaps - TYRE_CONSTRAINTS[c2].min, TYRE_CONSTRAINTS[c1].max);
            
            for (let pit = minPit; pit <= maxPit; pit++) {
                if (totalLaps - pit <= TYRE_CONSTRAINTS[c2].max) {
                    strategies.push({ stops: 1, stopLaps: [pit], compounds: [c1, c2] });
                }
            }
        });
    });

    // 2-Stop
    availableCompounds.forEach(c1 => {
        availableCompounds.forEach(c2 => {
            availableCompounds.forEach(c3 => {
                const minPit1 = TYRE_CONSTRAINTS[c1].min;
                const maxPit1 = TYRE_CONSTRAINTS[c1].max;

                for (let pit1 = minPit1; pit1 <= maxPit1; pit1++) {
                    const minPit2 = pit1 + TYRE_CONSTRAINTS[c2].min;
                    const maxPit2 = Math.min(totalLaps - TYRE_CONSTRAINTS[c3].min, pit1 + TYRE_CONSTRAINTS[c2].max);

                    for (let pit2 = minPit2; pit2 <= maxPit2; pit2++) {
                        if (totalLaps - pit2 <= TYRE_CONSTRAINTS[c3].max) {
                            strategies.push({ stops: 2, stopLaps: [pit1, pit2], compounds: [c1, c2, c3] });
                        }
                    }
                }
            });
        });
    });

    if (strategies.length === 0) {
        strategies.push({ stops: 1, stopLaps: [Math.floor(totalLaps / 2)], compounds: [availableCompounds[0], availableCompounds[0]] });
    }

    return strategies;
}

// Find Optimal Strategy
function runOptimization() {
    if (!f1Data) return;

    const circuitId = parseInt(document.getElementById('circuit-select').value);
    const driverName = document.getElementById('driver-select').value;
    const weather = document.getElementById('weather-select').value;
    const totalLaps = parseInt(document.getElementById('laps-input').value);

    const circuit = f1Data.circuits.find(c => c.circuit_id === circuitId);
    const driver = f1Data.drivers.find(d => d.driver_name === driverName);

    const strategies = getValidStrategies(totalLaps, weather);

    let bestStrategy = null;
    let minTime = Infinity;
    let strategyComparisons = [];

    strategies.forEach(strategy => {
        const result = simulateRace(circuit, driver, weather, totalLaps, strategy);
        
        strategyComparisons.push({
            strategy: strategy,
            time: result.totalRaceTime
        });

        if (result.totalRaceTime < minTime) {
            minTime = result.totalRaceTime;
            bestStrategy = {
                strategy: strategy,
                result: result
            };
        }
    });

    updateDashboardUI(bestStrategy, strategyComparisons, circuit, driver, totalLaps);
}

// Format Time (seconds to HH:MM:SS.mmm)
function formatRaceTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

// Update Dashboard UI
function updateDashboardUI(best, comparisons, circuit, driver, totalLaps) {
    document.getElementById('total-time-card').textContent = formatRaceTime(best.result.totalRaceTime);
    document.getElementById('stops-card').textContent = `${best.strategy.stops} Stops`;
    
    const avgLapTime = best.result.totalRaceTime / totalLaps;
    document.getElementById('avg-lap-card').textContent = `${avgLapTime.toFixed(3)}s`;

    const strategySeq = best.strategy.compounds.join(' ➔ ');
    document.getElementById('sequence-card').textContent = strategySeq;

    renderStintTimeline(best.strategy, totalLaps);
    renderTelemetryTable(best.result.laps);
    renderCharts(best.result.laps, comparisons, totalLaps);
}

// Render stint timeline visual
function renderStintTimeline(strategy, totalLaps) {
    const timeline = document.getElementById('stint-timeline');
    timeline.innerHTML = '';

    let currentLap = 0;
    const colors = {
        'Soft': '#e74c3c',
        'Medium': '#f1c40f',
        'Hard': '#ecf0f1',
        'Inter': '#2ecc71',
        'Wet': '#3498db'
    };

    strategy.compounds.forEach((compound, index) => {
        let stintLaps = 0;
        if (index === strategy.compounds.length - 1) {
            stintLaps = totalLaps - currentLap;
        } else {
            stintLaps = strategy.stopLaps[index] - currentLap;
        }

        const bar = document.createElement('div');
        bar.className = 'stint-bar';
        const weight = (stintLaps / totalLaps) * 100;
        bar.style.width = `${weight}%`;
        bar.style.backgroundColor = colors[compound];
        
        bar.innerHTML = `<span class="stint-label">${compound}<br>(${stintLaps} Laps)</span>`;
        timeline.appendChild(bar);

        currentLap += stintLaps;
    });
}

// Render Telemetry Table
function renderTelemetryTable(laps) {
    const tbody = document.getElementById('telemetry-tbody');
    tbody.innerHTML = '';

    laps.forEach(lap => {
        const tr = document.createElement('tr');
        if (lap.is_pit_stop) {
            tr.className = 'pit-stop-row';
        }

        tr.innerHTML = `
            <td>${lap.lap}</td>
            <td>${lap.lap_time.toFixed(3)}s</td>
            <td style="color: ${getTyreColor(lap.tyre_compound)}">${lap.tyre_compound}</td>
            <td>${lap.tyre_wear_pct.toFixed(1)}%</td>
            <td>${lap.fuel_weight_kg.toFixed(1)} kg</td>
            <td>${lap.is_pit_stop ? '<span class="pit-badge">PIT STOP</span>' : '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function getTyreColor(compound) {
    const colors = {
        'Soft': '#e74c3c',
        'Medium': '#f1c40f',
        'Hard': '#ffffff',
        'Inter': '#2ecc71',
        'Wet': '#3498db'
    };
    return colors[compound] || '#ccc';
}

// Chart render using Apache ECharts
let telemetryChart = null;
let comparisonChart = null;

function renderCharts(laps, comparisons, totalLaps) {
    const telDom = document.getElementById('telemetry-chart');
    if (telemetryChart) {
        telemetryChart.dispose();
    }
    telemetryChart = echarts.init(telDom, 'dark');

    const lapNumbers = laps.map(l => l.lap);
    const lapTimes = laps.map(l => l.lap_time);
    const tyreWear = laps.map(l => l.tyre_wear_pct);
    const fuelWeight = laps.map(l => l.fuel_weight_kg);

    const telOption = {
        backgroundColor: '#121212',
        title: {
            text: 'Live Telemetry Simulation',
            left: 'center',
            textStyle: { color: '#ffffff', fontSize: 16 }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
        },
        grid: { left: '8%', right: '8%', bottom: '15%', top: '20%' },
        legend: {
            data: ['Lap Time', 'Tyre Wear', 'Fuel Load'],
            bottom: 0,
            textStyle: { color: '#ccc' }
        },
        xAxis: {
            type: 'category',
            data: lapNumbers,
            name: 'Lap',
            axisLabel: { color: '#ccc' }
        },
        yAxis: [
            {
                type: 'value',
                name: 'Time (s)',
                position: 'left',
                axisLabel: { color: '#ccc' },
                splitLine: { show: false }
            },
            {
                type: 'value',
                name: 'Percentage / Weight',
                position: 'right',
                axisLabel: { color: '#ccc' },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: 'Lap Time',
                type: 'line',
                data: lapTimes,
                yAxisIndex: 0,
                smooth: true,
                lineStyle: { color: '#ff3838', width: 2.5 },
                itemStyle: { color: '#ff3838' }
            },
            {
                name: 'Tyre Wear',
                type: 'line',
                data: tyreWear,
                yAxisIndex: 1,
                smooth: true,
                lineStyle: { color: '#f1c40f', width: 2, type: 'dashed' },
                itemStyle: { color: '#f1c40f' }
            },
            {
                name: 'Fuel Load',
                type: 'line',
                data: fuelWeight,
                yAxisIndex: 1,
                smooth: true,
                lineStyle: { color: '#3498db', width: 2 },
                itemStyle: { color: '#3498db' }
            }
        ]
    };
    telemetryChart.setOption(telOption);

    const compDom = document.getElementById('comparison-chart');
    if (comparisonChart) {
        comparisonChart.dispose();
    }
    comparisonChart = echarts.init(compDom, 'dark');

    const bestByStops = {};
    comparisons.forEach(c => {
        const stops = c.strategy.stops;
        if (!bestByStops[stops] || c.time < bestByStops[stops].time) {
            bestByStops[stops] = c;
        }
    });

    const stopCounts = Object.keys(bestByStops).sort((a, b) => a - b);
    const times = stopCounts.map(sc => (bestByStops[sc].time / 60).toFixed(2)); 
    const labels = stopCounts.map(sc => `${sc}-Stop (${bestByStops[sc].strategy.compounds.join('➔')})`);

    const compOption = {
        backgroundColor: '#121212',
        title: {
            text: 'Strategy Time Comparison',
            left: 'center',
            textStyle: { color: '#ffffff', fontSize: 16 }
        },
        tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} mins'
        },
        grid: { left: '10%', right: '5%', bottom: '15%', top: '20%' },
        xAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: '#ccc', rotate: 15, interval: 0 }
        },
        yAxis: {
            type: 'value',
            name: 'Total Race Time (mins)',
            axisLabel: { color: '#ccc' },
            min: function (value) {
                return Math.floor(value.min - 1);
            }
        },
        series: [{
            data: times,
            type: 'bar',
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#ff3838' },
                    { offset: 1, color: '#962d22' }
                ])
            },
            label: {
                show: true,
                position: 'top',
                color: '#fff',
                formatter: '{c}m'
            }
        }]
    };
    comparisonChart.setOption(compOption);
}

// Set up UI Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const lapsInput = document.getElementById('laps-input');
    const lapsValue = document.getElementById('laps-value');
    
    lapsInput.addEventListener('input', (e) => {
        lapsValue.textContent = e.target.value;
        runOptimization();
    });

    document.getElementById('circuit-select').addEventListener('change', runOptimization);
    document.getElementById('driver-select').addEventListener('change', runOptimization);
    document.getElementById('weather-select').addEventListener('change', runOptimization);

    loadF1Data();
});

window.addEventListener('resize', () => {
    if (telemetryChart) telemetryChart.resize();
    if (comparisonChart) comparisonChart.resize();
});
