#!/usr/bin/env python3
"""
Script to read sensor data from Raspberry Pi and send it to Firebase.
Adapt this script to your specific sensors.
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

# Sensor ranges (min and max values for validation)
TEMPERATURE_RANGE = (18, 28)  # °C
HUMIDITY_AIR_RANGE = (40, 80)  # %
HUMIDITY_SOIL_RANGE = (40, 80)  # %
WATER_LEVEL_RANGE = (20, 100)  # %
LIGHT_RANGE = (200, 1000)  # lux

# Pin configuration - adjust according to your setup
# TEMP_HUMIDITY_PIN = board.D4  # DHT22 on GPIO 4
# LIGHT_SENSOR_PIN = 0  # Analog pin for light sensor
# WATER_LEVEL_PIN = 17  # GPIO pin for water level sensor
# SOIL_MOISTURE_PIN = 1  # Analog pin for soil moisture sensor
# PUMP_CONTROL_PIN = 18  # GPIO pin for pump control

class SensorReader:
    def __init__(self):
        # Initialize Firebase
        self.init_firebase()

        # Initialize sensors
        self.init_sensors()

    def init_firebase(self):
        """Initialize Firebase connection"""
        try:
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_FILE)
            firebase_admin.initialize_app(cred, {
                'databaseURL': FIREBASE_DATABASE_URL
            })
            print("Firebase initialized successfully")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            raise

    def init_sensors(self):
        """Initialize sensors - adapt this to your specific hardware"""
        try:
            # Example for DHT22 temperature/humidity sensor
            # self.dht_device = adafruit_dht.DHT22(TEMP_HUMIDITY_PIN)

            # Example for GPIO setup
            # GPIO.setmode(GPIO.BCM)
            # GPIO.setup(WATER_LEVEL_PIN, GPIO.IN)
            # GPIO.setup(PUMP_CONTROL_PIN, GPIO.OUT)

            print("Sensors initialized successfully")
        except Exception as e:
            print(f"Error initializing sensors: {e}")
            raise

    def read_temperature(self):
        """Read temperature from sensor - replace with your actual sensor code"""
        try:
            # Example for DHT22 sensor
            # temperature = self.dht_device.temperature

            # For testing, generate a random value
            import random
            temperature = 20 + random.uniform(-2, 5)  # Random value between 18-25°C
            return temperature
        except Exception as e:
            print(f"Error reading temperature: {e}")
            return None

    def read_humidity_air(self):
        """Read air humidity from sensor - replace with your actual sensor code"""
        try:
            # Example for DHT22 sensor
            # humidity = self.dht_device.humidity

            # For testing, generate a random value
            import random
            humidity = 60 + random.uniform(-20, 20)  # Random value between 40-80%
            return humidity
        except Exception as e:
            print(f"Error reading air humidity: {e}")
            return None

    def read_humidity_soil(self):
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

    def read_light(self):
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

    def read_water_level(self):
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

    def read_pump_state(self):
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

    def update_data_in_firebase(self, temperature, humidity_air, humidity_soil, water_level, pump_active, light=None):
        """Update all sensor data in Firebase at the root level"""
        try:
            # Get current timestamp
            timestamp = datetime.datetime.now().isoformat()

            # Reference to the root of the database
            root_ref = db.reference('/')

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

            # Update all data at once
            root_ref.set(data)

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

    def update_all_sensors(self):
        """Read all sensors and update Firebase"""
        # Read all sensor values
        temperature = self.read_temperature()
        humidity_air = self.read_humidity_air()
        humidity_soil = self.read_humidity_soil()
        water_level = self.read_water_level()
        pump_active = self.read_pump_state()
        light = self.read_light()

        # Check if all required values are available
        if None in [temperature, humidity_air, humidity_soil, water_level]:
            print("Error: One or more required sensor readings failed")
            return False

        # Update Firebase with all sensor data
        return self.update_data_in_firebase(
            temperature=temperature,
            humidity_air=humidity_air,
            humidity_soil=humidity_soil,
            water_level=water_level,
            pump_active=pump_active,
            light=light
        )

def main(interval=60, iterations=None):
    """Main function to read sensors and update Firebase

    Args:
        interval: Time in seconds between updates
        iterations: Number of updates to perform (None for infinite)
    """
    try:
        print("Initializing sensor reader...")
        sensor_reader = SensorReader()

        count = 0
        running = True

        print(f"Starting sensor readings with {interval} second intervals")
        print("Press Ctrl+C to stop")

        while running:
            count += 1
            print(f"\nUpdate #{count} - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

            # Update all sensors
            if sensor_reader.update_all_sensors():
                print("Sensor data updated successfully")
            else:
                print("Failed to update sensor data")

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
    except Exception as e:
        print(f"Error in main function: {e}")

if __name__ == "__main__":
    # Run with 60-second intervals, indefinitely
    # Use Ctrl+C to stop
    main(interval=60)
