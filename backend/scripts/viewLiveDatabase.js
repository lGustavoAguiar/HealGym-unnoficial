import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import User from '../models/User.js';

const viewLiveDatabase = async () => {
  try {
    console.log('\n🔄 Conectando ao banco de dados ativo...');
    
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Usando conexão existente');
    } else {
      console.log('⚠️ Não é possível conectar ao banco em memória de outro processo');
      console.log('💡 Use a interface web ou API para visualizar dados em tempo real:');
      console.log('   🌐 http://localhost:5000/database-debug.html');
      console.log('   📡 http://localhost:5000/api/debug/users');
      console.log('   📊 http://localhost:5000/api/debug/stats\n');
      return;
    }
    
    const users = await User.find({}).sort({ createdAt: -1 });
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    
    console.log('═══════════════════════════════════════');
    console.log('🏥 HEALGYM - BANCO DE DADOS ATIVO');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Total: ${totalUsers} usuários`);
    console.log(`✅ Ativos: ${activeUsers}`);
    console.log(`👑 Admins: ${adminUsers}`);
    console.log('═══════════════════════════════════════\n');
    
    if (totalUsers === 0) {
      console.log('📭 Banco vazio - registre usuários no frontend\n');
    } else {
      console.log('👥 USUÁRIOS:\n');
      users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name}`);
        console.log(`   📧 ${user.email}`);
        console.log(`   🆔 ${user._id}`);
        console.log(`   👤 ${user.role} ${user.isActive ? '(ativo)' : '(inativo)'}`);
        console.log(`   📅 ${user.createdAt.toLocaleDateString('pt-BR')}\n`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Alternativas para visualizar o banco:');
    console.log('   🌐 Interface Web: http://localhost:5000/database-debug.html');
    console.log('   📡 API Users: http://localhost:5000/api/debug/users');
    console.log('   📊 API Stats: http://localhost:5000/api/debug/stats');
  } finally {
    console.log('\n✅ Finalizado!');
    process.exit(0);
  }
};

viewLiveDatabase();
