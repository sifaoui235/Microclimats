#!/usr/bin/env python3
"""
Script simple pour générer un code QR pointant vers votre application React en cours d'exécution.
Ce script détecte automatiquement l'adresse IP de votre machine sur le réseau local.
"""
import socket
import qrcode
from PIL import Image, ImageDraw, ImageFont

def get_local_ip():
    """Obtenir l'adresse IP locale de la machine"""
    try:
        # Créer un socket pour déterminer l'interface utilisée pour se connecter à Internet
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Ne se connecte pas réellement
        s.connect(('8.8.8.8', 1))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        # Fallback si la méthode ci-dessus échoue
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        return local_ip

def generate_qr_code(url, output_file="qrcode.png", title=None):
    """
    Génère un code QR pour l'URL spécifiée.
    
    Args:
        url (str): L'URL vers laquelle le code QR pointera
        output_file (str): Le nom du fichier de sortie
        title (str, optional): Titre à ajouter sous le code QR
    """
    # Créer un code QR avec une bonne taille et correction d'erreur
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    
    # Ajouter les données (URL)
    qr.add_data(url)
    qr.make(fit=True)
    
    # Créer une image à partir du QR code
    qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGBA')
    
    # Si un titre est fourni, l'ajouter sous le QR code
    if title:
        try:
            # Créer une nouvelle image plus grande pour accueillir le titre
            margin = 20
            font_size = 24
            
            # Essayer de charger une police, sinon utiliser la police par défaut
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except IOError:
                font = ImageFont.load_default()
            
            # Calculer la taille du texte
            draw = ImageDraw.Draw(Image.new('RGB', (1, 1)))
            text_width, text_height = draw.textsize(title, font=font)
            
            # Créer l'image finale avec espace pour le titre
            final_width = max(qr_img.size[0], text_width + 2 * margin)
            final_height = qr_img.size[1] + text_height + 3 * margin
            
            final_img = Image.new('RGBA', (final_width, final_height), 'white')
            
            # Coller le QR code
            qr_pos = ((final_width - qr_img.size[0]) // 2, margin)
            final_img.paste(qr_img, qr_pos)
            
            # Ajouter le titre
            draw = ImageDraw.Draw(final_img)
            text_pos = ((final_width - text_width) // 2, qr_img.size[1] + 2 * margin)
            draw.text(text_pos, title, font=font, fill='black')
            
            qr_img = final_img
        except Exception as e:
            print(f"Erreur lors de l'ajout du titre: {e}")
    
    # Sauvegarder l'image
    qr_img.save(output_file)
    print(f"Code QR généré avec succès: {output_file}")
    
    return output_file

if __name__ == "__main__":
    # Obtenir l'adresse IP locale
    local_ip = get_local_ip()
    
    # Port par défaut pour les applications React (npm start)
    port = 3000
    
    # Créer l'URL complète
    app_url = f"http://{local_ip}:{port}"
    
    # Générer le code QR
    qr_file = generate_qr_code(
        app_url, 
        "dashboard_qr.png", 
        title=f"FraisierTech Dashboard: {app_url}"
    )
    
    print("\n" + "="*50)
    print(f"Votre application est accessible à: {app_url}")
    print(f"Un code QR a été généré dans le fichier: {qr_file}")
    print("="*50)
    print("\nInstructions:")
    print("1. Assurez-vous que votre application React est en cours d'exécution (npm start)")
    print("2. Assurez-vous que votre ordinateur et l'appareil qui scannera le code QR")
    print("   sont connectés au même réseau WiFi")
    print("3. Scannez le code QR avec votre smartphone ou tablette")
    print("4. Si la connexion échoue, vérifiez que:")
    print("   - Votre application React est bien lancée")
    print("   - Votre pare-feu autorise les connexions sur le port 3000")
    print("   - Votre application React est configurée pour écouter sur toutes les interfaces")
    print("     (vous pouvez relancer avec: HOST=0.0.0.0 npm start)")
