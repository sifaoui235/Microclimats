/**
 * Script pour générer un code QR avec une adresse IP spécifique
 */
const QRCode = require('qrcode');

// IMPORTANT: Remplacez cette adresse IP par celle de votre ordinateur
// que vous avez trouvée avec la commande ipconfig
const YOUR_IP = "172.20.10.5"; // Adresse IP de votre ordinateur
const PORT = 3000;

const appUrl = `http://${YOUR_IP}:${PORT}`;

// Générer le code QR
QRCode.toFile('direct_qr.png', appUrl, {
  errorCorrectionLevel: 'H',
  margin: 4,
  scale: 10,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
}, function(err) {
  if (err) {
    console.error('Erreur lors de la génération du code QR:', err);
    return;
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Code QR généré avec l'URL: ${appUrl}`);
  console.log(`Fichier créé: direct_qr.png`);
  console.log("=".repeat(50));
  console.log("\nInstructions:");
  console.log("1. Assurez-vous que votre application React est en cours d'exécution");
  console.log("   avec la commande: set HOST=0.0.0.0 && npm start");
  console.log("2. Vérifiez que votre téléphone et votre ordinateur sont sur le même réseau");
  console.log("3. Scannez le code QR avec votre téléphone");
  console.log("4. Si cela ne fonctionne toujours pas, essayez d'ouvrir directement");
  console.log(`   l'URL ${appUrl} dans le navigateur de votre téléphone`);
});
