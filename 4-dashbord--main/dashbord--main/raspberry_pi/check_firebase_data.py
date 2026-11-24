#!/usr/bin/env python3
"""
Script to check and fix the Firebase data structure to match what the dashboard expects.
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
        print(json.dumps(data, indent=2) if data else "No data found")
        
        return data
    except Exception as e:
        print(f"Error getting data from Firebase: {e}")
        return None

def check_data_structure(data):
    """Check if the data structure matches what the dashboard expects"""
    if not data:
        print("No data to check")
        return False
    
    # Check if data is already in the expected format
    expected_keys = ['temperature', 'humidity_air', 'humidity_soil', 'water_level', 'pump_active', 'timestamp']
    missing_keys = [key for key in expected_keys if key not in data]
    
    if not missing_keys:
        print("Data structure is correct")
        print("Available keys:", list(data.keys()))
        return True
    
    print("Data structure is incorrect")
    print("Expected keys:", expected_keys)
    print("Available keys:", list(data.keys()))
    print("Missing keys:", missing_keys)
    return False

def create_test_data():
    """Create test data with the expected structure"""
    test_data = {
        'temperature': 22.5,
        'humidity_air': 65.0,
        'humidity_soil': 75.0,
        'water_level': 80.0,
        'pump_active': True,
        'timestamp': datetime.datetime.now().isoformat(),
        'light': 500.0
    }
    
    print("Created test data:")
    print(json.dumps(test_data, indent=2))
    
    return test_data

def update_firebase_data(data):
    """Update Firebase with the provided data"""
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
    print("Starting Firebase data check...")
    
    # Initialize Firebase
    if not init_firebase():
        print("Failed to initialize Firebase")
        return
    
    # Get current data
    current_data = get_current_data()
    
    # Check data structure
    is_correct = check_data_structure(current_data)
    
    if not is_correct:
        print("\nWould you like to update the data structure? (y/n)")
        choice = input().lower()
        
        if choice == 'y':
            # Create test data
            test_data = create_test_data()
            
            # Update Firebase with test data
            update_firebase_data(test_data)
    
    print("Done")

if __name__ == "__main__":
    main()
