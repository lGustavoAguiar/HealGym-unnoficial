# Sistema de Dietas com API USDA FoodData Central

## 📋 Visão Geral

O HealGym agora possui um sistema completo de geração de dietas personalizadas com informações nutricionais detalhadas, integrado com a **API USDA FoodData Central**, uma das bases de dados nutricionais mais confiáveis do mundo.

## 🌟 Funcionalidades Implementadas

### ✅ Backend

1. **Rotas de Nutrição** (`/api/nutrition`)
   - `GET /foods` - Lista todos os alimentos disponíveis
   - `GET /food/:foodId` - Detalhes nutricionais de um alimento específico
   - `POST /search` - Busca alimentos na base da USDA
   - `POST /generate-diet` - Gera dieta personalizada
   - `GET /my-diets` - Histórico de dietas do usuário
   - `GET /diet/:dietId` - Recupera uma dieta específica

2. **Modelo de Dados**
   - Schema `Diet` para armazenar dietas geradas
   - Suporte a preferências alimentares
   - Campo para orçamento (preparado para implementação futura)

3. **Banco de Alimentos**
   - 40+ alimentos mapeados com FDC IDs da USDA
   - Categorias: proteínas, carboidratos, gorduras, vegetais, frutas, laticínios
   - Suporte a alimentos brasileiros

4. **Cache de Dados Nutricionais**
   - Sistema de cache em memória para evitar requisições repetidas à API
   - Melhora performance e reduz custos

### ✅ Frontend

1. **Interface Modernizada**
   - Cards de estatísticas (IMC, TMB, Meta Calórica)
   - Geração de dieta com um clique
   - Visualização completa de macros e micros
   - Histórico de dietas anteriores

2. **Informações Nutricionais Detalhadas**
   - **Macronutrientes**: Calorias, Proteínas, Carboidratos, Gorduras, Fibras
   - **Minerais**: Cálcio, Ferro, Magnésio, Fósforo, Potássio, Sódio, Zinco
   - **Vitaminas**: A, C, D, E, B12, Folato
   - **Outros**: Gordura Saturada, Colesterol

3. **Cálculo Inteligente**
   - TMB (Taxa Metabólica Basal) com fórmula Harris-Benedict
   - Distribuição de macros baseada no objetivo
   - Ajuste automático de porções

## 🔧 Configuração

### 1. API Key da USDA

Para usar a API completa, obtenha uma chave gratuita:

1. Acesse: https://fdc.nal.usda.gov/api-key-signup.html
2. Preencha o formulário de registro
3. Você receberá a API key por email
4. Adicione no arquivo `.env`:

```env
USDA_API_KEY=sua-chave-aqui
```

**Nota**: O sistema funciona com `DEMO_KEY`, mas possui limitações de taxa.

### 2. Instalação

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Variáveis de Ambiente

Crie o arquivo `backend/.env` baseado no `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/healgym
JWT_SECRET=your-secret-key
USDA_API_KEY=sua-chave-usda
```

## 🚀 Como Usar

### 1. Iniciar os Serviços

```bash
# Com Docker
docker compose up -d

# Ou manualmente
cd backend && npm start
cd frontend && npm run dev
```

### 2. Gerar Dieta

1. Faça login no HealGym
2. Complete seu perfil (peso, altura, data de nascimento, gênero)
3. Acesse "Dieta" no dashboard
4. Clique em "Gerar Minha Dieta"
5. Aguarde o processamento (busca dados na API USDA)
6. Visualize sua dieta completa com informações nutricionais

### 3. Visualizar Histórico

- Dietas anteriores ficam salvas no banco de dados
- Acesse o histórico na parte inferior da página
- Clique em uma dieta anterior para visualizá-la

## 📊 Detalhes Técnicos

### Distribuição de Macronutrientes

**Emagrecimento**:
- Proteínas: 35%
- Carboidratos: 35%
- Gorduras: 30%

**Ganho de Peso**:
- Proteínas: 30%
- Carboidratos: 45%
- Gorduras: 25%

**Manutenção**:
- Proteínas: 30%
- Carboidratos: 40%
- Gorduras: 30%

### Algoritmo de Geração

1. **Cálculo da TMB**: Fórmula Harris-Benedict revisada
2. **Definição de Objetivo**: Baseado no IMC do usuário
3. **Ajuste Calórico**: 
   - Emagrecimento: TMB (déficit natural)
   - Ganho: TMB + 200 kcal
   - Manutenção: TMB
