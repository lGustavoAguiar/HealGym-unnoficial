# 📧 Como Configurar o Email do HealGym

## 🚨 PROBLEMA ATUAL
A senha de app do Gmail está **inválida ou expirada**, por isso os emails não estão sendo enviados de verdade.

## ✅ SOLUÇÃO PASSO A PASSO

### 1. Gerar Nova Senha de App no Gmail

1. **Acesse:** https://myaccount.google.com/apppasswords
2. **Faça login** com sua conta Gmail (zgustavoaguiar@gmail.com)
3. **Verifique** se a verificação em 2 etapas está **ATIVADA** (obrigatório)
4. **Clique em "Gerar senha de app"**
5. **Selecione:** "Mail" como aplicativo
6. **Copie** a senha de 16 caracteres (exemplo: `abcd efgh ijkl mnop`)
7. **IMPORTANTE:** Use a senha SEM ESPAÇOS: `abcdefghijklmnop`

### 2. Atualizar o Código

**Arquivo:** `backend/utils/email.js` - Linha 11
```javascript
EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'SUA_NOVA_SENHA_AQUI',
```

**Arquivo:** `backend/test-email.js` - Linha 11
```javascript
pass: 'SUA_NOVA_SENHA_AQUI'
```

### 3. Testar a Configuração

```bash
cd backend
node test-email.js
```

**Resultado esperado:**
```
✅ Conexão Gmail OK!
✅ EMAIL ENVIADO COM SUCESSO!
📧 Message ID: <algum-id>
📬 Verifique sua caixa de entrada!
```

### 4. Verificar se Funciona no Sistema

1. **Inicie o servidor:** `npm start`
2. **Teste recuperação de senha** no frontend
3. **Verifique** se o email chega na caixa de entrada

## 🔒 DICAS DE SEGURANÇA

- ✅ **Use variáveis de ambiente** em produção
- ✅ **Nunca commite** senhas no git
- ✅ **Gere nova senha** se suspeitar de comprometimento
- ✅ **Mantenha** a verificação em 2 etapas ativada

## 🐛 SOLUÇÃO DE PROBLEMAS

### Erro: "Invalid login"
- Gere uma nova senha de app
- Verifique se não há espaços na senha
- Confirme que a verificação em 2 etapas está ativa

### Erro: "Connection timeout"
- Verifique sua conexão com a internet
- Tente usar outro provedor de email

### Email não chega
- Verifique a pasta de spam
- Confirme se o email de destino está correto
- Teste enviando para outro email

## 📞 SUPORTE

Se ainda tiver problemas, verifique:
1. Console do servidor para logs detalhados
2. Configurações de firewall/antivírus
3. Configurações de rede corporativa
