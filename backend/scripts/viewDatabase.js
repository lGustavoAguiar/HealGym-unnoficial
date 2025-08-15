import { connectTestDB, disconnectTestDB } from '../utils/testDatabase.js';
import User from '../models/User.js';

const viewDatabase = async () => {
  try {
    console.log('🔄 Conectando ao banco de dados...\n');
    await connectTestDB();
    
    console.log('═══════════════════════════════════════');
    console.log('🏥 HEALGYM - VISUALIZADOR DE BANCO DE DADOS');
    console.log('═══════════════════════════════════════\n');
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    console.log('📊 ESTATÍSTICAS:');
    console.log(`   Total de usuários: ${totalUsers}`);
    console.log(`   Usuários ativos: ${activeUsers}`);
    console.log(`   Usuários inativos: ${totalUsers - activeUsers}`);
    console.log(`   Administradores: ${adminUsers}`);
    console.log(`   Usuários regulares: ${totalUsers - adminUsers}\n`);
    
    if (totalUsers === 0) {
      console.log('📭 Nenhum usuário encontrado no banco de dados.');
      console.log('💡 Registre alguns usuários através do frontend para ver os dados aqui.\n');
    } else {
      console.log('👥 USUÁRIOS CADASTRADOS:\n');
      
      const users = await User.find({}).sort({ createdAt: -1 });
      
      users.forEach((user, index) => {
        console.log(`┌─ 👤 Usuário ${index + 1}`);
        console.log(`│  Nome: ${user.name}`);
        console.log(`│  Email: ${user.email}`);
        console.log(`│  ID: ${user._id}`);
        console.log(`│  Função: ${user.role === 'admin' ? '👑 Admin' : '👤 Usuário'}`);
        console.log(`│  Status: ${user.isActive ? '✅ Ativo' : '❌ Inativo'}`);
        console.log(`│  Criado em: ${user.createdAt.toLocaleString('pt-BR')}`);
        console.log(`│  Atualizado em: ${user.updatedAt.toLocaleString('pt-BR')}`);
        if (user.lastLogin) {
          console.log(`│  Último login: ${user.lastLogin.toLocaleString('pt-BR')}`);
        }
        console.log('└─────────────────────────────────────\n');
      });
    }
    
    console.log('✅ Visualização concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao visualizar banco de dados:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    try {
      await disconnectTestDB();
      console.log('🔌 Desconectado do banco de dados');
    } catch (disconnectError) {
      console.error('❌ Erro ao desconectar:', disconnectError.message);
    }
    process.exit(0);
  }
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  viewDatabase();
}

export default viewDatabase;
