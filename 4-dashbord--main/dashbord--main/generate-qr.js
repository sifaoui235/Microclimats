/**
 * Script pour générer un code QR pointant vers votre application React en cours d'exécution.
 * Ce script utilise les bibliothèques Node.js et ne nécessite pas d'installation supplémentaire
 * si vous avez déjà un projet React.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { createCanvas } = require('canvas');
const QRCode = require('qrcode');

/**
 * Obtient l'adresse IP locale de la machine
 * @returns {string} Adresse IP locale
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorer les interfaces non IPv4 et les interfaces loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback sur localhost
}

/**
 * Génère un code QR et l'enregistre dans un fichier
 * @param {string} url - URL à encoder dans le code QR
 * @param {string} outputFile - Chemin du fichier de sortie
 * @param {string} title - Titre à ajouter sous le code QR
 */
async function generateQRCode(url, outputFile = 'dashboard_qr.png', title = null) {
  try {
    // Créer un canvas pour dessiner le code QR
    const canvas = createCanvas(400, title ? 480 : 400);
    const ctx = canvas.getContext('2d');

    // Remplir le fond en blanc
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Générer le code QR
    await QRCode.toCanvas(canvas, url, {
      errorCorrectionLevel: 'H',
      margin: 4,
      scale: 10,
      width: 360,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Ajouter le titre si fourni
    if (title) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 420);
    }

    // Enregistrer l'image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputFile, buffer);
    
    console.log(`Code QR généré avec succès: ${outputFile}`);
    return outputFile;
  } catch (error) {
    console.error('Erreur lors de la génération du code QR:', error);
    return null;
  }
}

/**
 * Fonction principale
 */
async function main() {
  // Obtenir l'adresse IP locale
  const localIP = getLocalIP();
  
  // Port par défaut pour les applications React (npm start)
  const port = 3000;
  
  // Créer l'URL complète
  const appUrl = `http://${localIP}:${port}`;
  
  // Vérifier si l'application est en cours d'exécution
  checkServerRunning(localIP, port)
    .then(async (isRunning) => {
      if (isRunning) {
        console.log(`✅ L'application React est en cours d'exécution sur ${appUrl}`);
      } else {
        console.log(`⚠️ Attention: L'application React ne semble pas être en cours d'exécution sur ${appUrl}`);
        console.log('   Assurez-vous de lancer "npm start" dans un autre terminal.');
      }
      
      // Générer le code QR
      const qrFile = await generateQRCode(
        appUrl,
        'dashboard_qr.png',
        `FraisierTech Dashboard: ${appUrl}`
      );
      
      console.log("\n" + "=".repeat(50));
      console.log(`Votre application est accessible à: ${appUrl}`);
      console.log(`Un code QR a été généré dans le fichier: ${qrFile}`);
      console.log("=".repeat(50));
      console.log("\nInstructions:");
      console.log("1. Assurez-vous que votre application React est en cours d'exécution (npm start)");
      console.log("2. Assurez-vous que votre ordinateur et l'appareil qui scannera le code QR");
      console.log("   sont connectés au même réseau WiFi");
      console.log("3. Scannez le code QR avec votre smartphone ou tablette");
      console.log("4. Si la connexion échoue, vérifiez que:");
      console.log("   - Votre application React est bien lancée");
      console.log("   - Votre pare-feu autorise les connexions sur le port 3000");
      console.log("   - Votre application React est configurée pour écouter sur toutes les interfaces");
      console.log("     (vous pouvez relancer avec: HOST=0.0.0.0 npm start)");
    });
}

/**
 * Vérifie si le serveur est en cours d'exécution
 * @param {string} host - Hôte à vérifier
 * @param {number} port - Port à vérifier
 * @returns {Promise<boolean>} True si le serveur répond
 */
function checkServerRunning(host, port) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: host,
      port: port,
      path: '/',
      timeout: 1000
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Exécuter le script
main().catch(console.error);
