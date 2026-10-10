import os
import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

CORRIDORS = [
    {"id": "HYD-COR-01", "name": "HITEC City - Cyber Towers Junction", "lat": 17.4504, "lon": 78.3808, "type": "Tech Corridor", "base_speed": 42.0, "base_vol": 3200},
    {"id": "HYD-COR-02", "name": "Gachibowli - ORR Junction", "lat": 17.4401, "lon": 78.3489, "type": "Express Corridor", "base_speed": 55.0, "base_vol": 3800},
    {"id": "HYD-COR-03", "name": "Jubilee Hills - Checkpost", "lat": 17.4319, "lon": 78.4073, "type": "Arterial", "base_speed": 38.0, "base_vol": 2900},
    {"id": "HYD-COR-04", "name": "Banjara Hills - Road No. 12", "lat": 17.4156, "lon": 78.4350, "type": "Commercial Avenue", "base_speed": 35.0, "base_vol": 2600},
    {"id": "HYD-COR-05", "name": "Panjagutta - Central Circle", "lat": 17.4260, "lon": 78.4526, "type": "Arterial", "base_speed": 32.0, "base_vol": 3400},
    {"id": "HYD-COR-06", "name": "Begumpet - Flyover Corridor", "lat": 17.4447, "lon": 78.4664, "type": "Arterial", "base_speed": 40.0, "base_vol": 3100},
    {"id": "HYD-COR-07", "name": "Secunderabad - Clock Tower", "lat": 17.4411, "lon": 78.4983, "type": "Urban Core", "base_speed": 30.0, "base_vol": 2800},
    {"id": "HYD-COR-08", "name": "Mehdipatnam - Rythu Bazar", "lat": 17.3916, "lon": 78.4414, "type": "Transit Hub", "base_speed": 28.0, "base_vol": 3500},
    {"id": "HYD-COR-09", "name": "Dilsukhnagar - Bus Depot Arterial", "lat": 17.3688, "lon": 78.5247, "type": "Commercial Avenue", "base_speed": 26.0, "base_vol": 3300},
    {"id": "HYD-COR-10", "name": "LB Nagar - Ring Road Junction", "lat": 17.3457, "lon": 78.5522, "type": "Ring Road", "base_speed": 48.0, "base_vol": 3600},
    {"id": "HYD-COR-11", "name": "Financial District - Wipro Circle", "lat": 17.4182, "lon": 78.3418, "type": "Tech Corridor", "base_speed": 44.0, "base_vol": 2900},
    {"id": "HYD-COR-12", "name": "Madhapur - 100ft Road", "lat": 17.4485, "lon": 78.3908, "type": "Commercial Avenue", "base_speed": 34.0, "base_vol": 2700},
]

