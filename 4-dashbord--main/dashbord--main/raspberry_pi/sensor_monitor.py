#!/usr/bin/env python3
"""
Script to continuously monitor sensors and send data to Firebase.
"""
import time
from read_sensors import SensorReader

# Update interval in seconds
UPDATE_INTERVAL = 60  # Update every minute

def main():
    """Main function to continuously read sensors and update Firebase"""
    try:
        print("Starting sensor monitoring...")
        sensor_reader = SensorReader()
        
        while True:
            try:
                # Update all sensors
                sensor_reader.update_all_sensors()
                print(f"Sensor data updated. Next update in {UPDATE_INTERVAL} seconds.")
                
                # Wait for the next update
                time.sleep(UPDATE_INTERVAL)
            except Exception as e:
                print(f"Error updating sensors: {e}")
                print(f"Retrying in {UPDATE_INTERVAL} seconds...")
                time.sleep(UPDATE_INTERVAL)
    except KeyboardInterrupt:
        print("Monitoring stopped by user")
    except Exception as e:
        print(f"Fatal error in monitoring: {e}")

if __name__ == "__main__":
    main()
