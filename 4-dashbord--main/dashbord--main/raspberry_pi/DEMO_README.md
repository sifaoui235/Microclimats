# Firebase Demo for Raspberry Pi

This demo allows you to test sending data to Firebase from your Raspberry Pi without needing any physical sensors connected.

## Quick Start

1. **Install Firebase Admin SDK**:
   ```bash
   pip install firebase-admin
   ```

2. **Get Firebase Credentials**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `fraisier-fa1be`
   - Go to Project Settings > Service accounts
   - Click "Generate new private key"
   - Save the file as `fraisier-fa1be-firebase-adminsdk.json` in this directory

3. **Run the demo**:
   ```bash
   python firebase_demo.py
   ```

## What the Demo Does

- Connects to your Firebase Realtime Database
- Creates sensor entries if they don't exist
- Sends random sensor values every 10 seconds
- Occasionally generates values outside thresholds to trigger alerts
- Updates the sensor history

## Troubleshooting

If you don't have Firebase credentials yet, you can create a placeholder file:
```bash
python create_test_credentials.py
```
But remember, this placeholder won't actually work with Firebase - you'll need to replace it with real credentials.

## Customizing the Demo

- Change the update interval by modifying the `update_interval` parameter in `run_demo()`
- Set a specific number of iterations by setting the `iterations` parameter
- Modify the sensor ranges in the `SENSORS` list

## Next Steps

After confirming the demo works:
1. Set up your actual sensors
2. Modify the `read_sensors.py` script to use your real sensors
3. Set up the service to run automatically at boot
