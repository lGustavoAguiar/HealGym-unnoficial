import sgMail from '@sendgrid/mail';

class EmailService {
  constructor() {
    this.initialized = false;
    this.initializeSendGrid();
  }

  initializeSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || 'zgustavoaguiar@gmail.com';

    console.log('🔧 ===== CONFIGURAÇÃO DE EMAIL (SendGrid) =====');
    console.log('📧 Email remetente:', emailFrom);
    console.log('🔑 API Key configurada:', apiKey ? '[CONFIGURADA]' : '[AUSENTE]');

    if (!apiKey) {
      console.error('❌ ERRO: SendGrid API Key não configurada!');
      this.initialized = false;
      return;
    }

    sgMail.setApiKey(apiKey);
    this.emailFrom = emailFrom;
    this.initialized = true;
    console.log('✅ SendGrid configurado com sucesso!');
    console.log('🔧 ===== CONFIGURAÇÃO CONCLUÍDA =====');
  }

  async sendPasswordResetEmail(email, resetToken) {
    if (!this.initialized) {
      console.log('📤 [MODO DEV] SendGrid não configurado - simulando envio');
      console.log(`📧 [MODO DEV] Email de destino: ${email}`);
      console.log(`🔗 [MODO DEV] Token de reset: ${resetToken}`);
      
      return { 
        success: true, 
        messageId: 'dev-mode-' + Date.now(),
        devMode: true
      };
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    const msg = {
      to: email,
      from: this.emailFrom,
      subject: '🔐 Recuperação de Senha - HealGym',
      html: this.getPasswordResetTemplate(resetUrl),
      text: `Olá! Você solicitou a recuperação de senha do HealGym. Acesse o link para redefinir sua senha: ${resetUrl} (O link expira em 15 minutos)`
    };

    try {
      console.log(`📤 Enviando email via SendGrid para: ${email}`);
      console.log(`📧 Remetente: ${this.emailFrom}`);
      console.log(`🔗 Link de reset: ${resetUrl}`);
      
      const response = await sgMail.send(msg);
      
      console.log('✅ EMAIL ENVIADO COM SUCESSO via SendGrid!');
      console.log('📧 Status:', response[0].statusCode);
      console.log(`✅ Email de recuperação enviado para: ${email}`);
      
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('❌ ERRO AO ENVIAR EMAIL via SendGrid:');
      console.error('🔍 Código:', error.code);
      console.error('🔍 Mensagem:', error.message);
      console.error('🔍 Response:', error.response?.body);
      
      throw new Error(`Falha ao enviar email: ${error.message}`);
    }
  }

  async sendAccountDeletionEmail(email, deletionToken) {
    if (!this.initialized) {
      console.log('📤 [MODO DEV] SendGrid não configurado - simulando envio');
      return { success: true, messageId: 'dev-mode-' + Date.now(), devMode: true };
    }

    const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirm-delete/${deletionToken}`;
    
    const msg = {
      to: email,
      from: this.emailFrom,
      subject: '⚠️ Confirmação de Exclusão de Conta - HealGym',
      html: this.getAccountDeletionTemplate(confirmationUrl),
      text: `Olá! Você solicitou a exclusão da sua conta no HealGym. Para confirmar, acesse o link: ${confirmationUrl} (O link expira em 30 minutos). Se não foi você, ignore este email.`
    };

    try {
      console.log(`📤 Enviando email de exclusão via SendGrid para: ${email}`);
      
      const response = await sgMail.send(msg);
      
      console.log('✅ EMAIL DE EXCLUSÃO ENVIADO COM SUCESSO via SendGrid!');
      
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('❌ ERRO AO ENVIAR EMAIL DE EXCLUSÃO via SendGrid:');
      console.error('🔍 Mensagem:', error.message);
      
      throw new Error(`Falha ao enviar email: ${error.message}`);
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
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 2.5em;">HealGym</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 1.1em;">Recuperação de Senha</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #333; margin-top: 0;">Olá! 👋</h2>
              <p style="color: #666; line-height: 1.6; font-size: 1.1em;">
                Você solicitou a redefinição de senha da sua conta no HealGym.
              </p>
              <p style="color: #666; line-height: 1.6; font-size: 1.1em;">
                Clique no botão abaixo para criar uma nova senha:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 1.1em;">
                  🔐 Redefinir Senha
                </a>
              </div>
              <p style="color: #666; line-height: 1.6; font-size: 0.95em;">
                Ou copie e cole este link no navegador:<br>
                <span style="color: #667eea; word-break: break-all;">${resetUrl}</span>
              </p>
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 0.95em;">
                  ⚠️ Este link expira em <strong>15 minutos</strong> e só pode ser usado uma vez.
                </p>
              </div>
              <p style="color: #999; font-size: 0.9em; margin-top: 30px;">
                Se você não solicitou esta alteração, ignore este email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 0.9em;">
              <p style="margin: 0;">© 2025 HealGym - Todos os direitos reservados</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  getAccountDeletionTemplate(confirmationUrl) {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmação de Exclusão - HealGym</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 2.5em;">⚠️ HealGym</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 1.1em;">Confirmação de Exclusão de Conta</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #dc2626; margin-top: 0;">Atenção! 🚨</h2>
              <p style="color: #666; line-height: 1.6; font-size: 1.1em;">
                Você solicitou a <strong>exclusão permanente</strong> da sua conta no HealGym.
              </p>
              <div style="background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #991b1b; font-weight: bold;">
                  ⚠️ Esta ação é IRREVERSÍVEL!
                </p>
                <p style="margin: 10px 0 0 0; color: #991b1b;">
                  Todos os seus dados serão permanentemente excluídos.
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 1.1em;">
                  🗑️ Confirmar Exclusão
                </a>
              </div>
              <p style="color: #666; line-height: 1.6; font-size: 0.95em;">
                Link expira em <strong>30 minutos</strong>.
              </p>
              <p style="color: #999; font-size: 0.9em; margin-top: 30px;">
                Se você não solicitou esta exclusão, ignore este email e sua conta permanecerá segura.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 0.9em;">
              <p style="margin: 0;">© 2025 HealGym - Todos os direitos reservados</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}

export default new EmailService();

