import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api/debug';

const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Erro ao acessar ${endpoint}: ${error.message}`);
  }
};

const viewDatabaseViaAPI = async () => {
  try {
    console.log('\n🔄 Consultando banco de dados via API...\n');
    
    const stats = await fetchData('/stats');
    const users = await fetchData('/users');
    
    console.log('═══════════════════════════════════════');
    console.log('🏥 HEALGYM - BANCO DE DADOS (VIA API)');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Total: ${stats.statistics.totalUsers} usuários`);
    console.log(`✅ Ativos: ${stats.statistics.activeUsers}`);
    console.log(`❌ Inativos: ${stats.statistics.inactiveUsers}`);
    console.log(`👑 Admins: ${stats.statistics.adminUsers}`);
    console.log(`👤 Regulares: ${stats.statistics.regularUsers}`);
    console.log('═══════════════════════════════════════\n');
    
    if (users.total === 0) {
      console.log('📭 Banco vazio');
      console.log('💡 Registre usuários em: http://localhost:5173/register\n');
    } else {
      console.log(`👥 USUÁRIOS (${users.total}):\n`);
      
      users.users.forEach((user, i) => {
        console.log(`${i + 1}. 👤 ${user.name}`);
        console.log(`   📧 ${user.email}`);
        console.log(`   🆔 ${user._id}`);
        console.log(`   🏷️  ${user.role === 'admin' ? '👑 Admin' : '👤 Usuário'}`);
        console.log(`   📊 ${user.isActive ? '✅ Ativo' : '❌ Inativo'}`);
        console.log(`   📅 Criado: ${new Date(user.createdAt).toLocaleString('pt-BR')}`);
        if (user.lastLogin) {
          console.log(`   🕐 Último login: ${new Date(user.lastLogin).toLocaleString('pt-BR')}`);
        }
        console.log('   ─────────────────────────────────');
      });
    }
    
    console.log(`\n🕐 Última consulta: ${new Date().toLocaleString('pt-BR')}`);
    
  } catch (error) {
    console.error('❌ Erro ao consultar API:', error.message);
    console.log('\n🔧 Possíveis soluções:');
    console.log('   1. Certifique-se que o servidor está rodando: npm run dev');
    console.log('   2. Verifique se a porta 5000 está livre');
    console.log('   3. Acesse diretamente: http://localhost:5000/database-debug.html');
  } finally {
    console.log('\n✅ Consulta finalizada!\n');
  }
};

viewDatabaseViaAPI();
