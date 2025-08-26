import nodemailer from 'nodemailer';
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }
  async initializeTransporter() {
    // ===== CONFIGURE SUAS CREDENCIAIS AQUI =====
    const config = {
      EMAIL_FROM: process.env.EMAIL_FROM || 'zgustavoaguiar@gmail.com',           // ← SEU EMAIL CONFIGURADO
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'jirdrxbkfgfchumn',       // ← SUA NOVA SENHA DE APP SEM ESPAÇOS
      EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail'
    };
    
    console.log('🔧 ===== CONFIGURAÇÃO DE EMAIL =====');
    console.log('📧 Email remetente:', config.EMAIL_FROM);
    console.log('🔑 Senha configurada:', config.EMAIL_PASSWORD !== 'SUA_SENHA_APP_GMAIL' ? '[CONFIGURADA]' : '[PADRÃO - PRECISA CONFIGURAR]');
    console.log('🌐 Serviço:', config.EMAIL_SERVICE);
    
    // Verificar se as credenciais foram configuradas
    if (config.EMAIL_FROM === 'SEU_EMAIL@gmail.com' || config.EMAIL_PASSWORD === 'SUA_SENHA_APP_GMAIL') {
      console.error('❌ ERRO: Credenciais de email não configuradas!');
      console.error('🔧 COMO CONFIGURAR:');
      console.error('1. Abra o arquivo: backend/utils/email.js');
      console.error('2. Na linha 10, substitua "SEU_EMAIL@gmail.com" pelo seu email real');
      console.error('3. Na linha 11, substitua "SUA_SENHA_APP_GMAIL" pela sua senha de app do Gmail');
      console.error('4. Reinicie o servidor');
      console.error('');
      console.error('🔑 Como gerar senha de app no Gmail:');
      console.error('   → https://myaccount.google.com/apppasswords');
      
      // Retornar erro ao invés de continuar
      this.transporter = null;
      return;
    }
    
    const emailService = config.EMAIL_SERVICE;
    console.log(`📧 Configurando ${emailService} para envio de emails...`);
    
    let transportConfig = {
      service: emailService,
      auth: {
        user: config.EMAIL_FROM,
        pass: config.EMAIL_PASSWORD
      }
    };
    
    if (emailService === 'outlook') {
      transportConfig = {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: config.EMAIL_FROM,
          pass: config.EMAIL_PASSWORD
        }
      };
    }
    
    this.transporter = nodemailer.createTransport(transportConfig);
    
    try {
      await this.transporter.verify();
      console.log(`✅ Conectado ao ${emailService} com sucesso!`);
      console.log('📨 Emails serão enviados de:', config.EMAIL_FROM);
      console.log('🔧 ===== CONFIGURAÇÃO CONCLUÍDA =====');
      this.authError = null;
    } catch (error) {
      console.error('🚨 ===== ERRO DE AUTENTICAÇÃO GMAIL =====');
      console.error(`❌ Erro na conexão com ${emailService}:`, error.message);
      console.error('📧 Email configurado:', config.EMAIL_FROM);
      console.error('🔑 Senha configurada:', config.EMAIL_PASSWORD ? `[${config.EMAIL_PASSWORD.length} caracteres]` : '[AUSENTE]');
      console.error('');
      console.error('🔧 POSSÍVEIS SOLUÇÕES:');
      console.error('1. Verifique se a verificação em 2 etapas está ATIVADA no Gmail');
      console.error('2. Gere uma NOVA senha de app em: https://myaccount.google.com/apppasswords');
      console.error('3. Use a senha de app SEM ESPAÇOS (16 caracteres)');
      console.error('4. Verifique se o email está correto');
      console.error('');
      console.error('🔍 SENHA ATUAL (primeiros 4 chars):', config.EMAIL_PASSWORD ? config.EMAIL_PASSWORD.substring(0, 4) + '...' : 'VAZIA');
      console.error('🚨 ===== FIM DO DIAGNÓSTICO =====');
      
      // Salvar o erro de autenticação para usar depois
      this.authError = error;
      // Anular o transporter para forçar modo de desenvolvimento
      this.transporter = null;
    }
  }
  async sendPasswordResetEmail(email, resetToken) {
    if (!this.transporter) {
      await this.initializeTransporter();
    }
    
    // Se há erro de autenticação, simular envio mas não quebrar
    if (!this.transporter && this.authError) {
      console.log('📤 [MODO DEV] Simulando envio devido a erro de autenticação Gmail');
      console.log(`📧 [MODO DEV] Email de destino: ${email}`);
      console.log(`🔗 [MODO DEV] Link de reset: http://localhost:3000/reset-password/${resetToken}`);
      console.log('⚠️ [MODO DEV] Configure as credenciais corretas do Gmail para envio real!');
      
      return { 
        success: true, 
        messageId: 'dev-mode-auth-error-' + Date.now(),
        devMode: true,
        authError: this.authError.message
      };
    }
    
    // Verificar se o transporter foi configurado corretamente
    if (!this.transporter) {
      console.error('❌ Transporter não configurado - credenciais de email não foram definidas');
      throw new Error('Configuração de email necessária. Verifique as credenciais no arquivo backend/utils/email.js');
    }
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    const emailFrom = process.env.EMAIL_FROM || 'zgustavoaguiar@gmail.com';
    
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: '🔐 Recuperação de Senha - HealGym',
      html: this.getPasswordResetTemplate(resetUrl),
      text: `Olá! Você solicitou a recuperação de senha do HealGym. Acesse o link para redefinir sua senha: ${resetUrl} (O link expira em 15 minutos)`
    };
    try {
      console.log(`📤 Tentando enviar email de recuperação para: ${email}`);
      console.log(`📧 Usando remetente: ${emailFrom}`);
      console.log(`🔗 Link de reset: ${resetUrl}`);
      
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ EMAIL ENVIADO COM SUCESSO!');
      console.log('📧 Message ID:', info.messageId);
      console.log(`✅ Email de recuperação enviado para: ${email}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ ERRO DETALHADO AO ENVIAR EMAIL:');
      console.error('🔍 Código do erro:', error.code);
      console.error('🔍 Mensagem:', error.message);
      console.error('🔍 Stack:', error.stack);
      console.error('📧 Email de destino:', email);
      console.error('📧 Email remetente:', emailFrom);
      
      // Relançar o erro com mais detalhes
      throw new Error(`FALHA NO ENVIO DE EMAIL: ${error.message} (Código: ${error.code || 'N/A'})`);
    }
  }
  getPasswordResetTemplate(resetUrl) {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - HealGym</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 75%, #f5576c 100%); min-height: 100vh;">
        <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="800" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.95); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2);">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #334155 70%, #475569 100%); padding: 60px 80px; text-align: center; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 25% 25%, rgba(102,126,234,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(240,147,251,0.1) 0%, transparent 50%); opacity: 0.7;"></div>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="position: relative; z-index: 2;">
                      <tr>
                        <td align="center">
                          <div style="display: inline-block; width: 120px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); border-radius: 50%; line-height: 120px; font-size: 60px; color: white; margin-bottom: 25px; box-shadow: 0 15px 40px rgba(102,126,234,0.4), 0 0 0 8px rgba(255,255,255,0.1); border: 3px solid rgba(255,255,255,0.2);">💪</div>
                          
                          <h1 style="margin: 0; font-size: 4.5em; font-weight: 900; color: white; letter-spacing: -2px; text-shadow: 0 4px 20px rgba(0,0,0,0.5); margin-bottom: 15px;">HealGym</h1>
                          
                          <p style="margin: 0; font-size: 1.8em; color: rgba(255,255,255,0.9); font-weight: 500; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">Transformando Vidas, Fortalecendo Sonhos</p>
                          <p style="margin: 0; font-size: 1.3em; color: rgba(255,255,255,0.8); font-style: italic; font-weight: 400;">Sua jornada de superação começa aqui ✨</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 80px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);">
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 50px;">
                      <tr>
                        <td align="center">
                          <div style="display: inline-block; width: 140px; height: 140px; background: linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 70%, #f5576c 100%); border-radius: 50%; line-height: 140px; font-size: 70px; color: white; margin-bottom: 40px; box-shadow: 0 25px 60px rgba(102,126,234,0.4), 0 0 0 12px rgba(102,126,234,0.1), 0 0 0 24px rgba(102,126,234,0.05); border: 4px solid rgba(255,255,255,0.3);">🔐</div>
                          
                          <h2 style="margin: 0; font-size: 3.5em; font-weight: 800; background: linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 70%, #f5576c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 30px; letter-spacing: -1px;">Recuperação de Senha</h2>
                          
                          <div style="font-size: 2em; font-weight: 700; color: #333; margin-bottom: 40px;">
                            Olá, <span style="background: linear-gradient(135deg, #667eea, #f093fb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Guerreiro(a)</span>! 💪
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 50px;">
                      <tr>
                        <td>
                          <p style="font-size: 1.4em; line-height: 1.8; color: #334155; text-align: center; margin-bottom: 25px; font-weight: 500; max-width: 650px; margin-left: auto; margin-right: auto;">
                            Recebemos sua solicitação para redefinir a senha da sua conta no <strong style="color: #667eea;">HealGym</strong>. 
                            Sabemos que cada detalhe importa na sua jornada de transformação, e a <strong>segurança da sua conta</strong> é nossa prioridade máxima!
                          </p>
                          
                          <p style="font-size: 1.4em; line-height: 1.8; color: #334155; text-align: center; margin-bottom: 40px; font-weight: 500; max-width: 650px; margin-left: auto; margin-right: auto;">
                            🎯 <strong>Pronto para continuar conquistando seus objetivos?</strong><br>
                            Clique no botão abaixo para criar uma nova senha forte e voltar aos treinos:
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 60px 0;">
                      <tr>
                        <td align="center">
                          <div style="font-size: 30px; margin-bottom: 20px; opacity: 0.8;">✨</div>
                          
                          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 70%, #f5576c 100%); color: white; text-decoration: none; padding: 25px 60px; border-radius: 50px; font-weight: 700; font-size: 1.6em; text-align: center; box-shadow: 0 20px 50px rgba(102,126,234,0.4), 0 0 0 0 rgba(102,126,234,0.3); border: none; letter-spacing: 1px; text-transform: uppercase; transition: all 0.3s ease;">
                            🚀 Redefinir Minha Senha
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 50px 0;">
                      <tr>
                        <td>
                          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 8px solid #ef4444; border-radius: 15px; padding: 40px; position: relative; box-shadow: 0 10px 30px rgba(239,68,68,0.1);">
                            <div style="position: absolute; top: -15px; left: 30px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; width: 60px; height: 60px; border-radius: 50%; line-height: 60px; text-align: center; font-size: 24px; box-shadow: 0 8px 20px rgba(239,68,68,0.3);">⚠️</div>
                            
                            <h3 style="color: #dc2626; margin: 10px 0 25px 40px; font-size: 1.6em; font-weight: 800;">🛡️ Informações de Segurança</h3>
                            
                            <div style="margin-left: 40px;">
                              <div style="color: #dc2626; font-weight: 600; font-size: 1.2em; margin-bottom: 15px;">
                                🔒 Este link é válido por apenas <strong>15 minutos</strong> por segurança
                              </div>
                              <div style="color: #dc2626; font-weight: 600; font-size: 1.2em; margin-bottom: 15px;">
                                🔒 Pode ser usado apenas <strong>uma única vez</strong>
                              </div>
                              <div style="color: #dc2626; font-weight: 600; font-size: 1.2em; margin-bottom: 15px;">
                                🔒 Após o uso, será <strong>automaticamente invalidado</strong>
                              </div>
                              <div style="color: #dc2626; font-weight: 600; font-size: 1.2em;">
                                🔒 Nunca compartilhe este link com terceiros
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
                      <tr>
                        <td>
                          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 3px dashed #dee2e6; border-radius: 15px; padding: 35px; text-align: center;">
                            <p style="margin: 0 0 20px 0; font-weight: 700; color: #495057; font-size: 1.3em;">🔗 O botão não está funcionando? Use o link abaixo:</p>
                            <div style="background: #ffffff; border: 2px solid #e9ecef; border-radius: 10px; padding: 20px; font-family: 'Courier New', monospace; font-size: 1em; color: #6c757d; word-break: break-all; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                              ${resetUrl}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
                      <tr>
                        <td>
                          <div style="background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); border-left: 6px solid #17a2b8; border-radius: 15px; padding: 35px; position: relative;">
                            <div style="position: absolute; top: -12px; left: 25px; background: #17a2b8; color: white; width: 50px; height: 50px; border-radius: 50%; line-height: 50px; text-align: center; font-size: 20px;">🛡️</div>
                            
                            <h3 style="color: #0c5460; margin: 10px 0 20px 35px; font-size: 1.5em; font-weight: 700;">🔒 Proteção da Sua Conta</h3>
                            
                            <div style="color: #0c5460; margin-left: 35px; line-height: 1.6; font-size: 1.2em; font-weight: 500;">
                              <strong style="font-size: 1.1em;">❓ Não solicitou esta alteração?</strong><br><br>
                              Fique tranquilo(a)! Se você não pediu para redefinir sua senha, pode <strong>ignorar este email</strong> com total segurança. 
                              Sua conta permanece 100% protegida. Por precaução, considere alterar sua senha se suspeitar de qualquer atividade suspeita.
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 60px 0 20px 0;">
                      <tr>
                        <td>
                          <div style="text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 70%, #f5576c 100%); color: white; border-radius: 20px; box-shadow: 0 15px 40px rgba(102,126,234,0.3); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); opacity: 0.7;"></div>
                            
                            <div style="position: relative; z-index: 2;">
                              <p style="margin: 0 0 15px 0; font-size: 1.8em; font-weight: 700;">Continue forte na sua jornada de transformação! 🚀💪</p>
                              <p style="margin: 0; font-size: 2.2em; font-weight: 900; letter-spacing: 1px;">Equipe HealGym</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
                <tr>
                  <td style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%); color: #95a5a6; padding: 60px 80px; text-align: center;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <h3 style="margin: 0 0 20px 0; color: #667eea; font-size: 2.8em; font-weight: 900; letter-spacing: -1px;">HealGym</h3>
                          <p style="margin: 0 0 25px 0; font-style: italic; font-size: 1.6em; color: #bdc3c7;">💫 "Onde a transformação acontece" 💫</p>
                          <div style="height: 2px; width: 200px; background: linear-gradient(90deg, transparent, #667eea, #f093fb, transparent); margin: 0 auto 25px auto; border-radius: 1px;"></div>
                          <p style="margin: 0; font-size: 1.1em; line-height: 1.6; color: #7f8c8d;">
                            <strong>© 2025 HealGym - Todos os direitos reservados</strong><br>
                            Este é um email automático e seguro. Não responda esta mensagem.<br>
                            📧 Você está recebendo este email porque possui uma conta ativa no HealGym.<br>
                            🌟 Continue sua jornada de transformação conosco!
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
export default new EmailService();
