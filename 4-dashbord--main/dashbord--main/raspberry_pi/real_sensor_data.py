#!/usr/bin/env python3
"""
Script to send real sensor data from Raspberry Pi to Firebase.
This script reads data from actual sensors and sends it to Firebase.
"""
import time
import datetime
import json
import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

# Uncomment these imports when you have the actual sensors connected
# import board
# import adafruit_dht
# import RPi.GPIO as GPIO
# from gpiozero import MCP3008

# Firebase configuration
FIREBASE_CREDENTIALS_FILE = "fraisier-fa1be-firebase-adminsdk.json"
FIREBASE_DATABASE_URL = "https://fraisier-fa1be-default-rtdb.firebaseio.com"

# Update interval in seconds
DEFAULT_UPDATE_INTERVAL = 60  # 1 minute

# Pin configuration - adjust according to your setup
# DHT22_PIN = board.D4  # DHT22 on GPIO 4
# SOIL_MOISTURE_PIN = 0  # Analog pin for soil moisture sensor (MCP3008 channel 0)
# WATER_LEVEL_PIN = 1    # Analog pin for water level sensor (MCP3008 channel 1)
# LIGHT_SENSOR_PIN = 2   # Analog pin for light sensor (MCP3008 channel 2)
# PUMP_CONTROL_PIN = 17  # GPIO pin for pump control

# Sensor thresholds
TEMPERATURE_RANGE = (18, 28)  # °C
HUMIDITY_AIR_RANGE = (40, 80)  # %
HUMIDITY_SOIL_RANGE = (40, 80)  # %
WATER_LEVEL_RANGE = (20, 100)  # %
LIGHT_RANGE = (200, 1000)  # lux

def init_firebase():
    """Initialize Firebase connection"""
    try:
        # Check if Firebase is already initialized
        if not firebase_admin._apps:
            # Check if credentials file exists
            if not os.path.exists(FIREBASE_CREDENTIALS_FILE):
                print(f"Firebase credentials file '{FIREBASE_CREDENTIALS_FILE}' not found.")
                print("Please download real credentials from Firebase console.")
                print("1. Go to Firebase Console: https://console.firebase.google.com/")
                print("2. Select your project: fraisier-fa1be")
                print("3. Go to Project Settings > Service accounts")
                print("4. Click 'Generate new private key'")
                print(f"5. Save the downloaded file as {FIREBASE_CREDENTIALS_FILE}")
                return False

            try:
                # Initialize Firebase
                cred = credentials.Certificate(FIREBASE_CREDENTIALS_FILE)
                firebase_admin.initialize_app(cred, {
                    'databaseURL': FIREBASE_DATABASE_URL
                })
                print("Firebase initialized successfully")
                return True
            except Exception as e:
                print(f"Error initializing Firebase: {e}")
                print("This might be due to invalid credentials.")
                return False
        return True
    except Exception as e:
        print(f"Error in init_firebase: {e}")
        return False

def setup_gpio():
    """Setup GPIO pins for sensors and actuators"""
    try:
        # Uncomment these lines when you have the actual sensors connected
        # GPIO.setmode(GPIO.BCM)
        # GPIO.setup(PUMP_CONTROL_PIN, GPIO.OUT)
        # GPIO.output(PUMP_CONTROL_PIN, GPIO.LOW)  # Start with pump off
        
        # Initialize DHT22 sensor
        # dht_sensor = adafruit_dht.DHT22(DHT22_PIN)
        
        # Initialize MCP3008 ADC for analog sensors
        # adc = MCP3008()
        
        print("GPIO setup completed")
        return True
    except Exception as e:
        print(f"Error setting up GPIO: {e}")
        return False

def read_dht22():
    """Read temperature and humidity from DHT22 sensor"""
    try:
        # Uncomment these lines when you have the actual sensor connected
        # temperature = dht_sensor.temperature
        # humidity = dht_sensor.humidity
        
        # For testing without sensor, return dummy values
        temperature = 25.0
        humidity = 60.0
        
        return temperature, humidity
    except Exception as e:
        print(f"Error reading DHT22 sensor: {e}")
        return None, None

def read_soil_moisture():
    """Read soil moisture from analog sensor"""
    try:
        # Uncomment these lines when you have the actual sensor connected
        # raw_value = adc.read(SOIL_MOISTURE_PIN)
        # # Convert raw value to percentage (adjust these values based on your sensor)
        # min_moisture = 0.0   # Raw value when sensor is in air
        # max_moisture = 1.0   # Raw value when sensor is in water
        # moisture_percentage = 100 - ((raw_value - min_moisture) / (max_moisture - min_moisture) * 100)
        
        # For testing without sensor, return dummy value
        moisture_percentage = 65.0
        
        return moisture_percentage
    except Exception as e:
        print(f"Error reading soil moisture sensor: {e}")
        return None

