import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Script de Seed para criar o primeiro Super Admin
 * Executar: node scripts/seed-admin.js
 */

async function seedSuperAdmin() {
  try {
    console.log('🌱 Iniciando seed do Super Admin...');

    // Verificar se já existe algum usuário SUPER_ADMIN
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (existingSuperAdmin) {
      console.log('✅ Já existe um Super Admin cadastrado.');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Nome: ${existingSuperAdmin.name}`);
      return;
    }

    // Dados do Super Admin padrão
    const superAdminData = {
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@diixwhatsapp.com',
      password: process.env.SUPER_ADMIN_PASSWORD || 'admin123',
      name: 'Administrador Principal',
      role: 'SUPER_ADMIN',
      status: 'active',
    };

    console.log('📝 Criando Super Admin...');
    console.log(`   Email: ${superAdminData.email}`);
    console.log(`   Senha: ${superAdminData.password} (altere no primeiro login!)`);

    // Hash da senha
    const hashedPassword = await bcrypt.hash(superAdminData.password, 10);

    // Criar Super Admin
    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminData.email,
        password: hashedPassword,
        name: superAdminData.name,
        role: superAdminData.role,
        status: superAdminData.status,
        tenantId: null, // SUPER_ADMIN não está vinculado a nenhum tenant
      },
    });

    console.log('✅ Super Admin criado com sucesso!');
    console.log('   ID:', superAdmin.id);
    console.log('\n⚠️  IMPORTANTE: Altere a senha padrão no primeiro login!');

  } catch (error) {
    console.error('❌ Erro ao criar Super Admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Script opcional para criar tenant de demonstração
 */
async function seedDemoTenant() {
  try {
    console.log('\n🌱 Criando tenant de demonstração...');

    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: 'demo-store' },
    });

    if (existingTenant) {
      console.log('✅ Tenant de demonstração já existe.');
      return;
    }

    const demoTenant = await prisma.tenant.create({
      data: {
        name: 'Loja Demonstração',
        slug: 'demo-store',
        email: 'demo@diixwhatsapp.com',
        phone: '+5511999999999',
        plan: 'PRO',
        status: 'ACTIVE',
        maxAccounts: 5,
        maxMessages: 5000,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });

    console.log('✅ Tenant de demonstração criado!');
    console.log('   ID:', demoTenant.id);
    console.log('   Slug:', demoTenant.slug);

    // Criar usuário admin para o tenant de demonstração
    const demoAdmin = await prisma.user.create({
      data: {
        email: 'demo@diixwhatsapp.com',
        password: await bcrypt.hash('demo123', 10),
        name: 'Admin Demo',
        role: 'TENANT_ADMIN',
        status: 'active',
        tenantId: demoTenant.id,
      },
    });

    console.log('✅ Usuário admin da demo criado!');
    console.log('   Email: demo@diixwhatsapp.com');
    console.log('   Senha: demo123');

  } catch (error) {
    console.error('❌ Erro ao criar tenant de demonstração:', error);
  }
}

/**
 * Script para criar produtos de exemplo
 */
async function seedDemoProducts() {
  try {
    console.log('\n🌱 Criando produtos de demonstração...');

    const demoTenant = await prisma.tenant.findUnique({
      where: { slug: 'demo-store' },
    });

    if (!demoTenant) {
      console.log('⚠️  Tenant de demonstração não encontrado. Pulando produtos...');
      return;
    }

    const demoProducts = [
      {
        name: 'Pizza Margherita',
        description: 'Pizza tradicional com molho de tomate, mussarela e manjericão',
        sku: 'PIZZA-001',
        price: 45.90,
        costPrice: 25.00,
        stock: 50,
        category: 'Pizzas',
        active: true,
        featured: true,
      },
      {
        name: 'Pizza Calabresa',
        description: 'Pizza com calabresa fatiada, cebola e mussarela',
        sku: 'PIZZA-002',
        price: 49.90,
        costPrice: 27.00,
        stock: 45,
        category: 'Pizzas',
        active: true,
        featured: false,
      },
      {
        name: 'Refrigerante Coca-Cola 2L',
        description: 'Refrigerante Coca-Cola garrafa 2 litros',
        sku: 'BEBIDA-001',
        price: 12.00,
        costPrice: 7.00,
        stock: 100,
        category: 'Bebidas',
        active: true,
        featured: false,
      },
      {
        name: 'Suco Natural de Laranja 500ml',
        description: 'Suco natural de laranja recém espremido',
        sku: 'BEBIDA-002',
        price: 8.50,
        costPrice: 4.00,
        stock: 80,
        category: 'Bebidas',
        active: true,
        featured: false,
      },
      {
        name: 'Brownie de Chocolate',
        description: 'Brownie artesanal de chocolate meio amargo',
        sku: 'SOBREMESA-001',
        price: 15.90,
        costPrice: 8.00,
        stock: 30,
        category: 'Sobremesas',
        active: true,
        featured: true,
      },
    ];

    let createdCount = 0;

    for (const productData of demoProducts) {
      const existing = await prisma.product.findUnique({
        where: {
          tenantId_sku: {
            tenantId: demoTenant.id,
            sku: productData.sku,
          },
        },
      });

      if (!existing) {
        await prisma.product.create({
          data: {
            ...productData,
            tenantId: demoTenant.id,
          },
        });
        createdCount++;
        console.log(`   ✅ Produto criado: ${productData.name}`);
      } else {
        console.log(`   ⏭️  Produto já existe: ${productData.name}`);
      }
    }

    console.log(`\n✅ ${createdCount} produtos de demonstração criados!`);

  } catch (error) {
    console.error('❌ Erro ao criar produtos de demonstração:', error);
  }
}

// Executar todos os seeds
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         🌱 DiixWhatsapp - Seed Database                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  await seedSuperAdmin();
  
  // Seeds opcionais de demonstração
  if (process.env.SEED_DEMO === 'true') {
    await seedDemoTenant();
    await seedDemoProducts();
  }

  console.log('\n✅ Seed concluído com sucesso!');
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Credenciais Padrão:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SUPER ADMIN:');
  console.log('  Email: admin@diixwhatsapp.com');
  console.log('  Senha: admin123');
  console.log('───────────────────────────────────────────────────────────');
  if (process.env.SEED_DEMO === 'true') {
    console.log('DEMO TENANT:');
    console.log('  Email: demo@diixwhatsapp.com');
    console.log('  Senha: demo123');
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
