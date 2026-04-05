/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Créer l'utilisateur de test
    const user = await prisma.user.create({
      data: {
        email: 'commerce@test.local',
        fullName: 'Jean Marketing',
        passwordHash: hashedPassword,
      },
    });

    console.log('✓ Compte commerçant créé avec succès!');
    console.log('');
    console.log('Identifiants de connexion:');
    console.log('  Email: commerce@test.local');
    console.log('  Mot de passe: Password123!');
    console.log('');
    console.log('Utilisateur créé:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Nom: ${user.fullName}`);
    console.log(`  Email: ${user.email}`);
    console.log('');
    console.log('Tu peux maintenant t\'inscrire avec ces identifiants!');
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('✗ Cet email existe déjà. Supprime le compte existant d\'abord.');
    } else {
      console.error('Erreur:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