def read_water_level():
    """Read water level from analog sensor"""
    try:
        # Uncomment these lines when you have the actual sensor connected
        # raw_value = adc.read(WATER_LEVEL_PIN)
        # # Convert raw value to percentage (adjust these values based on your sensor)
        # min_level = 0.0   # Raw value when sensor is empty
        # max_level = 1.0   # Raw value when sensor is full
        # level_percentage = ((raw_value - min_level) / (max_level - min_level) * 100)
        
        # For testing without sensor, return dummy value
        level_percentage = 75.0
        
        return level_percentage
    except Exception as e:
        print(f"Error reading water level sensor: {e}")
        return None

def read_light_sensor():
    """Read light level from analog sensor"""
    try:
        # Uncomment these lines when you have the actual sensor connected
        # raw_value = adc.read(LIGHT_SENSOR_PIN)
        # # Convert raw value to lux (adjust these values based on your sensor)
        # min_light = 0.0    # Raw value in darkness
        # max_light = 1.0    # Raw value in bright light
        # max_lux = 10000    # Maximum lux value
        # lux = raw_value * max_lux
        
        # For testing without sensor, return dummy value
        lux = 500.0
        
        return lux
    except Exception as e:
        print(f"Error reading light sensor: {e}")
        return None

def control_pump(soil_moisture):
    """Control the water pump based on soil moisture"""
    try:
        # Determine if pump should be active
        pump_active = soil_moisture < HUMIDITY_SOIL_RANGE[0]
        
        # Uncomment these lines when you have the actual pump connected
        # if pump_active:
        #     GPIO.output(PUMP_CONTROL_PIN, GPIO.HIGH)
        # else:
        #     GPIO.output(PUMP_CONTROL_PIN, GPIO.LOW)
        
        print(f"Pump {'activated' if pump_active else 'deactivated'}")
        return pump_active
    except Exception as e:
        print(f"Error controlling pump: {e}")
        return False

def update_data_in_firebase(temperature, humidity_air, humidity_soil, water_level, pump_active, light=None):
    """Update all sensor data in Firebase at the root level and in sensor_data collection"""
    try:
        # Get current timestamp
        timestamp = datetime.datetime.now().isoformat()

        # Create data object with all sensor values
        data = {
            'temperature': temperature,
            'humidity_air': humidity_air,
            'humidity_soil': humidity_soil,
            'water_level': water_level,
            'pump_active': pump_active,
            'timestamp': timestamp
        }

        # Add light data if provided
        if light is not None:
            data['light'] = light

        # Reference to the root of the database
        root_ref = db.reference('/')
        
        # Reference to the sensor_data collection
        sensor_data_ref = db.reference('/sensor_data')
        
        # 1. Update data at the root level for the frontend
        root_ref.update(data)
        
        # 2. Also add the data to the sensor_data collection for historical records
        # Use push() to create a new entry with a unique key
        sensor_data_ref.push(data)

        print(f"Updated Firebase with new sensor data at {timestamp}")
        print(f"  Temperature: {temperature:.2f}°C")
        print(f"  Humidity (Air): {humidity_air:.2f}%")
        print(f"  Humidity (Soil): {humidity_soil:.2f}%")
        print(f"  Water Level: {water_level:.2f}%")
        print(f"  Pump Active: {pump_active}")
        if light is not None:
            print(f"  Light: {light:.2f} lux")

        return True
    except Exception as e:
        print(f"Error updating data in Firebase: {e}")
        return False

def run_sensor_monitoring(update_interval=DEFAULT_UPDATE_INTERVAL):
    """Run continuous monitoring of sensors and update Firebase"""
    if not init_firebase():
        print("\nFailed to initialize Firebase. Exiting.")
        return

    if not setup_gpio():
        print("\nFailed to setup GPIO. Exiting.")
        return

    print(f"\nStarting sensor monitoring with update interval of {update_interval} seconds")
    print("Press Ctrl+C to stop the script\n")

    count = 0
    try:
        while True:
            count += 1
            print(f"\nReading #{count} - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

            # Read sensor values
            temperature, humidity_air = read_dht22()
            humidity_soil = read_soil_moisture()
            water_level = read_water_level()
            light = read_light_sensor()
            
            # Skip this iteration if any sensor reading failed
            if None in [temperature, humidity_air, humidity_soil, water_level]:
                print("One or more sensor readings failed. Skipping this update.")
                time.sleep(5)  # Short delay before retrying
                continue
            
            # Control the pump based on soil moisture
            pump_active = control_pump(humidity_soil)

            # Update Firebase
            update_data_in_firebase(
                temperature=temperature,
                humidity_air=humidity_air,
                humidity_soil=humidity_soil,
                water_level=water_level,
                pump_active=pump_active,
                light=light
            )

            # Wait for the next update
            print(f"Waiting {update_interval} seconds for next update...")
            time.sleep(update_interval)

    except KeyboardInterrupt:
        print("\nScript stopped by user")
    finally:
        # Clean up GPIO
        # Uncomment when you have actual hardware
        # GPIO.cleanup()
        print("GPIO cleaned up")

    print("\nScript completed")

if __name__ == "__main__":
    # Run sensor monitoring with 1-minute intervals
    run_sensor_monitoring(update_interval=60)
