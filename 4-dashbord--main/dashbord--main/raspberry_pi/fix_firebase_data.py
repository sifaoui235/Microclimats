#!/usr/bin/env python3
"""
Script to fix the Firebase data structure to match what the dashboard expects.
This script reads the current data from Firebase and restructures it if needed.
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
        print(json.dumps(data, indent=2))
        
        return data
    except Exception as e:
        print(f"Error getting data from Firebase: {e}")
        return None

def fix_data_structure(data):
    """Fix the data structure to match what the dashboard expects"""
    if not data:
        print("No data to fix")
        return None
    
    # Check if data is already in the expected format
    expected_keys = ['temperature', 'humidity_air', 'humidity_soil', 'water_level', 'pump_active', 'timestamp']
    missing_keys = [key for key in expected_keys if key not in data]
    
    if not missing_keys:
        print("Data structure is already correct")
        return data
    
    print(f"Missing keys: {missing_keys}")
    
    # Create a new data structure with the expected keys
    fixed_data = {
        'temperature': 0.0,
        'humidity_air': 0.0,
        'humidity_soil': 0.0,
        'water_level': 0.0,
        'pump_active': False,
        'timestamp': datetime.datetime.now().isoformat(),
        'light': 0.0
    }
    
    # Copy existing data to the new structure
    for key in data:
        if key in fixed_data:
            fixed_data[key] = data[key]
    
    # Handle special cases
    if 'humidity' in data and 'humidity_air' not in data:
        fixed_data['humidity_air'] = data['humidity']
    
    if 'soil_moisture' in data and 'humidity_soil' not in data:
        fixed_data['humidity_soil'] = data['soil_moisture']
    
    if 'water' in data and 'water_level' not in data:
        fixed_data['water_level'] = data['water']
    
    if 'pump' in data and 'pump_active' not in data:
        fixed_data['pump_active'] = bool(data['pump'])
    
    print("Fixed data structure:")
    print(json.dumps(fixed_data, indent=2))
    
    return fixed_data

def update_firebase_data(data):
    """Update Firebase with the fixed data structure"""
    try:
        # Reference to the root of the database
        root_ref = db.reference('/')
        
        # Update data
        root_ref.set(data)
        
        print("Firebase data updated successfully")
        return True
    except Exception as e:
        print(f"Error updating Firebase data: {e}")
        return False

def main():
    """Main function"""
    print("Starting Firebase data structure fix...")
    
    # Initialize Firebase
    if not init_firebase():
        print("Failed to initialize Firebase")
        return
    
    # Get current data
    current_data = get_current_data()
    
    # Fix data structure
    fixed_data = fix_data_structure(current_data)
    
    if fixed_data:
        # Update Firebase with fixed data
        update_firebase_data(fixed_data)
    
    print("Done")

if __name__ == "__main__":
    main()
