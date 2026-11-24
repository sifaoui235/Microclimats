#!/usr/bin/env python3
"""
Script to create a placeholder Firebase credentials file for testing.
NOTE: This is only for testing the structure of the demo script.
You MUST replace this with real credentials from Firebase console before actual use.
"""
import json
import os

# Firebase project details
PROJECT_ID = "fraisier-fa1be"
CREDENTIALS_FILE = "fraisier-fa1be-firebase-adminsdk.json"

def create_placeholder_credentials():
    """Create a placeholder credentials file"""
    if os.path.exists(CREDENTIALS_FILE):
        print(f"Warning: {CREDENTIALS_FILE} already exists. Not overwriting.")
        return False
    
    # Create a placeholder structure (this will NOT work with Firebase)
    placeholder = {
        "type": "service_account",
        "project_id": PROJECT_ID,
        "private_key_id": "PLACEHOLDER - REPLACE WITH ACTUAL CREDENTIALS",
        "private_key": "PLACEHOLDER - REPLACE WITH ACTUAL CREDENTIALS",
        "client_email": f"firebase-adminsdk-xxxxx@{PROJECT_ID}.iam.gserviceaccount.com",
        "client_id": "PLACEHOLDER",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40{PROJECT_ID}.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    }
    
    # Write to file
    with open(CREDENTIALS_FILE, 'w') as f:
        json.dump(placeholder, f, indent=2)
    
    print(f"Created placeholder credentials file: {CREDENTIALS_FILE}")
    print("WARNING: This is a placeholder file and will NOT work with Firebase.")
    print("You MUST replace this with real credentials from Firebase console.")
    print("\nTo get real credentials:")
    print("1. Go to Firebase Console: https://console.firebase.google.com/")
    print(f"2. Select your project: {PROJECT_ID}")
    print("3. Go to Project Settings > Service accounts")
    print("4. Click 'Generate new private key'")
    print(f"5. Save the downloaded file as {CREDENTIALS_FILE}")
    
    return True

if __name__ == "__main__":
    create_placeholder_credentials()
