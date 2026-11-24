#!/usr/bin/env python3
"""
Script to fix the Firebase data structure by moving the latest sensor data to the root level.
This will make the data compatible with the frontend web app.
"""
import time
import json
import datetime
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

# Firebase configuration
FIREBASE_CREDENTIALS_FILE = "fraisier-fa1be-firebase-adminsdk.json"
FIREBASE_DATABASE_URL = "https://fraisier-fa1be-default-rtdb.firebaseio.com"

def init_firebase():
    """Initialize Firebase connection"""
    try:
        # Check if Firebase is already initialized
        if not firebase_admin._apps:
            # Initialize Firebase
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_FILE)
            firebase_admin.initialize_app(cred, {
                'databaseURL': FIREBASE_DATABASE_URL
            })
            print("Firebase initialized successfully")
            return True
        return True
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return False

def get_current_data():
    """Get current data from Firebase"""
    try:
        # Reference to the root of the database
        root_ref = db.reference('/')
        
        # Get current data
        data = root_ref.get()
        
        print("Current data in Firebase:")
        print(json.dumps(data, indent=2) if data else "No data found")
        
        return data
    except Exception as e:
        print(f"Error getting data from Firebase: {e}")
        return None

def get_latest_sensor_data(data):
    """Extract the latest sensor data from the current structure"""
    if not data or 'sensor_data' not in data:
        print("No sensor data found in Firebase")
        return None
    
    sensor_data = data['sensor_data']
    print(f"Found {len(sensor_data)} sensor data entries")
    
    # Find the entry with the latest timestamp
    latest_entry = None
    latest_timestamp = None
    
    for key, entry in sensor_data.items():
        if 'timestamp' in entry:
            timestamp = entry['timestamp']
            if latest_timestamp is None or timestamp > latest_timestamp:
                latest_timestamp = timestamp
                latest_entry = entry
    
    if latest_entry:
        print(f"Latest entry found with timestamp: {latest_timestamp}")
        print(json.dumps(latest_entry, indent=2))
        return latest_entry
    else:
        print("No valid entries found with timestamp")
        return None

def create_root_level_data(sensor_entry):
    """Create a data structure at the root level based on the sensor entry"""
    if not sensor_entry:
        return None
    
    # Create the root level data structure
    root_data = {
        'temperature': float(sensor_entry.get('temperature', 0)),
        'humidity_air': float(sensor_entry.get('humidity_air', 0)),
        'humidity_soil': float(sensor_entry.get('humidity_soil', 0)),
        'water_level': float(sensor_entry.get('water_level', 0)),
        'pump_active': bool(sensor_entry.get('pump_active', False)),
        'timestamp': sensor_entry.get('timestamp', datetime.datetime.now().isoformat())
    }
    
    print("Created root level data:")
    print(json.dumps(root_data, indent=2))
    
    return root_data

def update_firebase_root(data):
    """Update the root level of Firebase with the provided data"""
    try:
        # Reference to the root of the database
        root_ref = db.reference('/')
        
        # Update data
        root_ref.set(data)
        
        print("Firebase root data updated successfully")
        return True
    except Exception as e:
        print(f"Error updating Firebase root data: {e}")
        return False

def main():
    """Main function"""
    print("Starting Firebase structure fix...")
    
    # Initialize Firebase
    if not init_firebase():
        print("Failed to initialize Firebase")
        return
    
    # Get current data
    current_data = get_current_data()
    if not current_data:
        print("No data found in Firebase")
        return
    
    # Get the latest sensor data
    latest_sensor_data = get_latest_sensor_data(current_data)
    if not latest_sensor_data:
        print("No latest sensor data found")
        return
    
    # Create root level data
    root_data = create_root_level_data(latest_sensor_data)
    if not root_data:
        print("Failed to create root level data")
        return
    
    # Update Firebase root
    if update_firebase_root(root_data):
        print("Firebase structure fixed successfully")
    else:
        print("Failed to fix Firebase structure")
    
    print("Done")

if __name__ == "__main__":
    main()
