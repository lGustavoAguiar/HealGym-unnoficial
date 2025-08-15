import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  profile: {
    avatar: String,
    phone: String,
    dateOfBirth: Date,
    gender: String,
    goals: [String],
    fitnessLevel: String
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const quickView = async () => {
  let mongod = null;
  
  try {
    console.log('\n🔄 Iniciando MongoDB em memória...');
    
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    await mongoose.connect(uri);
    console.log('✅ Conectado ao banco de dados\n');
    
    const users = await User.find({}).sort({ createdAt: -1 });
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    
    console.log('═══════════════════════════════════════');
    console.log('🏥 HEALGYM - BANCO DE DADOS');
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
  } finally {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
      }
      if (mongod) {
        await mongod.stop();
      }
    } catch (cleanupError) {
      console.error('⚠️ Erro na limpeza:', cleanupError.message);
    }
    
    console.log('✅ Finalizado!\n');
    process.exit(0);
  }
};

quickView();
