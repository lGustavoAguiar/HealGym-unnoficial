// Teste final do email via API
const testEmailAPI = async () => {
  console.log('🧪 Testando email via API do HealGym...');
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'zgustavoaguiar@gmail.com'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCESSO! Resposta da API:');
      console.log('📧 Mensagem:', result.message);
      if (result.devMode) {
        console.log('⚠️ Ainda em modo dev:', result.note);
      } else {
        console.log('🎉 EMAIL REAL ENVIADO!');
      }
    } else {
      console.log('❌ Erro na API:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Erro ao chamar API:', error.message);
  }
};

testEmailAPI();
