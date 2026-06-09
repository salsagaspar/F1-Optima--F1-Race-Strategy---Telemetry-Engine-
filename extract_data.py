import pandas as pd
import json
import os

circuits_path = r"c:\Users\hpvic\OneDrive\Documents\F1 Race\f1_circuits_engineered.csv"
results_path = r"c:\Users\hpvic\OneDrive\Documents\F1 Race\f1_race_results_engineered.csv"

circuits_df = pd.read_csv(circuits_path)
results_df = pd.read_csv(results_path)

# Extract unique drivers and teams (10 rows)
drivers_df = results_df[['driver_name', 'team_name', 'driver_avg_finish_pos', 'team_avg_points']].drop_duplicates().reset_index(drop=True)
drivers_list = drivers_df.to_dict(orient='records')

# Extract all 700 circuits
circuits_list = circuits_df[[
    'circuit_id', 'circuit_name', 'city', 'country', 'track_length_km', 
    'number_of_turns', 'turns_per_km', 'elevation_change_m', 
    'elevation_intensity', 'pit_lane_length_m', 'pit_stop_overhead_sec', 
    'track_speed_category', 'avg_temp_max_c'
]].to_dict(orient='records')

# Combine into one data object
f1_data = {
    "drivers": drivers_list,
    "circuits": circuits_list
}

# Create output folder if it doesn't exist
output_dir = r"c:\Users\hpvic\OneDrive\Documents\F1 Race\strategy_optimizer"
os.makedirs(output_dir, exist_ok=True)

# 1. Save as JSON
json_path = os.path.join(output_dir, "f1_data.json")
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(f1_data, f, indent=2, ensure_ascii=False)

# 2. Save as JS variable (to bypass browser CORS file:// blocks)
js_path = os.path.join(output_dir, "f1_data.js")
with open(js_path, 'w', encoding='utf-8') as f:
    f.write(f"const F1_DATA = {json.dumps(f1_data, indent=2, ensure_ascii=False)};\n")

print(f"Data successfully extracted and saved to:")
print(f" - JSON: {json_path}")
print(f" - JS: {js_path}")
print(f"Total circuits: {len(circuits_list)}")
print(f"Total drivers: {len(drivers_list)}")
