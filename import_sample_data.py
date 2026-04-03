import pandas as pd
import sqlite3
from datetime import datetime

# Read the CSV file
df = pd.read_csv('sample_data.csv')

# Connect to SQLite database (using logs.db as per database.js)
conn = sqlite3.connect('server/logs.db')
cursor = conn.cursor()

print("📥 Importing sample data into database...\n")

# Map CSV columns to database columns
for idx, row in df.iterrows():
    try:
        # Map numeric mood to new mood values
        mood_mapping = {
            5: 'happy',
            4: 'calm',
            3: 'neutral',  # fallback for old data
            2: 'tired',    # fallback for old data
            1: 'sad'       # fallback for old data
        }
        mood_value = mood_mapping.get(int(row['mood']), 'calm')  # default to calm
        
        query = """
        INSERT OR REPLACE INTO logs 
        (date, energyLevel, productivityRating, mood, symptoms, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        cursor.execute(query, (
            row['date'],
            int(row['energy']),
            int(row['mood']),  # Using mood as productivity rating for demo data
            mood_value,
            row['symptoms'],
            row['notes'],
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
    except Exception as e:
        print(f"⚠️  Error inserting row {idx}: {e}")

conn.commit()
print(f"✅ Successfully imported {idx + 1} logs into database")

# Insert cycle info
try:
    cycle_query = """
    INSERT OR REPLACE INTO cycle_info (id, cycleLength, periodDuration, lastPeriodStartDate, isConfigured, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    cursor.execute(cycle_query, (
        1, 28, 5, '2026-01-17', 1, 
        datetime.now().isoformat(),
        datetime.now().isoformat()
    ))
    conn.commit()
    print("✅ Successfully imported cycle info into database")
except Exception as e:
    print(f"⚠️ Error importing cycle info: {e}")

# Verify data
try:
    verify_logs = pd.read_sql_query("SELECT COUNT(*) as total FROM logs", conn)
    verify_cycle = pd.read_sql_query("SELECT * FROM cycle_info LIMIT 1", conn)
    
    print(f"\n📊 Database Status:")
    print(f"   Total logs: {verify_logs['total'][0]}")
    if len(verify_cycle) > 0:
        print(f"   Cycle length: {verify_cycle['cycleLength'][0]} days")
        print(f"   Last period: {verify_cycle['lastPeriodStartDate'][0]}")
except Exception as e:
    print(f"Error verifying: {e}")

conn.close()
print("\n✅ Data import complete! Database is ready for Streamlit analysis.")
