import nodemailer from 'nodemailer';
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }
  async initializeTransporter() {
    if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASSWORD) {
      throw new Error('❌ Configuração de email não encontrada. Defina EMAIL_FROM e EMAIL_PASSWORD no arquivo .env');
    }
    
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    console.log(`📧 Configurando ${emailService} para envio de emails...`);
    
    let transportConfig = {
      service: emailService,
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD
      }
    };
    
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
    
    try {
      await this.transporter.verify();
      console.log(`✅ Conectado ao ${emailService} com sucesso!`);
      console.log('📨 Emails serão enviados de:', process.env.EMAIL_FROM);
    } catch (error) {
      console.error(`❌ Erro na conexão com ${emailService}:`, error.message);
      throw new Error(`Falha ao conectar com o serviço de email: ${error.message}`);
    }
  }
  async sendPasswordResetEmail(email, resetToken) {
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
      console.log(`✅ Email de recuperação enviado para: ${email}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw new Error(`Falha ao enviar email de recuperação: ${error.message}`);
    }
  }
  getPasswordResetTemplate(resetUrl) {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Recuperação de Senha - HealGym</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.7;
            color: #1a202c;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            margin: 0;
            padding: 30px 15px;
            min-height: 100vh;
          }
          .email-wrapper {
            width: 100%;
            max-width: 680px;
            margin: 0 auto;
            background: transparent;
          }
          .container {
            background: #ffffff;
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3);
            position: relative;
          }
          .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            pointer-events: none;
            z-index: 1;
          }
          .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #667eea 100%);
            color: white;
            padding: 60px 50px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.03) 10px,
              rgba(255,255,255,0.03) 20px
            );
            animation: float 20s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          .header-content {
            position: relative;
            z-index: 2;
          }
          .logo-container {
            margin-bottom: 20px;
          }
          .logo {
            font-size: 3.5em;
            font-weight: 800;
            margin-bottom: 5px;
            background: linear-gradient(45deg, #ffffff, #e2e8f0, #ffffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            display: inline-block;
            text-shadow: 0 4px 8px rgba(0,0,0,0.3);
          }
          .logo-icon {
            display: inline-block;
            width: 60px;
            height: 60px;
            margin-right: 15px;
            background: linear-gradient(135deg, #f093fb, #f5576c);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            box-shadow: 0 8px 25px rgba(240, 147, 251, 0.4);
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .subtitle {
            font-size: 1.3em;
            font-weight: 300;
            opacity: 0.95;
            margin-bottom: 0;
            letter-spacing: 1px;
          }
          .tagline {
            font-size: 0.95em;
            opacity: 0.8;
            font-weight: 400;
            margin-top: 10px;
            font-style: italic;
          }
          .content {
            padding: 60px 50px;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);
            position: relative;
          }
          .content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 20px;
            right: 20px;
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          }
          .welcome-section {
            text-align: center;
            margin-bottom: 50px;
          }
          .welcome-title {
            font-size: 2.5em;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
          }
          .lock-icon {
            display: inline-block;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 35px;
            color: white;
            margin: 0 auto 25px;
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
            animation: lockShake 3s ease-in-out infinite;
          }
          @keyframes lockShake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            75% { transform: rotate(5deg); }
          }
          .greeting {
            font-size: 1.4em;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 25px;
            text-align: center;
          }
          .message {
            font-size: 1.15em;
            margin-bottom: 30px;
            line-height: 1.8;
            color: #4a5568;
            text-align: center;
          }
          .highlight {
            background: linear-gradient(120deg, #f093fb 0%, #f5576c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 600;
          }
          .button-container {
            text-align: center;
            margin: 50px 0;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 22px 45px;
            border-radius: 60px;
            font-weight: 600;
            font-size: 1.2em;
            text-align: center;
            transition: all 0.4s ease;
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
            border: none;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .reset-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s;
          }
          .reset-button:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 20px 50px rgba(102, 126, 234, 0.5);
          }
          .reset-button:hover::before {
            left: 100%;
          }
          .security-section {
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
            border-left: 6px solid #f56565;
            border-radius: 15px;
            padding: 30px;
            margin: 40px 0;
            position: relative;
          }
          .security-section::before {
            content: '⚠️';
            position: absolute;
            top: -10px;
            left: 20px;
            background: #f56565;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          }
          .security-title {
            font-weight: 700;
            color: #c53030;
            margin-bottom: 15px;
            margin-left: 20px;
            font-size: 1.2em;
          }
          .security-list {
            list-style: none;
            color: #c53030;
            margin-left: 20px;
          }
          .security-list li {
            margin-bottom: 12px;
            padding-left: 25px;
            position: relative;
            font-weight: 500;
          }
          .security-list li::before {
            content: '🔒';
            position: absolute;
            left: 0;
            top: 2px;
          }
          .url-section {
            background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
            border: 3px dashed #cbd5e1;
            border-radius: 18px;
            padding: 30px;
            margin: 35px 0;
            text-align: center;
          }
          .url-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 1.1em;
          }
          .url-box {
            background: #f7fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #4a5568;
            font-weight: 500;
          }
          .protection-section {
            background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
            border-left: 6px solid #48bb78;
            border-radius: 15px;
            padding: 30px;
            margin: 40px 0;
            position: relative;
          }
          .protection-section::before {
            content: '🛡️';
            position: absolute;
            top: -10px;
            left: 20px;
            background: #48bb78;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          }
          .protection-title {
            font-weight: 700;
            color: #2f855a;
            margin-bottom: 15px;
            margin-left: 20px;
            font-size: 1.2em;
          }
          .protection-text {
            color: #2f855a;
            line-height: 1.7;
            margin-left: 20px;
            font-weight: 500;
          }
          .signature {
            text-align: center;
            margin-top: 50px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            color: white;
          }
          .signature-text {
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .signature-team {
            font-size: 1.4em;
            font-weight: 800;
            background: linear-gradient(45deg, #ffffff, #f7fafc, #ffffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .footer {
            background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
            color: #a0aec0;
            padding: 50px;
            text-align: center;
            position: relative;
          }
          .footer-brand {
            font-size: 1.8em;
            font-weight: 800;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
          }
          .footer-tagline {
            font-size: 1.1em;
            font-weight: 500;
            color: #cbd5e1;
            margin-bottom: 30px;
            font-style: italic;
          }
          .footer-links {
            margin-bottom: 25px;
          }
          .footer-links a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            margin: 0 15px;
            transition: all 0.3s ease;
            padding: 5px 10px;
            border-radius: 5px;
          }
          .footer-links a:hover {
            background: #667eea;
            color: white;
            transform: translateY(-2px);
          }
          .footer-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #4a5568, transparent);
            margin: 30px 0;
          }
          .footer-copyright {
            font-size: 0.9em;
            color: #718096;
            line-height: 1.6;
          }
          .social-section {
            margin: 30px 0;
          }
          .social-icons {
            display: flex;
            justify-content: center;
            gap: 20px;
          }
          .social-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-decoration: none;
            font-size: 20px;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
          }
          .social-icon:hover {
            transform: translateY(-3px) scale(1.1);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
          }
          @media (max-width: 640px) {
            body {
              padding: 15px 10px;
            }
            .content, .header {
              padding: 40px 25px;
            }
            .logo {
              font-size: 2.5em;
            }
            .welcome-title {
              font-size: 2em;
            }
            .reset-button {
              padding: 18px 35px;
              font-size: 1.1em;
            }
            .message {
              font-size: 1.05em;
            }
            .footer {
              padding: 40px 25px;
            }
            .social-icons {
              flex-wrap: wrap;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="header">
              <div class="header-content">
                <div class="logo-container">
                  <div class="logo">HealGym</div>
                </div>
                <p class="subtitle">Transformando Vidas, Fortalecendo Sonhos</p>
                <p class="tagline">Sua jornada de superação começa aqui</p>
              </div>
            </div>
            <div class="content">
              <div class="welcome-section">
                <div class="lock-icon">🔐</div>
                <h1 class="welcome-title">Recuperação de Senha</h1>
                <div class="greeting">Olá, <span class="highlight">Guerreiro(a)</span>! 💪</div>
              </div>
              <div class="message">
                Recebemos sua solicitação para redefinir a senha da sua conta no <strong class="highlight">HealGym</strong>. 
                Sabemos que cada detalhe importa na sua jornada de transformação, e a segurança da sua conta é nossa prioridade!
              </div>
              <div class="message">
                Clique no botão abaixo para criar uma nova senha forte e continuar conquistando seus objetivos:
              </div>
              <div class="button-container">
                <a href="${resetUrl}" class="reset-button">✨ Redefinir Minha Senha</a>
              </div>
              <div class="security-section">
                <div class="security-title">Informações de Segurança</div>
                <ul class="security-list">
                  <li>Este link é válido por apenas <strong>15 minutos</strong></li>
                  <li>Pode ser usado apenas <strong>uma única vez</strong></li>
                  <li>Após o uso, será automaticamente invalidado</li>
                  <li>Nunca compartilhe este link com terceiros</li>
                </ul>
              </div>
              <div class="url-section">
                <div class="url-title">🔗 O botão não está funcionando? Use o link abaixo:</div>
                <div class="url-box">
                  ${resetUrl}
                </div>
              </div>
              <div class="protection-section">
                <div class="protection-title">Proteção da Sua Conta</div>
                <div class="protection-text">
                  <strong>Não solicitou esta alteração?</strong><br>
                  Fique tranquilo(a)! Se você não pediu para redefinir sua senha, pode ignorar este email com total segurança. 
                  Sua conta permanece 100% protegida. Por precaução, considere alterar sua senha se suspeitar de qualquer atividade não autorizada.
                </div>
              </div>
              <div class="signature">
                <div class="signature-text">Continue forte na sua jornada de transformação! 🚀</div>
                <div class="signature-team">Equipe HealGym</div>
              </div>
            </div>
            <div class="footer">
              <div class="footer-brand">HealGym</div>
              <div class="footer-tagline">"Onde a transformação acontece"</div>              
              <div class="footer-copyright">
                <strong>© 2025 HealGym - Todos os direitos reservados</strong><br>
                Este é um email automático e seguro. Não responda esta mensagem.<br>
                Você está recebendo este email porque possui uma conta ativa no HealGym.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
export default new EmailService();
