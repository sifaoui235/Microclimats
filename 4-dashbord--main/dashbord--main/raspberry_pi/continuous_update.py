#!/usr/bin/env python3
"""
Script to continuously update the root level of Firebase with the latest sensor data.
This will run in the background and keep the root level data in sync with the latest sensor data.
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

# Update interval in seconds
UPDATE_INTERVAL = 10

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

def get_latest_sensor_data():
    """Get the latest sensor data from Firebase"""
    try:
        # Reference to the sensor_data node
        sensor_data_ref = db.reference('/sensor_data')
        
        # Get all sensor data
        sensor_data = sensor_data_ref.get()
        
        if not sensor_data:
            print("No sensor data found")
            return None
        
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
            return latest_entry
        else:
            print("No valid entries found with timestamp")
            return None
    except Exception as e:
        print(f"Error getting latest sensor data: {e}")
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
    
    return root_data

def update_firebase_root(data):
    """Update the root level of Firebase with the provided data"""
    try:
        # Reference to the root of the database
        root_ref = db.reference('/')
        
        # Update data at root level while preserving sensor_data
        current_data = root_ref.get() or {}
        
        # Keep sensor_data if it exists
        if 'sensor_data' in current_data:
            data['sensor_data'] = current_data['sensor_data']
        
        # Update root data
        root_ref.update(data)
        
        print("Firebase root data updated successfully")
        return True
    except Exception as e:
        print(f"Error updating Firebase root data: {e}")
        return False

def main():
    """Main function"""
    print("Starting continuous update service...")
    
    # Initialize Firebase
    if not init_firebase():
        print("Failed to initialize Firebase")
        return
    
    print(f"Service running. Will update every {UPDATE_INTERVAL} seconds. Press Ctrl+C to stop.")
    
    try:
        while True:
            # Get the latest sensor data
            latest_sensor_data = get_latest_sensor_data()
            
            if latest_sensor_data:
                # Create root level data
                root_data = create_root_level_data(latest_sensor_data)
                
                if root_data:
                    # Update Firebase root
                    update_firebase_root(root_data)
                    print(f"Updated root data: {json.dumps(root_data, indent=2)}")
                else:
                    print("Failed to create root level data")
            else:
                print("No latest sensor data found")
            
            # Wait for the next update
            print(f"Waiting {UPDATE_INTERVAL} seconds for next update...")
            time.sleep(UPDATE_INTERVAL)
    
    except KeyboardInterrupt:
        print("Service stopped by user")
    except Exception as e:
        print(f"Service stopped due to error: {e}")
    
    print("Service stopped")

if __name__ == "__main__":
    main()
