import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    // Se tiver configuração de email, usar Gmail ou Outlook
    if (process.env.EMAIL_FROM && process.env.EMAIL_PASSWORD) {
      const emailService = process.env.EMAIL_SERVICE || 'gmail';
      console.log(`📧 Configurando ${emailService} para envio de emails...`);
      
      let transportConfig = {
        service: emailService,
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.EMAIL_PASSWORD
        }
      };

      // Configuração específica para Outlook/Hotmail
      if (emailService === 'outlook') {
        transportConfig = {
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.EMAIL_PASSWORD
          }
        };
      }

      this.transporter = nodemailer.createTransport(transportConfig);

      // Testar a conexão
      try {
        await this.transporter.verify();
        console.log(`✅ Conectado ao ${emailService} com sucesso!`);
        console.log('📨 Emails serão enviados de:', process.env.EMAIL_FROM);
      } catch (error) {
        console.error(`❌ Erro na conexão com ${emailService}:`, error.message);
        console.log('⚠️ Fallback para Ethereal Email...');
        await this.createTestTransporter();
      }
    } else {
      console.log('⚠️ Configuração de email não encontrada. Usando Ethereal Email.');
      await this.createTestTransporter();
    }
  }

  async createTestTransporter() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('📧 Usando Ethereal Email para desenvolvimento');
    } catch (error) {
      console.error('Erro ao criar transportador de teste:', error);
    }
  }

  async sendPasswordResetEmail(email, resetToken) {
    // Garantir que o transporter esteja inicializado
    if (!this.transporter) {
      await this.initializeTransporter();
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🔐 Recuperação de Senha - HealGym',
      html: this.getPasswordResetTemplate(resetUrl),
      text: `Olá! Você solicitou a recuperação de senha do HealGym. Acesse o link para redefinir sua senha: ${resetUrl} (O link expira em 15 minutos)`
    };

    try {
      console.log(`📤 Enviando email de recuperação para: ${email}`);
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email enviado com sucesso!');
      console.log('📧 Message ID:', info.messageId);
      
      if (process.env.NODE_ENV === 'development' && nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) {
        console.log('� Preview URL (Ethereal):', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw new Error(`Falha ao enviar email de recuperação: ${error.message}`);
    }
  }

  getPasswordResetTemplate(resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - HealGym</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 2.2em;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5em;
          }
          .content p {
            margin-bottom: 20px;
            font-size: 16px;
            line-height: 1.7;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.3s ease;
          }
          .reset-button:hover {
            transform: translateY(-2px);
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-top: 1px solid #eee;
          }
          .footer a {
            color: #D4AF37;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️ HealGym</h1>
          </div>
          <div class="content">
            <h2>Recuperação de Senha</h2>
            <p>Olá!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no HealGym. Se você não fez esta solicitação, pode ignorar este email com segurança.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="reset-button">Redefinir Minha Senha</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este link expira em <strong>15 minutos</strong></li>
                <li>Só pode ser usado uma única vez</li>
                <li>Se não funcionar, solicite um novo link de recuperação</li>
              </ul>
            </div>
            
            <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>
            
            <p>Se você não solicitou esta recuperação de senha, entre em contato conosco imediatamente.</p>
            
            <p>Atenciosamente,<br><strong>Equipe HealGym</strong></p>
          </div>
          <div class="footer">
            <p>Este é um email automático, não responda esta mensagem.</p>
            <p>© 2025 HealGym. Todos os direitos reservados.</p>
            <p>Precisa de ajuda? <a href="mailto:suporte@healgym.com">Entre em contato</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();
