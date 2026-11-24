#!/usr/bin/env python3
"""
Script to send sensor data to Firebase in the correct format.
This script reads data from sensors and sends it to Firebase in the format expected by the dashboard.
"""
import time
import json
import datetime
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

# Uncomment and import the libraries for your specific sensors
# import RPi.GPIO as GPIO
# import board
# import adafruit_dht
# import smbus2

# Firebase configuration
FIREBASE_CREDENTIALS_FILE = "fraisier-fa1be-firebase-adminsdk.json"
FIREBASE_DATABASE_URL = "https://fraisier-fa1be-default-rtdb.firebaseio.com"

# Pin configuration - adjust according to your setup
# TEMP_HUMIDITY_PIN = board.D4  # DHT22 on GPIO 4
# LIGHT_SENSOR_PIN = 0  # Analog pin for light sensor
# WATER_LEVEL_PIN = 17  # GPIO pin for water level sensor
# SOIL_MOISTURE_PIN = 1  # Analog pin for soil moisture sensor
# PUMP_CONTROL_PIN = 18  # GPIO pin for pump control

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

def init_sensors():
    """Initialize sensors - adapt this to your specific hardware"""
    try:
        # Example for DHT22 temperature/humidity sensor
        # dht_device = adafruit_dht.DHT22(TEMP_HUMIDITY_PIN)
        
        # Example for GPIO setup
        # GPIO.setmode(GPIO.BCM)
        # GPIO.setup(WATER_LEVEL_PIN, GPIO.IN)
        # GPIO.setup(PUMP_CONTROL_PIN, GPIO.OUT)
        
        print("Sensors initialized successfully")
        return True
    except Exception as e:
        print(f"Error initializing sensors: {e}")
        return False

def read_temperature():
    """Read temperature from sensor - replace with your actual sensor code"""
    try:
        # Example for DHT22 sensor
        # temperature = dht_device.temperature
        
        # For testing, generate a random value
        import random
        temperature = 20 + random.uniform(-2, 5)  # Random value between 18-25°C
        return temperature
    except Exception as e:
        print(f"Error reading temperature: {e}")
        return None

def read_humidity_air():
    """Read air humidity from sensor - replace with your actual sensor code"""
    try:
        # Example for DHT22 sensor
        # humidity = dht_device.humidity
        
        # For testing, generate a random value
        import random
        humidity = 60 + random.uniform(-20, 20)  # Random value between 40-80%
        return humidity
    except Exception as e:
        print(f"Error reading air humidity: {e}")
        return None

def read_humidity_soil():
    """Read soil humidity from sensor - replace with your actual sensor code"""
    try:
        # Example for soil moisture sensor
        # Use ADC to read analog value
        # Convert to percentage
        
        # For testing, generate a random value
        import random
        humidity = 60 + random.uniform(-20, 20)  # Random value between 40-80%
        return humidity
    except Exception as e:
        print(f"Error reading soil humidity: {e}")
        return None

def read_light():
    """Read light level - replace with your actual sensor code"""
    try:
        # Example for light sensor
        # Use ADC or I2C sensor code here
        
        # For testing, generate a random value
        import random
        light = 600 + random.uniform(-400, 400)  # Random value between 200-1000 lux
        return light
    except Exception as e:
        print(f"Error reading light level: {e}")
        return None

def read_water_level():
    """Read water level - replace with your actual sensor code"""
    try:
        # Example for water level sensor
        # water_level = GPIO.input(WATER_LEVEL_PIN)
        
        # For testing, generate a random value
        import random
        water_level = 60 + random.uniform(-40, 40)  # Random value between 20-100%
        return water_level
    except Exception as e:
        print(f"Error reading water level: {e}")
        return None

def read_pump_state():
    """Read pump state - replace with your actual sensor code"""
    try:
        # Example for pump state
        # pump_state = GPIO.input(PUMP_CONTROL_PIN)
        
        # For testing, generate a random value
        import random
        pump_state = random.choice([True, False])
        return pump_state
    except Exception as e:
        print(f"Error reading pump state: {e}")
        return False

def send_data_to_firebase(data):
    """Send data to Firebase"""
    try:
        # Reference to the root of the database
        root_ref = db.reference('/')
        
        # Update data
        root_ref.set(data)
        
        print("Data sent to Firebase successfully")
        return True
    except Exception as e:
        print(f"Error sending data to Firebase: {e}")
        return False

def read_and_send_data():
    """Read data from sensors and send it to Firebase"""
    # Read sensor values
    temperature = read_temperature()
    humidity_air = read_humidity_air()
    humidity_soil = read_humidity_soil()
    water_level = read_water_level()
    pump_active = read_pump_state()
    light = read_light()
    
    # Check if all required values are available
    if None in [temperature, humidity_air, humidity_soil, water_level]:
        print("Error: One or more required sensor readings failed")
        return False
    
    # Create data object
    data = {
        'temperature': temperature,
        'humidity_air': humidity_air,
        'humidity_soil': humidity_soil,
        'water_level': water_level,
        'pump_active': pump_active,
        'timestamp': datetime.datetime.now().isoformat()
    }
    
    # Add light data if available
    if light is not None:
        data['light'] = light
    
    # Print data
    print("Sensor data:")
    print(json.dumps(data, indent=2))
    
    # Send data to Firebase
    return send_data_to_firebase(data)

def main(interval=60, iterations=None):
    """Main function"""
    print("Starting sensor data collection and Firebase upload...")
    
    # Initialize Firebase
    if not init_firebase():
        print("Failed to initialize Firebase")
        return
    
    # Initialize sensors
    if not init_sensors():
        print("Failed to initialize sensors")
        return
    
    count = 0
    running = True
    
    print(f"Starting sensor readings with {interval} second intervals")
    print("Press Ctrl+C to stop")
    
    try:
        while running:
            count += 1
            print(f"\nUpdate #{count} - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Read and send data
            if read_and_send_data():
                print("Data update successful")
            else:
                print("Data update failed")
            
            # Check if we've reached the requested number of iterations
            if iterations is not None and count >= iterations:
                running = False
                print(f"Completed {iterations} iterations")
            
            # Wait for the next update if we're continuing
            if running:
                print(f"Waiting {interval} seconds for next update...")
                time.sleep(interval)
    
    except KeyboardInterrupt:
        print("\nStopped by user")
    
    print("Done")

if __name__ == "__main__":
    # Run with 60-second intervals, indefinitely
    # Use Ctrl+C to stop
    main(interval=10, iterations=3)  # For testing, run 3 iterations with 10-second intervals