4. **Seleção de Alimentos**: Variedade por categoria e refeição
5. **Cálculo de Porções**: Ajuste automático para atingir metas
6. **Busca Nutricional**: Requisição à API USDA para dados precisos

### Cache e Performance

- Dados nutricionais são armazenados em cache (Map)
- Cache persiste durante a sessão do servidor
- Reduz tempo de resposta de ~2s para ~100ms

## 🔮 Funcionalidades Futuras

### 1. Sistema de Orçamento
- Campo `orcamento` já existe no modelo
- Preços dos alimentos (integração com APIs de supermercados)
- Geração de dieta dentro do orçamento especificado
- Comparação de custos entre dietas

### 2. Preferências Alimentares
- Interface para selecionar preferências:
  - ☑️ Carne vermelha
  - ☑️ Frango
  - ☑️ Peixe
  - ☑️ Ovos
  - ☑️ Vegetariano
  - ☑️ Vegano
- Filtro de alimentos baseado em preferências
- Dietas personalizadas para restrições alimentares

### 3. Melhorias Planejadas
- [ ] Substituição de alimentos (não gostou de algo?)
- [ ] Lista de compras automática
- [ ] Exportar dieta em PDF
- [ ] Notificações de horário de refeições
- [ ] Registro de refeições consumidas
- [ ] Gráficos de progresso nutricional
- [ ] Receitas detalhadas para preparo
- [ ] Integração com aplicativos de delivery

## 🧪 Testes

### Testar Rota de Alimentos

```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:5000/api/nutrition/foods
```

### Testar Geração de Dieta

```bash
curl -X POST \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetCalories": 2000,
    "objetivo": "emagrecimento",
    "refeicoesPorDia": 4
  }' \
  http://localhost:5000/api/nutrition/generate-diet
```

### Testar Busca de Alimentos

```bash
curl -X POST \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "chicken breast",
    "pageSize": 5
  }' \
  http://localhost:5000/api/nutrition/search
```

## 📚 Recursos da API USDA

### Documentação Oficial
- https://fdc.nal.usda.gov/api-guide.html

### Tipos de Dados Disponíveis
- **Foundation Foods**: Alimentos básicos com perfil completo
- **SR Legacy**: Base de referência padrão da USDA
- **Survey Foods**: Alimentos consumidos em pesquisas nacionais
- **Branded Foods**: Produtos de marcas comerciais

### Limitações
- **DEMO_KEY**: 30 requisições/hora, 50 requisições/dia
- **API Key gratuita**: 1000 requisições/hora

## 🐛 Troubleshooting

### Erro: "Token não fornecido"
- Verifique se está autenticado
- Token JWT deve estar no header `Authorization: Bearer TOKEN`

### Erro: "Não foi possível buscar informações nutricionais"
- Verifique sua conexão com a internet
- Confirme se a API key está configurada
- Verifique se não excedeu o limite de requisições

### Dieta não aparece
- Verifique se completou o perfil (peso, altura, etc.)
- Abra o console do navegador (F12) para ver logs
- Verifique logs do backend

### Performance lenta
- Sistema de cache pode levar alguns segundos na primeira requisição
- Requisições subsequentes são mais rápidas
- Considere usar API key própria ao invés de DEMO_KEY

## 💡 Dicas

1. **Primeiro Uso**: A primeira geração de dieta pode demorar mais (2-5s) pois busca dados da API
2. **Cache**: Dietas subsequentes são mais rápidas devido ao cache
3. **Variedade**: O sistema automaticamente varia os alimentos entre refeições
4. **Ajuste Manual**: No futuro, você poderá ajustar porções e substituir alimentos

## 🤝 Contribuindo

Sugestões de melhorias são bem-vindas! Áreas prioritárias:

1. Expansão do banco de alimentos brasileiros
2. Interface de preferências alimentares
3. Sistema de orçamento
4. Melhorias no algoritmo de distribuição de alimentos
5. Testes automatizados

## 📝 Changelog

### v2.0.0 (Atual)
- ✅ Integração com API USDA FoodData Central
- ✅ Sistema de cache de dados nutricionais
- ✅ Geração de dieta personalizada
- ✅ Histórico de dietas
- ✅ Interface modernizada
- ✅ Informações detalhadas de micronutrientes
- ✅ Modelo de dados para dietas
- ✅ 40+ alimentos mapeados

### v1.0.0 (Anterior)
- Banco de dados local com 5 alimentos
- Cálculos manuais de nutrição
- Interface básica

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Consulte a documentação da API USDA
- Verifique os logs do backend

---

**Desenvolvido com 💪 para HealGym**
