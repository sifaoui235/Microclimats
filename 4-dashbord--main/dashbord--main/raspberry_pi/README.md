# Raspberry Pi Sensor Monitoring for Firebase

Ce dossier contient des scripts pour lire les données des capteurs d'un Raspberry Pi et les envoyer à Firebase Realtime Database.

## Prérequis

- Raspberry Pi avec Raspbian/Raspberry Pi OS installé
- Python 3.6 ou supérieur
- Capteurs connectés (température, humidité, luminosité, niveau d'eau)
- Projet Firebase avec Realtime Database activé

## Installation

1. **Installer les packages Python requis**

```bash
pip3 install firebase-admin
# Installer les bibliothèques pour vos capteurs spécifiques
pip3 install RPi.GPIO
pip3 install adafruit-circuitpython-dht  # Pour les capteurs de température/humidité DHT
pip3 install gpiozero  # Pour les capteurs analogiques via MCP3008
```

2. **Générer les identifiants Firebase Admin SDK**

- Allez sur la console de votre projet Firebase : https://console.firebase.google.com/
- Naviguez vers Paramètres du projet > Comptes de service
- Cliquez sur "Générer une nouvelle clé privée"
- Enregistrez le fichier JSON sous le nom `fraisier-fa1be-firebase-adminsdk.json` dans le même répertoire que les scripts

3. **Choisir le script approprié**

Ce dossier contient plusieurs scripts pour différents cas d'utilisation :

- `firebase_demo.py` : Script de démonstration qui envoie des données aléatoires à Firebase
- `continuous_sensor_data.py` : Script qui envoie en continu des données simulées réalistes
- `real_sensor_data.py` : Script pour lire les données réelles des capteurs

4. **Modifier les scripts pour vos capteurs spécifiques**

Si vous utilisez `real_sensor_data.py`, modifiez-le pour utiliser les broches GPIO correctes et les bibliothèques de capteurs pour votre configuration matérielle.

5. **Copier les fichiers sur votre Raspberry Pi**

Copiez tous les fichiers de ce répertoire sur votre Raspberry Pi (par exemple, dans `/home/pi/`).

6. **Rendre les scripts exécutables**

```bash
chmod +x firebase_demo.py
chmod +x continuous_sensor_data.py
chmod +x real_sensor_data.py
```

## Exécution des scripts

### Exécution manuelle

Pour exécuter les scripts manuellement pour les tests :

```bash
# Pour le script de démonstration (3 itérations)
python3 firebase_demo.py

# Pour l'envoi continu de données simulées
python3 continuous_sensor_data.py

# Pour lire et envoyer des données réelles des capteurs
python3 real_sensor_data.py
```

### Configuration en tant que service

Pour exécuter le script automatiquement au démarrage :

1. Créez un fichier de service systemd :

```bash
sudo nano /etc/systemd/system/sensor-monitor.service
```

2. Ajoutez le contenu suivant (remplacez le chemin par l'emplacement réel de votre script) :

```
[Unit]
Description=Raspberry Pi Sensor Monitoring Service
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/real_sensor_data.py
WorkingDirectory=/home/pi
StandardOutput=inherit
StandardError=inherit
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

3. Activez et démarrez le service :

```bash
sudo systemctl enable sensor-monitor.service
sudo systemctl start sensor-monitor.service
```

4. Vérifiez l'état du service :

```bash
sudo systemctl status sensor-monitor.service
```

## Structure des données Firebase

Les données sont envoyées à Firebase dans deux emplacements :

1. **À la racine** : Les valeurs les plus récentes sont stockées directement à la racine de la base de données pour un accès facile par le frontend.

2. **Dans la collection sensor_data** : Chaque lecture est également ajoutée à une collection `sensor_data` avec un horodatage, créant ainsi un historique des lectures.

Exemple de structure de données :

```json
{
  "temperature": 25.4,
  "humidity_air": 60.2,
  "humidity_soil": 72.5,
  "water_level": 85.0,
  "pump_active": false,
  "light": 450.3,
  "timestamp": "2023-05-15T14:30:45.123456",
  "sensor_data": {
    "-NhGzXyZaBcDeFgHiJkL": {
      "temperature": 25.4,
      "humidity_air": 60.2,
      "humidity_soil": 72.5,
      "water_level": 85.0,
      "pump_active": false,
      "light": 450.3,
      "timestamp": "2023-05-15T14:30:45.123456"
    },
    "-NhGzYzAbCdEfGhIjKlM": {
      "temperature": 25.6,
      "humidity_air": 59.8,
      "humidity_soil": 71.9,
      "water_level": 84.5,
      "pump_active": false,
      "light": 455.7,
      "timestamp": "2023-05-15T14:31:45.789012"
    }
  }
}
```

## Dépannage

- **Vérifier les journaux** : `journalctl -u sensor-monitor.service`
- **Tester les capteurs individuellement** : Modifiez les scripts pour n'afficher que les valeurs d'un capteur spécifique
- **Connexion Firebase** : Assurez-vous que votre Raspberry Pi a accès à Internet et que les identifiants Firebase sont corrects
- **Erreurs de capteur** : Vérifiez les connexions physiques et les broches GPIO

## Personnalisation

- Ajustez la variable `DEFAULT_UPDATE_INTERVAL` dans les scripts pour modifier la fréquence d'envoi des données
- Modifiez les fonctions de lecture des capteurs dans `real_sensor_data.py` pour correspondre à vos capteurs spécifiques
- Ajoutez des capteurs supplémentaires en créant de nouvelles fonctions de lecture et en mettant à jour la fonction d'envoi des données