def generate_dataset():
    np.random.seed(42)
    random.seed(42)

    start_date = datetime(2026, 9, 1, 0, 0, 0)
    num_days = 14
    hours = list(range(0, 24, 2))  # Every 2 hours = 12 timestamps per day * 14 days = 168 time points per corridor
    records = []

    # Inject a couple of realistic monsoon rain episodes
    rainy_days = {3, 4, 10}

    for day in range(num_days):
        current_day = start_date + timedelta(days=day)
        day_of_week = current_day.strftime("%A")
        is_weekend = 1 if current_day.weekday() >= 5 else 0
        is_rain_day = day in rainy_days

        for hour in hours:
            timestamp = current_day + timedelta(hours=hour)
            iso_time = timestamp.strftime("%Y-%m-%d %H:%M:%S")

            for cor in CORRIDORS:
                # Weather simulation
                if is_rain_day and (14 <= hour <= 20):
                    weather = "Rainy"
                    weather_speed_penalty = 14.0
                    vol_mult = 1.15
                elif is_rain_day:
                    weather = "Overcast"
                    weather_speed_penalty = 5.0
                    vol_mult = 1.0
                else:
                    weather = "Clear"
                    weather_speed_penalty = 0.0
                    vol_mult = 1.0

                # Hourly peak factors
                # Morning peak: 8 - 11 AM (hours 8, 10)
                # Evening peak: 5 - 9 PM (hours 18, 20)
                # Night: 0 - 6 AM
                if is_weekend:
                    if 12 <= hour <= 20:
                        hour_speed_factor = -6.0
                        vol_hour_factor = 1.2
                    elif 0 <= hour <= 6:
                        hour_speed_factor = 12.0
                        vol_hour_factor = 0.4
                    else:
                        hour_speed_factor = 0.0
                        vol_hour_factor = 0.9
                else:
                    if hour in (8, 10):  # Morning commute peak
                        hour_speed_factor = -14.0
                        vol_hour_factor = 1.6
                    elif hour in (18, 20):  # Evening commute peak
                        hour_speed_factor = -16.0
                        vol_hour_factor = 1.7
                    elif 0 <= hour <= 6:  # Late night free-flow
                        hour_speed_factor = 14.0
                        vol_hour_factor = 0.35
                    else:
                        hour_speed_factor = -2.0
                        vol_hour_factor = 1.05

                # Tech corridor specific surge on weekdays
                cor_type = cor["type"]
                if cor_type == "Tech Corridor" and not is_weekend and hour in (8, 10, 18, 20):
                    hour_speed_factor -= 5.0
                    vol_hour_factor += 0.2

                # Noise
                speed_noise = np.random.normal(0, 3.0)
                vol_noise = np.random.normal(0, 150)

                speed = cor["base_speed"] + hour_speed_factor - weather_speed_penalty + speed_noise
                speed = max(7.5, min(75.0, round(speed, 1)))

                volume = int(max(300, (cor["base_vol"] * vol_hour_factor * vol_mult) + vol_noise))

                # Inject deliberate anomalies for detection validation (e.g. unexpected sudden bottleneck)
                if cor["id"] == "HYD-COR-01" and day == 6 and hour == 14:
                    speed = 9.2  # Unscheduled lane stoppage
                    volume = 4350
                if cor["id"] == "HYD-COR-05" and day == 11 and hour == 4:
                    speed = 12.5  # Night maintenance
                    volume = 2100

                # Determine Congestion Level based on speed & capacity
                if speed < 16.0:
                    congestion = "Severe"
                elif speed < 26.0:
                    congestion = "High"
                elif speed < 38.0:
                    congestion = "Moderate"
                else:
                    congestion = "Low"

                records.append({
                    "timestamp": iso_time,
                    "segment_id": cor["id"],
                    "segment_name": cor["name"],
                    "latitude": cor["lat"],
                    "longitude": cor["lon"],
                    "road_type": cor["type"],
                    "hour": hour,
                    "day_of_week": day_of_week,
                    "is_weekend": is_weekend,
                    "weather": weather,
                    "avg_speed_kmh": speed,
                    "vehicle_count": volume,
                    "congestion_level": congestion
                })

    df = pd.DataFrame(records)
    out_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(out_dir, "hyderabad_traffic_corridors.csv")
    arff_path = os.path.join(out_dir, "hyderabad_traffic_corridors.arff")

    df.to_csv(csv_path, index=False)
    print(f"Generated {len(df)} records in {csv_path}")

    # Write ARFF format
    with open(arff_path, "w") as f:
        f.write("@relation hyderabad_traffic_corridors\n\n")
        f.write("@attribute timestamp string\n")
        f.write("@attribute segment_id string\n")
        f.write("@attribute segment_name string\n")
        f.write("@attribute latitude numeric\n")
        f.write("@attribute longitude numeric\n")
        f.write("@attribute road_type {'Tech Corridor','Express Corridor','Arterial','Commercial Avenue','Urban Core','Transit Hub','Ring Road'}\n")
        f.write("@attribute hour numeric\n")
        f.write("@attribute day_of_week {'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'}\n")
        f.write("@attribute is_weekend numeric\n")
        f.write("@attribute weather {'Clear','Overcast','Rainy'}\n")
        f.write("@attribute avg_speed_kmh numeric\n")
        f.write("@attribute vehicle_count numeric\n")
        f.write("@attribute congestion_level {'Low','Moderate','High','Severe'}\n\n")
        f.write("@data\n")
        for _, row in df.iterrows():
            f.write(f"'{row['timestamp']}','{row['segment_id']}','{row['segment_name']}',{row['latitude']},{row['longitude']},'{row['road_type']}',{row['hour']},'{row['day_of_week']}',{row['is_weekend']},'{row['weather']}',{row['avg_speed_kmh']},{row['vehicle_count']},'{row['congestion_level']}'\n")

    print(f"Generated ARFF in {arff_path}")

if __name__ == "__main__":
    generate_dataset()
