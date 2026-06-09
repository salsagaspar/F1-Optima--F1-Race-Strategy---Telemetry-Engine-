# 🏎️ F1 Race Strategy Optimizer & Pit Stop Simulator

An end-to-end Data Science, Predictive Modeling, and Web Simulation project. This application analyzes Formula 1 datasets, trains machine learning models to predict lap times, and uses a client-side Dynamic Programming engine to compute the mathematically optimal pit stop strategy for any given race configuration.

---

## 📂 Project Structure

```text
├── f1_circuits_700.csv              # Original F1 circuits dataset (700 rows)
├── f1_race_results_700.csv          # Original F1 race results dataset (700 rows)
├── f1_circuits_cleaned.csv          # Cleaned circuits dataset (UTF-8, stripped text)
├── f1_race_results_cleaned.csv      # Cleaned race results dataset (no nulls in categorical cols)
├── f1_circuits_engineered.csv       # Circuits with turns density, elevation, and pit overhead
├── f1_race_results_engineered.csv   # Results with historical driver & team indexes
├── f1_lap_time_estimator.joblib     # Saved Random Forest regression model pipeline
│
├── clean_data.py                    # Data cleaning script
├── extract_data.py                  # Script to extract circuit/driver database for web app
├── requirements.txt                 # Python project dependencies
├── .gitignore                       # Git ignore configurations
│
├── data_exploration.ipynb           # Jupyter Notebook: EDA on weather, tyre speeds, and stops
├── feature_engineering.ipynb        # Jupyter Notebook: Track difficulty & driver indexes
├── predictive_modeling.ipynb        # Jupyter Notebook: Baseline Ridge vs. Random Forest models
│
├── docs/
│   └── f1_datasets_analysis_report.md  # Detailed analysis report of the raw datasets
│
└── strategy_optimizer/              # Web Application (Dashboard & Simulator)
    ├── index.html                   # HTML structure for the premium F1 dashboard
    ├── styles.css                   # Futuristic carbon-fiber / neon-red dark mode stylesheet
    ├── app.js                       # Real-time simulation engine & ECharts plots logic
    ├── f1_data.js                   # Compiled client-side database (bypasses CORS restrictions)
    └── f1_data.json                 # JSON version of the circuits & drivers database
```

---

## ⚙️ How to Setup & Run

### 1. Python Environment (Data Pipeline & Models)
To run the notebooks or extract new data, install the required Python packages:
```bash
pip install -r requirements.txt
```

* **Data Cleaning**: Run `python clean_data.py` to clean the raw inputs.
* **Jupyter Notebooks**: Open `data_exploration.ipynb`, `feature_engineering.ipynb`, or `predictive_modeling.ipynb` to view the step-by-step analysis and model training.
* **Database Export**: Run `python extract_data.py` to re-export the latest parameters from the engineered CSV files into `strategy_optimizer/f1_data.js` and `f1_data.json`.

### 2. Interactive Simulator (Web Dashboard)
The dashboard runs entirely in the browser and requires **no local server or installations**. 
* Simply open **`strategy_optimizer/index.html`** by double-clicking it or opening it with any modern web browser.
* All data is loaded directly from `strategy_optimizer/f1_data.js` via local variable initialization to bypass modern browser CORS blocks on the `file://` protocol.

---

## 🧠 Simulator Mathematical Model

The simulation engine calculates the lap time for each lap $t$ of the race using the following formula:

$$\text{LapTime}(t) = \text{BaseTime}_{\text{circuit}} + \text{TyrePenalty}_{\text{compound}}(L) - \text{FuelSaving}(t) + \text{WeatherDelay} + \text{PitStopDelay}$$

Where:
* **$\text{BaseTime}_{\text{circuit}}$**: Basetime derived from track length and average speed.
* **$\text{TyrePenalty}_{\text{compound}}(L)$**: Penalty based on tyre compound and tyre age $L$ (degrades exponentially with lap turns density and track temperature).
* **$\text{FuelSaving}(t)$**: Speedup of $-0.035\text{s}$ per kg of fuel burned (starts with $100\text{kg}$ of fuel, burning $1.4\text{kg}$ per lap).
* **$\text{WeatherDelay}$**: Additional weather penalty (e.g. $+14\text{s}$ for slicks on a wet track).
* **$\text{PitStopDelay}$**: Overhead time lost transiting the pit lane (calculated based on the circuit's pit lane length) plus tyre change time ($2.5\text{s}$).

### Strategy Optimization Engine
The optimizer uses **Dynamic Programming / Grid Search** to evaluate every valid stint combination (including 0-stop, 1-stop, and 2-stop configurations) across all possible pit stop laps and tyre compound permutations. It selects the strategy that minimizes the total race time $\sum \text{LapTime}(t)$.

---

## 🛠️ Technologies Used
* **Frontend**: HTML5, Vanilla CSS3 (Custom scrollbars, blur filter glassmorphism, responsive grid), Vanilla JavaScript (ES6+).
* **Charts**: Apache ECharts (v5.4.3 CDN).
* **Data & Machine Learning**: Python 3, Pandas, NumPy, Matplotlib, Seaborn, Scikit-Learn, Joblib, Jupyter Notebook.

## Dashboard Top
![alt text](<Visual Dashboards Show/dashboard_top_final_1780965323029.png>)

## Dashboard Bottom
![alt text](<Visual Dashboards Show/dashboard_bottom_final_1780965317970.png>)