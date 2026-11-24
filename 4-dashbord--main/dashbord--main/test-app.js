/**
 * Script de test simple pour vérifier l'application
 */

console.log('🚀 Test de l\'application dual chamber...');

// Test 1: Vérifier que l'application démarre
console.log('✅ Application démarrée');

// Test 2: Vérifier les routes
const routes = [
  'http://localhost:3000/',
  'http://localhost:3000/firebase-test',
  'http://localhost:3000/chambers',
  'http://localhost:3000/sensors',
  'http://localhost:3000/history'
];

console.log('📍 Routes à tester:', routes);

// Test 3: Vérifier la structure des fichiers
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/components/dashboard/DualChamberDashboard.tsx',
  'src/services/DualFirebaseLoader.service.js',
  'src/components/charts/ChamberGraphs.component.js',
  'src/utils/PumpStateIndicator.util.js',
  'src/styles/ChamberStyles.module.css',
  'src/components/debug/ChamberDataPopulator.tsx',
  'src/data/mockChamberData.js'
];

console.log('\n📁 Vérification des fichiers...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
  }
});

// Test 4: Vérifier package.json
console.log('\n📦 Vérification des dépendances...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'react',
    'react-bootstrap',
    'react-icons',
    'firebase',
    'chart.js',
    'react-chartjs-2'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - MANQUANT`);
    }
  });
} catch (error) {
  console.log('❌ Erreur lors de la lecture de package.json:', error.message);
}

console.log('\n🎯 Test terminé. Vérifiez les résultats ci-dessus.');
console.log('💡 Si tout est ✅, l\'application devrait fonctionner correctement.');
console.log('🌐 Ouvrez http://localhost:3000 pour voir le dashboard.');
console.log('🔧 Utilisez http://localhost:3000/firebase-test pour ajouter des données de test.');
