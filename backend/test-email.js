import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Carregar variáveis de ambiente
dotenv.config();

async function testEmail() {
  console.log('🧪 Testando configuração de email...');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***definida***' : 'NÃO DEFINIDA');

  try {
    // Criar transportador
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log('📧 Testando conexão com Gmail...');
    await transporter.verify();
    console.log('✅ Conexão com Gmail estabelecida!');

    // Tentar enviar email de teste
    console.log('📤 Enviando email de teste...');
    const info = await transporter.sendMail({
      from: `"HealGym Test" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_FROM, // Enviando para o próprio email
      subject: '🧪 Teste de Email - HealGym',
      text: 'Este é um email de teste do HealGym. Se você recebeu esta mensagem, a configuração está funcionando!',
      html: '<h1>🧪 Teste de Email</h1><p>Este é um email de teste do HealGym. Se você recebeu esta mensagem, a configuração está funcionando!</p>'
    });

    console.log('✅ Email enviado com sucesso!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📨 Response:', info.response);

  } catch (error) {
    console.error('❌ Erro no teste de email:', error);
    
    if (error.code === 'EAUTH') {
      console.log('🔐 Erro de autenticação - verifique:');
      console.log('   - Se a senha de app está correta');
      console.log('   - Se a autenticação de dois fatores está habilitada');
      console.log('   - Se "Acesso de aplicativos menos seguros" está habilitado (se necessário)');
    }
    
    if (error.code === 'EENVELOPE') {
      console.log('📧 Erro no envelope do email - verifique:');
      console.log('   - Se o EMAIL_FROM está correto');
      console.log('   - Se o formato do email está válido');
    }
  }
}

testEmail().catch(console.error);
