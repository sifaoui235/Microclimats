/**
 * Script pour tester si le serveur React est accessible
 */
const http = require('http');
const os = require('os');

// Obtenir toutes les adresses IP de la machine
function getAllIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorer les interfaces non IPv4 et les interfaces loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: name,
          address: iface.address
        });
      }
    }
  }
  
  return addresses;
}

// Tester si un serveur est accessible
function testConnection(host, port) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: host,
      port: port,
      path: '/',
      timeout: 2000
    }, (res) => {
      resolve({
        success: res.statusCode === 200,
        status: res.statusCode,
        message: `Serveur accessible, status: ${res.statusCode}`
      });
    });
    
    req.on('error', (err) => {
      resolve({
        success: false,
        message: `Erreur: ${err.message}`
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        message: 'Timeout: Le serveur ne répond pas'
      });
    });
  });
}

// Fonction principale
async function main() {
  const port = 3000;
  
  console.log('Test de connexion au serveur React...');
  console.log('=====================================');
  
  // Tester localhost
  console.log('\nTest de localhost:');
  const localResult = await testConnection('localhost', port);
  console.log(`- localhost:${port} - ${localResult.message}`);
  
  // Tester toutes les adresses IP
  console.log('\nTest de toutes les adresses IP:');
  const addresses = getAllIPs();
  
  if (addresses.length === 0) {
    console.log('Aucune adresse IP trouvée');
  } else {
    for (const addr of addresses) {
      const result = await testConnection(addr.address, port);
      console.log(`- ${addr.name}: ${addr.address}:${port} - ${result.message}`);
    }
  }
  
  console.log('\nRésumé:');
  console.log('-------');
  if (localResult.success) {
    console.log('✅ Le serveur React fonctionne localement');
  } else {
    console.log('❌ Le serveur React ne fonctionne pas localement');
    console.log('   Assurez-vous que "npm start" est en cours d\'exécution');
  }
  
  const externalSuccess = addresses.some(addr => 
    testConnection(addr.address, port).then(r => r.success)
  );
  
  if (externalSuccess) {
    console.log('✅ Le serveur React semble accessible depuis l\'extérieur');
  } else {
    console.log('⚠️ Le serveur React pourrait ne pas être accessible depuis l\'extérieur');
    console.log('   Essayez de redémarrer avec: set HOST=0.0.0.0 && npm start');
  }
  
  console.log('\nPour générer un code QR avec l\'adresse IP correcte:');
  console.log('1. Modifiez le fichier direct-qr.js avec votre adresse IP');
  console.log('2. Exécutez: node direct-qr.js');
}

// Exécuter le script
main().catch(console.error);
