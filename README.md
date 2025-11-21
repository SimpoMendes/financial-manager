# 💰 Gestor Financeiro

Sistema completo de gestão financeira com foco em fluxo de caixa e categorização de despesas.

## 🚀 Funcionalidades

### Dashboard
- **Resumo Financeiro**: Visualização do saldo total, receitas e despesas
- **Gráfico de Fluxo de Caixa**: Acompanhamento mensal de receitas e despesas
- **Gráfico de Categorias**: Distribuição das despesas por categoria

### Transações
- **Cadastro de Transações**: Adicionar receitas e despesas com descrição, valor, categoria e data
- **Histórico Completo**: Lista todas as transações com filtros por tipo e categoria
- **Exclusão de Transações**: Remover transações indesejadas

### Categorias
- **Gestão de Categorias**: Criar categorias personalizadas para receitas e despesas
- **Cores Personalizadas**: Atribuir cores específicas para melhor visualização
- **Categorias Padrão**: Sistema já vem com categorias pré-definidas

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Design responsivo com gradientes e animações
- **JavaScript ES6+**: Lógica de negócio e manipulação do DOM
- **Chart.js**: Biblioteca para gráficos interativos
- **LocalStorage**: Persistência de dados no navegador

## 📱 Design Responsivo

O sistema é totalmente responsivo e otimizado para:
- **Desktop**: Layout completo com todas as funcionalidades
- **Tablet**: Interface adaptada para telas médias
- **Mobile**: Design otimizado para smartphones

## 🎨 Características do Design

- **Interface Moderna**: Design clean com gradientes e sombras suaves
- **Cores Intuitivas**: Verde para receitas, vermelho para despesas
- **Animações Suaves**: Transições e hover effects
- **Tipografia Legível**: Fonte Segoe UI para melhor legibilidade

## 📊 Funcionalidades dos Gráficos

### Gráfico de Fluxo de Caixa
- Exibe receitas e despesas dos últimos 6 meses
- Linha temporal interativa
- Tooltips com valores formatados

### Gráfico de Categorias
- Gráfico de rosca (doughnut) das despesas por categoria
- Top 8 categorias com maior gasto
- Cores personalizadas por categoria

## 💾 Armazenamento de Dados

- **LocalStorage**: Todos os dados são salvos localmente no navegador
- **Persistência**: Dados mantidos entre sessões
- **Backup Manual**: Dados podem ser exportados via console do navegador

## 🔧 Como Usar

1. **Abrir o Sistema**: Abra o arquivo `index.html` em qualquer navegador moderno
2. **Criar Categorias**: Vá para a aba "Categorias" e crie suas categorias personalizadas
3. **Adicionar Transações**: Na aba "Transações", cadastre suas receitas e despesas
4. **Visualizar Dashboard**: Acompanhe seus dados financeiros na aba "Dashboard"

## 📋 Estrutura do Projeto

```
financial-manager/
├── index.html          # Estrutura HTML principal
├── styles.css          # Estilos CSS responsivos
├── script.js           # Lógica JavaScript
└── README.md           # Documentação
```

## 🎯 Melhores Práticas Implementadas

### HTML
- Estrutura semântica com tags apropriadas
- Acessibilidade com labels e atributos ARIA
- Meta tags para responsividade

### CSS
- Mobile-first approach
- Variáveis CSS para consistência
- Flexbox e Grid para layouts
- Animações performáticas

### JavaScript
- Programação orientada a objetos
- Separação de responsabilidades
- Tratamento de erros
- Código documentado com JSDoc

## 🔒 Segurança

- **Validação de Dados**: Todos os inputs são validados
- **Sanitização**: Prevenção contra XSS
- **Armazenamento Local**: Dados ficam apenas no dispositivo do usuário

## 🌐 Compatibilidade

### Navegadores Suportados
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Recursos Utilizados
- ES6+ (Classes, Arrow Functions, Template Literals)
- LocalStorage API
- Canvas API (para gráficos)
- CSS Grid e Flexbox

## 📈 Funcionalidades Avançadas

### Filtros Inteligentes
- Filtrar transações por tipo (receita/despesa)
- Filtrar por categoria específica
- Ordenação cronológica automática

### Cálculos Automáticos
- Saldo total em tempo real
- Totais por categoria
- Médias mensais

### Interface Intuitiva
- Notificações de sucesso
- Confirmações de exclusão
- Feedback visual em todas as ações

## 🚀 Possíveis Melhorias Futuras

- Exportação de dados (CSV, PDF)
- Metas financeiras
- Relatórios detalhados
- Sincronização em nuvem
- Modo escuro
- Múltiplas moedas

## 📞 Suporte

Para dúvidas ou sugestões sobre o sistema, consulte a documentação no código ou analise os comentários inline para entender o funcionamento de cada funcionalidade.