import sys
import time
import spidev

# Ajouter le chemin vers la bibliothèque LCD
sys.path.append("/chemin/absolu/vers/cd_lcd")  # Remplacez par le vrai chemin
import drivers

# Initialisation du LCD
display = drivers.Lcd()

# Configuration SPI (votre code existant)
spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 1000000

def lire_canal(channel):
    adc = spi.xfer2([1, (8 + channel) << 4, 0])
    return ((adc[1] & 3) << 8) + adc[2]

try:
    # Calibration
    VALEUR_MIN = 100
    VALEUR_MAX = 950
    
    while True:
        valeur_brute = lire_canal(0)
        pourcentage = (valeur_brute - VALEUR_MIN) / (VALEUR_MAX - VALEUR_MIN) * 100
        pourcentage = max(0, min(100, round(pourcentage, 1)))

        # Affichage terminal
        print(f"Niveau: {pourcentage}% | Valeur brute: {valeur_brute}")
        
        # Affichage LCD
        display.lcd_display_string(f"Niveau: {pourcentage}%", 1)
        display.lcd_display_string(f"Raw: {valeur_brute}", 2)

        time.sleep(1)

except KeyboardInterrupt:
    spi.close()
    display.lcd_clear()