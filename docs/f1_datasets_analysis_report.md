# F1 Race Datasets Comprehensive Analysis Report

This report provides an in-depth review of the two F1 datasets located in the workspace folder:
1. `f1_circuits_700.csv` — A detailed registry of Formula 1 track configurations.
2. `f1_race_results_700.csv` — Race performance metrics across multiple seasons (2018–2023).

---

## 1. File Registry Overview

| Dataset | Dimensions | File Size | Key Identifier | Description |
| :--- | :--- | :--- | :--- | :--- |
| **[f1_circuits_700.csv](file:///c:/Users/hpvic/OneDrive/Documents/F1%20Race/f1_circuits_700.csv)** | 700 rows × 31 columns | 127.9 KB | `circuit_id` | Metadata on F1 circuits, including layout details, climate, seating, and financial factors. |
| **[f1_race_results_700.csv](file:///c:/Users/hpvic/OneDrive/Documents/F1%20Race/f1_race_results_700.csv)** | 700 rows × 36 columns | 127.4 KB | `result_id` | Historical race statistics spanning seasons 2018 to 2023. |

> [!NOTE]
> This dataset appears to be **synthetically generated** or simulated. For instance, Logan Sargeant holds the highest total points (391) followed by Charles Leclerc, while Max Verstappen has 264 points. Several circuits (like Montreal) are classified as "Ovals", which differs from real-world F1 layouts.

---

## 2. Detailed Review: F1 Circuits (`f1_circuits_700.csv`)

This dataset is **100% complete** with no missing values. It lists 700 circuit configurations with unique `circuit_id`s representing 192 unique circuit names across 25 countries.

### Key Dimensions & Categories
* **Surface Types**: `Asphalt`, `Mixed`, `Concrete`
* **Circuit Types**: `Street`, `Hybrid`, `Permanent`, `Oval`
* **Engine Suppliers**: `Ferrari`, `Alfa Romeo`, `Renault`, `Mercedes`, `Honda`
* **Broadcast Languages**: 10 languages, including English (`EN`), German (`DE`), Arabic (`AR`), Portuguese (`PT`), Mandarin (`ZH`), and Japanese (`JA`).
* **FIA Grade**:
  * **Grade 1**: 536 circuits (approved for Formula 1 races)
  * **Grade 2**: 136 circuits
  * **Grade 3**: 28 circuits

### Key Summary Statistics
* **Track Length**: Ranges from **2.61 km** (e.g. Monaco) to **7.77 km** (Spa-Francorchamps Endurance Config), with a mean of **5.09 km**.
* **Year Opened**: Features historic tracks from **1948** up to modern layouts from **2020**.
* **Seating Capacity**: Ranges from a modest **20,962** up to massive arenas of **418,980** spectators.
* **Turns & DRS**: Tracks have between **6 and 26 turns** and **1 to 6 DRS zones**.
* **Elevation Change**: Up to **220 meters** (like Spa-Francorchamps).
* **Ticket Price**: Ranges from **$40** to a premium of **$3,500** (mean: ~$1,848). Monaco has the highest average ticket price at $2,980.

---

## 3. Detailed Review: F1 Race Results (`f1_race_results_700.csv`)

This dataset contains 700 race entries. While most columns are complete, there are missing values in a few columns due to the nature of F1 events:
* `finish_position`: **58 missing values** (representing DNF, Retired, DSQ, or Accident cases where the driver did not complete enough distance to be classified).
* `dnf_reason`: **660 missing values** (only populated when a driver failed to finish).
* `safety_car_event`: **550 missing values** (only populated during Virtual SC, Full SC, or Red Flag events).

### Driver & Team Alignment
There are exactly **10 unique drivers** and **8 teams**. Each driver maps to exactly one team throughout the dataset, confirming stable contracts:

| Driver Name | Team Name | Total Records | Points Scored (Sum) |
| :--- | :--- | :--- | :--- |
| **Logan Sargeant** | Williams | 80 | **391** |
| **Charles Leclerc** | Ferrari | 78 | **369** |
| **George Russell** | Mercedes | 73 | **347** |
| **Nico Hulkenberg** | Haas | 68 | **345** |
| **Carlos Sainz** | Ferrari | 77 | **344** |
| **Max Verstappen** | Red Bull Racing | 72 | **264** |
| **Pierre Gasly** | Alpine | 76 | **226** |
| **Sergio Perez** | Red Bull Racing | 72 | **220** |
| **Fernando Alonso** | Aston Martin | 56 | **197** |
| **Yuki Tsunoda** | AlphaTauri | 48 | **182** |

### Season Breakdown
The data spans 6 seasons, heavily skewed towards 2023:
* **2023**: 278 rows
* **2022**: 146 rows
* **2021**: 90 rows
* **2019**: 68 rows
* **2018**: 59 rows
* **2020**: 59 rows

### Race Status, DNFs, & Classifications
* **Total Finished**: 574 races.
* **Non-Finishes breakdown**:
  * `DNF`: 50 entries
  * `Retired`: 35 entries
  * `DSQ` (Disqualified): 21 entries
  * `Accident`: 20 entries
* **Classification Rules**: Interestingly, some DNF (28), Retired (17), DSQ (9), and Accident (14) entries still have a numerical `finish_position` recorded. This matches standard F1 rules where a driver completing $\ge 90\%$ of the race distance is classified in the final standings.

> [!TIP]
> **Mechanical Failures** are the primary cause of DNFs (8 occurrences), followed closely by **Power Unit**, **Gearbox**, and **Brake Failure** (6 occurrences each).

---

## 4. Key Relationships and Joins

1. **Circuit Overlap**: 
   * While `f1_circuits_700.csv` details 700 layouts, the race results in `f1_race_results_700.csv` only take place on **20 featured circuits**.
   * All 20 circuit IDs present in the results dataset have a perfect 1-to-1 matching record in the circuits dataset.
2. **Speed & Circuit Comparison**:
   * The fastest average lap speed recorded belongs to the **Nürburgring** (218.4 km/h), followed closely by **Hungaroring** (217.3 km/h).
   * The slowest average lap speed is found at **Silverstone** (204.1 km/h) and **Monaco** (204.7 km/h) in this simulation.
