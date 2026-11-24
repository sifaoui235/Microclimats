#!/usr/bin/env python3
"""
Script pour générer un code QR qui pointe vers votre application web.
Ce code QR peut être scanné pour accéder rapidement à votre dashboard.
"""
import os
import qrcode
from PIL import Image, ImageDraw, ImageFont

def generate_qr_code(url, output_file="qrcode.png", logo_path=None, title=None):
    """
    Génère un code QR pour l'URL spécifiée.
    
    Args:
        url (str): L'URL vers laquelle le code QR pointera
        output_file (str): Le nom du fichier de sortie
        logo_path (str, optional): Chemin vers un logo à ajouter au centre du QR code
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
    
    # Si un logo est fourni, l'ajouter au centre du QR code
    if logo_path and os.path.exists(logo_path):
        try:
            # Ouvrir le logo
            logo = Image.open(logo_path).convert('RGBA')
            
            # Redimensionner le logo pour qu'il ne prenne pas plus de 30% du QR code
            logo_size = int(qr_img.size[0] * 0.3)
            logo = logo.resize((logo_size, logo_size))
            
            # Calculer la position pour centrer le logo
            pos = ((qr_img.size[0] - logo.size[0]) // 2, (qr_img.size[1] - logo.size[1]) // 2)
            
            # Coller le logo sur le QR code
            qr_img.paste(logo, pos, logo)
        except Exception as e:
            print(f"Erreur lors de l'ajout du logo: {e}")
    
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
    # URL de votre application web
    # Remplacez ceci par l'URL réelle de votre application
    app_url = "http://localhost:3000"
    
    # Vous pouvez également utiliser l'adresse IP de votre serveur sur le réseau local
    # Par exemple: "http://192.168.1.100:3000"
    
    # Générer un code QR simple
    generate_qr_code(app_url, "qrcode_simple.png")
    
    # Générer un code QR avec un titre
    generate_qr_code(
        app_url, 
        "qrcode_with_title.png", 
        title="FraisierTech Dashboard"
    )
    
    print("\nPour utiliser ce code QR:")
    print("1. Assurez-vous que votre application web est en cours d'exécution")
    print("2. Si vous utilisez localhost, remplacez-le par l'adresse IP de votre machine")
    print("   dans le réseau où les utilisateurs se connecteront")
    print("3. Imprimez le code QR ou affichez-le sur un écran")
    print("4. Les utilisateurs peuvent scanner le code QR avec leur smartphone")
    print("   pour accéder directement à votre dashboard")
