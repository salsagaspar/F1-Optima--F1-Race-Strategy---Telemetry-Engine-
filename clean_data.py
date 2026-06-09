import pandas as pd
import numpy as np

circuits_path = r"c:\Users\hpvic\OneDrive\Documents\F1 Race\f1_circuits_700.csv"
results_path = r"c:\Users\hpvic\OneDrive\Documents\F1 Race\f1_race_results_700.csv"

# Load using UTF-8 (since the files are already valid UTF-8 and contain correct non-ASCII characters like Nürburgring)
circuits_df = pd.read_csv(circuits_path, encoding='utf-8')
results_df = pd.read_csv(results_path, encoding='utf-8')

print("--- Data Cleaning In Progress (UTF-8 Mode) ---")

# 1. Standardize text whitespace (preserving NaNs)
for col in circuits_df.select_dtypes(include=['object']).columns:
    circuits_df[col] = circuits_df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)

for col in results_df.select_dtypes(include=['object']).columns:
    results_df[col] = results_df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)

# 2. Clean 'dnf_reason' in results based on 'race_status'
print(f"Null dnf_reason count before: {results_df['dnf_reason'].isnull().sum()}")

def map_dnf_reason(row):
    status = row['race_status']
    reason = row['dnf_reason']
    if pd.isnull(reason) or str(reason).strip().lower() == 'nan':
        if status == 'Finished':
            return 'None'
        elif status == 'DSQ':
            return 'Disqualified'
        elif status == 'Accident':
            return 'Collision / Crash'
        elif status == 'Retired':
            return 'Mechanical Issue'
        elif status == 'DNF':
            return 'Technical Issue'
    return reason

results_df['dnf_reason'] = results_df.apply(map_dnf_reason, axis=1)
print(f"Null dnf_reason count after: {results_df['dnf_reason'].isnull().sum()}")

# 3. Clean 'safety_car_event' in results
print(f"Null safety_car_event count before: {results_df['safety_car_event'].isnull().sum()}")
results_df['safety_car_event'] = results_df['safety_car_event'].fillna('None')
print(f"Null safety_car_event count after: {results_df['safety_car_event'].isnull().sum()}")

# 4. Save cleaned datasets to UTF-8
cleaned_circuits_path = r"c:\Users\hpvic\OneDrive\Documents\F1 Race\f1_circuits_cleaned.csv"
cleaned_results_path = r"c:\Users\hpvic\OneDrive\Documents\F1 Race\f1_race_results_cleaned.csv"

circuits_df.to_csv(cleaned_circuits_path, index=False, encoding='utf-8')
results_df.to_csv(cleaned_results_path, index=False, encoding='utf-8')

print("\n--- Cleaning Complete ---")
print(f"Saved cleaned circuits to: {cleaned_circuits_path}")
print(f"Saved cleaned race results to: {cleaned_results_path}")
