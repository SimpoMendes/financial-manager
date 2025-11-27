/**
 * Sistema de Gestão Financeira
 * Gerencia transações, categorias e gráficos de fluxo de caixa
 */

class FinancialManager {
    constructor() {
        this.transactions = [];
        this.categories = [];
        this.budgets = {};
        this.investments = [];
        this.charts = {};
        this.editingId = null;
        this.editingInvestmentId = null;
        this.editingBudgetKey = null;
        this.isFirebaseReady = false;
        
        this.initFirebase();
    }

    /**
     * Inicializa Firebase e carrega dados
     */
    async initFirebase() {
        try {
            // Autentica usuário
            await firebaseManager.authenticateUser();
            
            // Carrega dados do Firebase/localStorage
            await this.loadAllData();
            
            this.isFirebaseReady = true;
            this.init();
        } catch (error) {
            console.error('Erro ao inicializar Firebase:', error);
            // Fallback para localStorage
            this.loadDataFromLocalStorage();
            this.init();
        }
    }

    /**
     * Carrega todos os dados
     */
    async loadAllData() {
        this.transactions = await firebaseManager.loadFromFirebase('transactions') || [];
        this.categories = await firebaseManager.loadFromFirebase('categories') || this.getDefaultCategories();
        this.budgets = await firebaseManager.loadFromFirebase('budgets') || {};
        this.investments = await firebaseManager.loadFromFirebase('investments') || [];
    }

    /**
     * Fallback para localStorage
     */
    loadDataFromLocalStorage() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || this.getDefaultCategories();
        this.budgets = JSON.parse(localStorage.getItem('budgets')) || {};
        this.investments = JSON.parse(localStorage.getItem('investments')) || [];
    }

    /**
     * Inicializa o sistema
     */
    init() {
        this.setupEventListeners();
        this.setupTabs();
        this.loadCategories();
        this.populateYearFilter();
        this.populateMonthFilter();
        this.populateYearFilterTrans();
        this.populateMonthFilterTrans();
        this.populateMonthlyFilters();
        this.updateDashboard();
        this.updateMonthlyControl();
        this.updateInvestmentSummary();
        this.renderTransactions();
        this.renderCategories();
        this.renderInvestments();
        this.initCharts();
        
        // Define data atual como padrão
        document.getElementById('date').valueAsDate = new Date();
        document.getElementById('investmentDate').valueAsDate = new Date();
        document.getElementById('budgetMonth').value = new Date().toISOString().slice(0, 7);
        
        // Atualiza status de conexão
        this.updateConnectionStatus();
        setInterval(() => this.updateConnectionStatus(), 5000); // Atualiza a cada 5s
    }

    /**
     * Categorias padrão do sistema
     */
    getDefaultCategories() {
        return [
            // Receitas
            { id: 1, name: 'Salário', type: 'income', color: '#27ae60' },
            { id: 2, name: 'Freelance', type: 'income', color: '#2ecc71' },
            { id: 3, name: 'Investimentos', type: 'income', color: '#16a085' },
            { id: 4, name: 'Vendas', type: 'income', color: '#1abc9c' },
            { id: 5, name: 'Outros Rendimentos', type: 'income', color: '#58d68d' },
            
            // Despesas Essenciais
            { id: 6, name: 'Alimentação', type: 'expense', color: '#e74c3c' },
            { id: 7, name: 'Moradia', type: 'expense', color: '#8e44ad' },
            { id: 8, name: 'Transporte', type: 'expense', color: '#e67e22' },
            { id: 9, name: 'Combustível', type: 'expense', color: '#d35400' },
            { id: 10, name: 'Saúde', type: 'expense', color: '#c0392b' },
            { id: 11, name: 'Educação', type: 'expense', color: '#2980b9' },
            
            // Despesas Variáveis
            { id: 12, name: 'Lazer', type: 'expense', color: '#f39c12' },
            { id: 13, name: 'Roupas', type: 'expense', color: '#9b59b6' },
            { id: 14, name: 'Tecnologia', type: 'expense', color: '#34495e' },
            { id: 15, name: 'Viagens', type: 'expense', color: '#e67e22' },
            { id: 16, name: 'Restaurantes', type: 'expense', color: '#e74c3c' },
            
            // Contas Fixas
            { id: 17, name: 'Internet', type: 'expense', color: '#3498db' },
            { id: 18, name: 'Telefone', type: 'expense', color: '#1abc9c' },
            { id: 19, name: 'Energia Elétrica', type: 'expense', color: '#f1c40f' },
            { id: 20, name: 'Água', type: 'expense', color: '#3498db' },
            { id: 21, name: 'Gás', type: 'expense', color: '#95a5a6' },
            
            // Outros
            { id: 22, name: 'Seguros', type: 'expense', color: '#7f8c8d' },
            { id: 23, name: 'Impostos', type: 'expense', color: '#2c3e50' },
            { id: 24, name: 'Doações', type: 'expense', color: '#e91e63' },
            { id: 25, name: 'Outros', type: 'expense', color: '#95a5a6' }
        ];
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Formulário de transações
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Formulário de categorias
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCategory();
        });

        // Filtros
        document.getElementById('filterType').addEventListener('change', () => this.renderTransactions());
        document.getElementById('filterCategory').addEventListener('change', () => this.renderTransactions());
        document.getElementById('filterYearTrans').addEventListener('change', () => {
            this.populateMonthFilterTrans();
            this.renderTransactions();
        });
        document.getElementById('filterMonthTrans').addEventListener('change', () => this.renderTransactions());

        // Atualizar categorias quando tipo muda
        document.getElementById('type').addEventListener('change', () => this.updateCategoryOptions());
        
        // Filtros no dashboard
        document.getElementById('monthFilter').addEventListener('change', () => {
            this.updateDashboard();
            this.updateCharts();
        });
        
        document.getElementById('yearFilter').addEventListener('change', () => {
            this.populateMonthFilter();
            this.updateDashboard();
            this.updateCharts();
        });

        // Formulário de orçamento mensal
        document.getElementById('budgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.setBudget();
        });

        // Formulário de investimentos
        document.getElementById('investmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addInvestment();
        });

        // Filtros do controle mensal
        document.getElementById('monthlyYearFilter').addEventListener('change', () => {
            this.populateMonthlyMonthFilter();
            this.updateMonthlyControl();
            this.updateMonthlyCharts();
        });
        
        document.getElementById('monthlyMonthFilter').addEventListener('change', () => {
            this.updateMonthlyControl();
            this.updateMonthlyCharts();
        });

        // Atualizar tipo de investimento com taxas sugeridas
        document.getElementById('investmentType').addEventListener('change', () => {
            this.updateSuggestedRate();
        });
    }

    /**
     * Configura sistema de abas
     */
    setupTabs() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Remove active de todas as abas
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                
                // Ativa aba selecionada
                btn.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
                // Atualiza gráficos se necessário
                if (tabId === 'dashboard') {
                    setTimeout(() => this.updateCharts(), 100);
                } else if (tabId === 'monthly') {
                    setTimeout(() => this.updateMonthlyCharts(), 100);
                } else if (tabId === 'investments') {
                    setTimeout(() => this.updateInvestmentCharts(), 100);
                }
            });
        });
    }

    /**
     * Popula filtro de anos
     */
    populateYearFilter() {
        const yearFilter = document.getElementById('yearFilter');
        const years = new Set();
        
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.date + 'T00:00:00');
            years.add(date.getFullYear());
        });
        
        const currentValue = yearFilter.value;
        
        // Limpa opções existentes
        yearFilter.innerHTML = '<option value="all">Todos os anos</option>';
        
        // Adiciona anos ordenados
        Array.from(years).sort().reverse().forEach(year => {
            const option = new Option(year, year);
            yearFilter.appendChild(option);
        });
        
        // Restaura valor selecionado se ainda existir
        if (currentValue && Array.from(yearFilter.options).some(opt => opt.value === currentValue)) {
            yearFilter.value = currentValue;
        }
    }
    
    /**
     * Popula filtro de meses
     */
    populateMonthFilter() {
        const monthFilter = document.getElementById('monthFilter');
        const months = new Set();
        
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.date + 'T00:00:00');
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
        });
        
        const currentValue = monthFilter.value;
        
        // Limpa opções existentes
        monthFilter.innerHTML = '<option value="all">Todos os meses</option>';
        
        // Adiciona meses ordenados
        Array.from(months).sort().reverse().forEach(monthKey => {
            const [year, month] = monthKey.split('-');
            const date = new Date(year, month - 1);
            const monthName = date.toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
            }).replace(/^\w/, c => c.toUpperCase());
            const option = new Option(monthName, monthKey);
            monthFilter.appendChild(option);
        });
        
        // Restaura valor selecionado se ainda existir
        if (currentValue && Array.from(monthFilter.options).some(opt => opt.value === currentValue)) {
            monthFilter.value = currentValue;
        }
    }

    /**
     * Popula filtro de anos para transações
     */
    populateYearFilterTrans() {
        const yearFilter = document.getElementById('filterYearTrans');
        const years = new Set();
        
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.date + 'T00:00:00');
            years.add(date.getFullYear());
        });
        
        const currentValue = yearFilter.value;
        
        yearFilter.innerHTML = '<option value="all">Todos os anos</option>';
        
        Array.from(years).sort().reverse().forEach(year => {
            const option = new Option(year, year);
            yearFilter.appendChild(option);
        });
        
        if (currentValue && Array.from(yearFilter.options).some(opt => opt.value === currentValue)) {
            yearFilter.value = currentValue;
        }
    }
    
    /**
     * Popula filtro de meses para transações
     */
    populateMonthFilterTrans() {
        const monthFilter = document.getElementById('filterMonthTrans');
        const yearFilter = document.getElementById('filterYearTrans');
        const selectedYear = yearFilter.value;
        const months = new Set();
        
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.date + 'T00:00:00');
            const year = date.getFullYear();
            
            if (selectedYear === 'all' || year == selectedYear) {
                const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                months.add(monthKey);
            }
        });
        
        const currentValue = monthFilter.value;
        
        monthFilter.innerHTML = '<option value="all">Todos os meses</option>';
        
        Array.from(months).sort().reverse().forEach(monthKey => {
            const [year, month] = monthKey.split('-');
            const date = new Date(year, month - 1);
            const monthName = date.toLocaleDateString('pt-BR', { 
                month: 'long'
            }).replace(/^\w/, c => c.toUpperCase());
            const option = new Option(monthName, monthKey);
            monthFilter.appendChild(option);
        });
        
        if (currentValue && Array.from(monthFilter.options).some(opt => opt.value === currentValue)) {
            monthFilter.value = currentValue;
        }
    }

    /**
     * Popula filtros do controle mensal
     */
    populateMonthlyFilters() {
        this.populateMonthlyYearFilter();
        this.populateMonthlyMonthFilter();
    }

    populateMonthlyYearFilter() {
        const yearFilter = document.getElementById('monthlyYearFilter');
        const years = new Set();
        
        // Adiciona anos das transações
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.date + 'T00:00:00');
            years.add(date.getFullYear());
        });
        
        // Adiciona anos dos orçamentos
        Object.keys(this.budgets).forEach(monthYear => {
            const year = parseInt(monthYear.split('-')[0]);
            years.add(year);
        });
        
        // Adiciona ano atual se não existir
        years.add(new Date().getFullYear());
        
        const currentValue = yearFilter.value;
        yearFilter.innerHTML = '<option value="all">Todos os anos</option>';
        
        Array.from(years).sort().reverse().forEach(year => {
            const option = new Option(year, year);
            yearFilter.appendChild(option);
        });
        
        // Restaura valor ou define ano atual
        if (currentValue && Array.from(yearFilter.options).some(opt => opt.value === currentValue)) {
            yearFilter.value = currentValue;
        } else {
            const currentYear = new Date().getFullYear();
            if (Array.from(yearFilter.options).some(opt => opt.value == currentYear)) {
                yearFilter.value = currentYear;
            }
        }
    }
    
    populateMonthlyMonthFilter() {
        const monthFilter = document.getElementById('monthlyMonthFilter');
        const yearFilter = document.getElementById('monthlyYearFilter');
        const selectedYear = yearFilter.value;
        const months = new Set();
        
        if (selectedYear === 'all') {
            // Se "todos os anos", mostra meses com transações ou orçamentos
            this.transactions.forEach(transaction => {
                const date = new Date(transaction.date + 'T00:00:00');
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                months.add(monthKey);
            });
            
            Object.keys(this.budgets).forEach(monthYear => {
                months.add(monthYear);
            });
        } else {
            // Se ano específico, mostra todos os 12 meses
            for (let month = 1; month <= 12; month++) {
                const monthKey = `${selectedYear}-${String(month).padStart(2, '0')}`;
                months.add(monthKey);
            }
        }
        
        const currentValue = monthFilter.value;
        monthFilter.innerHTML = '<option value="all">Todos os meses</option>';
        
        Array.from(months).sort().reverse().forEach(monthKey => {
            const [year, month] = monthKey.split('-');
            const date = new Date(year, month - 1);
            const monthName = date.toLocaleDateString('pt-BR', { 
                month: 'long',
                year: selectedYear === 'all' ? 'numeric' : undefined
            }).replace(/^\w/, c => c.toUpperCase());
            const option = new Option(monthName, monthKey);
            monthFilter.appendChild(option);
        });
        
        // Restaura valor ou define mês atual
        if (currentValue && Array.from(monthFilter.options).some(opt => opt.value === currentValue)) {
            monthFilter.value = currentValue;
        } else {
            const currentDate = new Date();
            const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            if (Array.from(monthFilter.options).some(opt => opt.value === currentMonthKey)) {
                monthFilter.value = currentMonthKey;
            }
        }
    }

    /**
     * Define orçamento mensal
     */
    setBudget() {
        const monthYear = document.getElementById('budgetMonth').value;
        const amount = parseFloat(document.getElementById('budgetAmount').value);
        
        this.budgets[monthYear] = amount;
        this.saveData();
        this.updateMonthlyControl();
        
        if (this.editingBudgetKey) {
            this.editingBudgetKey = null;
            document.querySelector('#budgetForm button[type="submit"]').textContent = 'Definir Meta';
            this.showNotification('Meta mensal editada com sucesso!');
        } else {
            this.showNotification('Meta mensal definida com sucesso!');
        }
        
        document.getElementById('budgetForm').reset();
        document.getElementById('budgetMonth').value = new Date().toISOString().slice(0, 7);
    }

    /**
     * Edita orçamento do mês atual
     */
    editCurrentBudget() {
        const monthFilter = document.getElementById('monthlyMonthFilter');
        if (!monthFilter) return;
        
        let monthKey = monthFilter.value;
        
        if (monthKey === 'all') {
            const currentDate = new Date();
            monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        }
        
        const currentBudget = this.budgets[monthKey] || 0;
        
        // Preenche o formulário
        document.getElementById('budgetMonth').value = monthKey;
        document.getElementById('budgetAmount').value = currentBudget;
        
        // Define modo de edição
        this.editingBudgetKey = monthKey;
        document.querySelector('#budgetForm button[type="submit"]').textContent = 'Salvar Meta';
        
        // Foca no campo de valor
        document.getElementById('budgetAmount').focus();
        
        this.showNotification('Meta carregada para edição!');
    }

    /**
     * Atualiza controle mensal
     */
    updateMonthlyControl() {
        const monthFilter = document.getElementById('monthlyMonthFilter');
        if (!monthFilter) return;
        
        const selectedMonth = monthFilter.value;
        let monthKey = selectedMonth;
        
        if (selectedMonth === 'all') {
            const currentDate = new Date();
            monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        }
        
        const budget = this.budgets[monthKey] || 0;
        const spent = this.getMonthlyExpenses(monthKey);
        const remaining = budget - spent;
        
        document.getElementById('monthlyBudget').textContent = this.formatCurrency(budget);
        document.getElementById('monthlySpent').textContent = this.formatCurrency(spent);
        document.getElementById('monthlyRemaining').textContent = this.formatCurrency(remaining);
        
        const remainingElement = document.getElementById('monthlyRemaining');
        remainingElement.style.color = remaining >= 0 ? '#10b981' : '#ef4444';
        
        // Controla visibilidade do botão de editar
        const editBtn = document.getElementById('editBudgetBtn');
        if (editBtn) {
            editBtn.style.display = budget > 0 ? 'inline-block' : 'none';
        }
    }

    /**
     * Obtém gastos do mês
     */
    getMonthlyExpenses(monthKey) {
        return this.transactions
            .filter(t => {
                if (t.type !== 'expense') return false;
                const date = new Date(t.date + 'T00:00:00');
                const transactionMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return transactionMonthKey === monthKey;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    /**
     * Atualiza taxa sugerida baseada no tipo de investimento
     */
    updateSuggestedRate() {
        const type = document.getElementById('investmentType').value;
        const rateInput = document.getElementById('interestRate');
        
        const suggestedRates = {
            'poupanca': 6.17,
            'cdb': 12.75,
            'tesouro': 10.75,
            'lci': 11.50,
            'lca': 11.50,
            'acoes': 15.00,
            'fundos': 12.00
        };
        
        if (suggestedRates[type]) {
            rateInput.value = suggestedRates[type];
        }
    }

    /**
     * Adiciona novo investimento
     */
    addInvestment() {
        const investment = {
            id: this.editingInvestmentId || Date.now(),
            name: document.getElementById('investmentName').value,
            type: document.getElementById('investmentType').value,
            initialAmount: parseFloat(document.getElementById('initialAmount').value),
            interestRate: parseFloat(document.getElementById('interestRate').value),
            investmentDate: document.getElementById('investmentDate').value,
            maturityDate: document.getElementById('maturityDate').value || null,
            timestamp: new Date().toISOString()
        };

        if (this.editingInvestmentId) {
            const index = this.investments.findIndex(i => i.id === this.editingInvestmentId);
            if (index !== -1) {
                this.investments[index] = investment;
            }
            this.editingInvestmentId = null;
            this.showNotification('Investimento editado com sucesso!');
        } else {
            this.investments.push(investment);
            this.showNotification('Investimento adicionado com sucesso!');
        }
        
        this.saveData();
        this.updateInvestmentSummary();
        this.renderInvestments();
        this.updateInvestmentCharts();
        
        document.getElementById('investmentForm').reset();
        document.getElementById('investmentDate').valueAsDate = new Date();
    }

    /**
     * Edita investimento
     */
    editInvestment(id) {
        const investment = this.investments.find(i => i.id === id);
        if (!investment) return;
        
        this.editingInvestmentId = id;
        
        document.getElementById('investmentName').value = investment.name;
        document.getElementById('investmentType').value = investment.type;
        document.getElementById('initialAmount').value = investment.initialAmount;
        document.getElementById('interestRate').value = investment.interestRate;
        document.getElementById('investmentDate').value = investment.investmentDate;
        document.getElementById('maturityDate').value = investment.maturityDate || '';
        
        document.querySelector('[data-tab="investments"]').click();
        document.getElementById('investmentName').focus();
        
        this.showNotification('Investimento carregado para edição!');
    }

    /**
     * Remove investimento
     */
    deleteInvestment(id) {
        if (confirm('Deseja realmente excluir este investimento?')) {
            this.investments = this.investments.filter(i => i.id !== id);
            this.saveData();
            this.updateInvestmentSummary();
            this.renderInvestments();
            this.updateInvestmentCharts();
            this.showNotification('Investimento removido com sucesso!');
        }
    }

    /**
     * Calcula rendimento atual do investimento
     */
    calculateCurrentYield(investment) {
        const startDate = new Date(investment.investmentDate);
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        const yearsDiff = daysDiff / 365.25;
        
        const currentValue = investment.initialAmount * Math.pow(1 + (investment.interestRate / 100), yearsDiff);
        return currentValue - investment.initialAmount;
    }

    /**
     * Atualiza resumo de investimentos
     */
    updateInvestmentSummary() {
        const totalInvested = this.investments.reduce((sum, inv) => sum + inv.initialAmount, 0);
        const totalYield = this.investments.reduce((sum, inv) => sum + this.calculateCurrentYield(inv), 0);
        const totalPatrimony = totalInvested + totalYield;
        
        document.getElementById('totalInvested').textContent = this.formatCurrency(totalInvested);
        document.getElementById('totalYield').textContent = this.formatCurrency(totalYield);
        document.getElementById('totalPatrimony').textContent = this.formatCurrency(totalPatrimony);
    }

    /**
     * Renderiza lista de investimentos
     */
    renderInvestments() {
        const container = document.getElementById('investmentsList');
        
        if (this.investments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Nenhum investimento cadastrado.</p>';
            return;
        }
        
        container.innerHTML = this.investments.map(investment => {
            const currentYield = this.calculateCurrentYield(investment);
            const currentValue = investment.initialAmount + currentYield;
            const typeNames = {
                'poupanca': 'Poupança',
                'cdb': 'CDB',
                'tesouro': 'Tesouro Direto',
                'lci': 'LCI',
                'lca': 'LCA',
                'acoes': 'Ações',
                'fundos': 'Fundos',
                'outros': 'Outros'
            };
            
            return `
                <div class="investment-item">
                    <div class="investment-info">
                        <div class="investment-name">${investment.name}</div>
                        <div class="investment-meta">
                            ${typeNames[investment.type]} • ${investment.interestRate}% a.a. • ${this.formatDate(investment.investmentDate)}
                        </div>
                    </div>
                    <div class="investment-value">
                        ${this.formatCurrency(currentValue)}
                    </div>
                    <div class="transaction-actions">
                        <button class="edit-btn" onclick="financialManager.editInvestment(${investment.id})">
                            Editar
                        </button>
                        <button class="delete-btn" onclick="financialManager.deleteInvestment(${investment.id})">
                            Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Adiciona nova transação ou salva edição
     */
    addTransaction() {
        const form = document.getElementById('transactionForm');
        
        const recurring = document.getElementById('recurring').value;
        console.log('Recurring value from form:', recurring); // Debug
        
        const transaction = {
            id: this.editingId || Date.now(),
            description: document.getElementById('description').value,
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            recurring: recurring,
            recurringGroupId: this.editingId ? this.getRecurringGroupId(this.editingId) : (recurring && recurring !== 'none' ? Date.now() : null),
            timestamp: new Date().toISOString()
        };
        
        console.log('Transaction object:', transaction); // Debug

        if (this.editingId) {
            // Editando transação existente
            const originalTransaction = this.transactions.find(t => t.id === this.editingId);
            console.log('Original transaction:', originalTransaction); // Debug
            
            // Verifica se é recorrente (tanto por recurringGroupId quanto por recurring diferente de 'none')
            const isRecurring = originalTransaction && (originalTransaction.recurringGroupId || 
                (originalTransaction.recurring && originalTransaction.recurring !== 'none'));
            
            if (isRecurring) {
                // É uma transação recorrente - edita todas automaticamente
                let groupId = originalTransaction.recurringGroupId;
                let baseDescription = originalTransaction.description.replace(' (Recorrente)', '');
                
                console.log('Editing all with groupId:', groupId, 'or description:', baseDescription); // Debug
                
                // Edita todas as transações do grupo recorrente
                let editedCount = 0;
                this.transactions.forEach((t, index) => {
                    const matchesGroup = groupId ? t.recurringGroupId === groupId : 
                        (t.description === baseDescription + ' (Recorrente)' || t.description === baseDescription);
                    
                    if (matchesGroup) {
                        // Mantém a data original de cada transação
                        const originalDate = t.date;
                        const originalId = t.id;
                        const isOriginalFirst = !t.description.includes('(Recorrente)');
                        
                        this.transactions[index] = { 
                            ...transaction, 
                            id: originalId, 
                            date: originalDate,
                            description: isOriginalFirst ? transaction.description : transaction.description + ' (Recorrente)'
                        };
                        editedCount++;
                    }
                });
                
                console.log('Edited', editedCount, 'transactions'); // Debug
                this.showNotification(`Todas as ${editedCount} transações recorrentes foram editadas!`);
            } else {
                // Transação normal
                const index = this.transactions.findIndex(t => t.id === this.editingId);
                if (index !== -1) {
                    this.transactions[index] = transaction;
                }
                this.showNotification('Transação editada com sucesso!');
            }
            
            this.editingId = null;
            document.querySelector('.btn-primary').textContent = 'Adicionar Transação';
        } else {
            // Nova transação
            console.log('Creating new transaction with recurring:', recurring); // Debug
            this.transactions.push(transaction);
            
            // Criar transações recorrentes se necessário
            if (recurring && recurring !== 'none') {
                console.log('Creating recurring transactions for:', transaction); // Debug
                this.createRecurringTransactions(transaction);
                this.showNotification(`Transação recorrente adicionada com sucesso! (${recurring})`);
            } else {
                this.showNotification('Transação adicionada com sucesso!');
            }
        }
        
        this.saveData();
        this.populateYearFilter();
        this.populateMonthFilter();
        this.populateYearFilterTrans();
        this.populateMonthFilterTrans();
        this.populateMonthlyFilters();
        this.updateDashboard();
        this.updateMonthlyControl();
        this.renderTransactions();
        this.updateCharts();
        this.updateMonthlyCharts();
        
        form.reset();
        document.getElementById('date').valueAsDate = new Date();
    }

    /**
     * Cria transações recorrentes
     */
    createRecurringTransactions(baseTransaction) {
        console.log('Creating recurring transactions for type:', baseTransaction.recurring); // Debug
        
        const startDate = new Date(baseTransaction.date + 'T00:00:00');
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        
        let createdCount = 0;
        
        for (let i = 1; i <= 12; i++) {
            let nextDate = new Date(startDate);
            
            switch (baseTransaction.recurring) {
                case 'monthly':
                    nextDate.setMonth(nextDate.getMonth() + i);
                    break;
                case 'weekly':
                    nextDate.setDate(nextDate.getDate() + (i * 7));
                    break;
                case 'yearly':
                    nextDate.setFullYear(nextDate.getFullYear() + i);
                    break;
                default:
                    console.log('Unknown recurring type:', baseTransaction.recurring);
                    return;
            }
            
            if (nextDate <= endDate) {
                const recurringTransaction = {
                    ...baseTransaction,
                    id: Date.now() + i + Math.random() * 1000, // Garante ID único
                    date: nextDate.toISOString().split('T')[0],
                    description: baseTransaction.description + ' (Recorrente)',
                    recurringGroupId: baseTransaction.recurringGroupId
                };
                
                console.log('Creating recurring transaction:', recurringTransaction); // Debug
                this.transactions.push(recurringTransaction);
                createdCount++;
            }
        }
        
        console.log('Created', createdCount, 'recurring transactions'); // Debug
    }

    /**
     * Obtém o ID do grupo recorrente de uma transação
     */
    getRecurringGroupId(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        return transaction ? transaction.recurringGroupId : null;
    }

    /**
     * Debug: Lista todas as transações e seus grupos
     */
    debugTransactions() {
        console.log('=== DEBUG TRANSACTIONS ===');
        this.transactions.forEach(t => {
            console.log(`ID: ${t.id}, Description: "${t.description}", GroupId: ${t.recurringGroupId}, Recurring: ${t.recurring}`);
        });
        console.log('=========================');
    }

    /**
     * Exporta dados para backup
     */
    exportData() {
        firebaseManager.exportData();
        this.showNotification('Dados exportados com sucesso!');
    }

    /**
     * Importa dados de backup
     */
    async importData(file) {
        if (!file) return;
        
        try {
            const data = await firebaseManager.importData(file);
            
            // Recarrega dados na interface
            await this.loadAllData();
            this.populateYearFilter();
            this.populateMonthFilter();
            this.populateYearFilterTrans();
            this.populateMonthFilterTrans();
            this.populateMonthlyFilters();
            this.loadCategories();
            this.updateDashboard();
            this.updateMonthlyControl();
            this.updateInvestmentSummary();
            this.renderTransactions();
            this.renderCategories();
            this.renderInvestments();
            this.updateCharts();
            this.updateMonthlyCharts();
            this.updateInvestmentCharts();
            
            this.showNotification('Dados importados com sucesso!');
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            this.showNotification('Erro ao importar dados!');
        }
    }

    /**
     * Força sincronização com Firebase
     */
    async syncData() {
        try {
            await firebaseManager.syncOfflineData();
            await this.loadAllData();
            this.updateConnectionStatus();
            this.showNotification('Dados sincronizados com sucesso!');
        } catch (error) {
            console.error('Erro na sincronização:', error);
            this.showNotification('Erro na sincronização!');
        }
    }

    /**
     * Atualiza status de conexão
     */
    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) {
            console.log('Elemento connectionStatus não encontrado');
            return;
        }
        
        console.log('=== STATUS UPDATE ===');
        console.log('Online:', firebaseManager.isOnline);
        console.log('UserId:', firebaseManager.userId);
        console.log('Firebase disabled:', FIREBASE_DISABLED);
        
        if (firebaseManager.isOnline && firebaseManager.userId) {
            statusElement.innerHTML = '🟢 Online - Sincronizado';
            statusElement.style.color = '#10b981';
            console.log('Status: Online - Sincronizado');
        } else if (firebaseManager.isOnline) {
            statusElement.innerHTML = '🟡 Online - Não autenticado';
            statusElement.style.color = '#f59e0b';
            console.log('Status: Online - Não autenticado');
        } else {
            statusElement.innerHTML = '🔴 Offline - Dados locais';
            statusElement.style.color = '#ef4444';
            console.log('Status: Offline - Dados locais');
        }
    }

    /**
     * Edita transação
     */
    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;
        
        // Define modo de edição
        this.editingId = id;
        
        // Preenche o formulário com os dados da transação
        document.getElementById('description').value = transaction.description.replace(' (Recorrente)', '');
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('type').value = transaction.type;
        document.getElementById('date').value = transaction.date;
        document.getElementById('recurring').value = transaction.recurring || 'none';
        
        // Atualiza categorias baseado no tipo
        this.updateCategoryOptions();
        document.getElementById('category').value = transaction.category;
        
        // Muda texto do botão
        document.querySelector('.btn-primary').textContent = 'Salvar Edição';
        
        // Muda para a aba de transações
        document.querySelector('[data-tab="transactions"]').click();
        
        // Foca no campo descrição
        document.getElementById('description').focus();
        
        this.showNotification('Transação carregada para edição!');
    }

    /**
     * Remove transação
     */
    deleteTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        console.log('Transaction to delete:', transaction); // Debug
        
        // Verifica se é recorrente por qualquer método
        const isRecurring = transaction && (transaction.recurringGroupId || 
            (transaction.recurring && transaction.recurring !== 'none') ||
            transaction.description.includes('(Recorrente)'));
        
        console.log('Is recurring:', isRecurring); // Debug
        
        if (isRecurring) {
            // É uma transação recorrente - confirma se quer excluir todas
            if (confirm('Esta é uma transação recorrente. Todas as ocorrências desta série serão excluídas. Confirma?')) {
                // Identifica o grupo
                let groupId = transaction.recurringGroupId;
                let baseDescription = transaction.description.replace(' (Recorrente)', '');
                
                console.log('GroupId:', groupId, 'BaseDescription:', baseDescription); // Debug
                
                // Lista todas as transações que serão removidas
                const toRemove = this.transactions.filter(t => {
                    const matchesGroup = groupId ? t.recurringGroupId === groupId : 
                        (t.description === baseDescription + ' (Recorrente)' || t.description === baseDescription);
                    return matchesGroup;
                });
                
                console.log('Transactions to remove:', toRemove); // Debug
                
                // Remove todas as transações do grupo recorrente
                const initialCount = this.transactions.length;
                this.transactions = this.transactions.filter(t => {
                    const matchesGroup = groupId ? t.recurringGroupId === groupId : 
                        (t.description === baseDescription + ' (Recorrente)' || t.description === baseDescription);
                    return !matchesGroup;
                });
                
                const removedCount = initialCount - this.transactions.length;
                console.log('Removed count:', removedCount); // Debug
                this.showNotification(`Todas as ${removedCount} transações recorrentes foram removidas!`);
            } else {
                return; // Cancelou a exclusão
            }
        } else {
            // Transação normal
            if (confirm('Deseja realmente excluir esta transação?')) {
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.showNotification('Transação removida com sucesso!');
            } else {
                return;
            }
        }
        
        this.saveData();
        this.populateYearFilter();
        this.populateMonthFilter();
        this.populateYearFilterTrans();
        this.populateMonthFilterTrans();
        this.populateMonthlyFilters();
        this.updateDashboard();
        this.updateMonthlyControl();
        this.renderTransactions();
        this.updateCharts();
        this.updateMonthlyCharts();
    }

    /**
     * Adiciona nova categoria
     */
    addCategory() {
        const form = document.getElementById('categoryForm');
        
        const category = {
            id: Date.now(),
            name: document.getElementById('categoryName').value,
            type: document.getElementById('categoryType').value,
            color: document.getElementById('categoryColor').value
        };

        this.categories.push(category);
        this.saveData();
        this.loadCategories();
        this.renderCategories();
        
        form.reset();
        document.getElementById('categoryColor').value = '#3498db';
        
        this.showNotification('Categoria adicionada com sucesso!');
    }

    /**
     * Remove categoria
     */
    deleteCategory(id) {
        if (confirm('Deseja realmente excluir esta categoria?')) {
            this.categories = this.categories.filter(c => c.id !== id);
            this.saveData();
            this.loadCategories();
            this.renderCategories();
            this.showNotification('Categoria removida com sucesso!');
        }
    }

    /**
     * Carrega categorias nos selects
     */
    loadCategories() {
        const categorySelect = document.getElementById('category');
        const filterCategorySelect = document.getElementById('filterCategory');
        
        // Limpa opções existentes (exceto primeira)
        categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
        filterCategorySelect.innerHTML = '<option value="">Todas as categorias</option>';
        
        this.categories.forEach(category => {
            const option1 = new Option(category.name, category.id);
            const option2 = new Option(category.name, category.id);
            
            categorySelect.appendChild(option1);
            filterCategorySelect.appendChild(option2);
        });
        
        this.updateCategoryOptions();
    }

    /**
     * Atualiza opções de categoria baseado no tipo selecionado
     */
    updateCategoryOptions() {
        const type = document.getElementById('type').value;
        const categorySelect = document.getElementById('category');
        
        Array.from(categorySelect.options).forEach(option => {
            if (option.value === '') return;
            
            const category = this.categories.find(c => c.id == option.value);
            option.style.display = category && category.type === type ? 'block' : 'none';
        });
        
        categorySelect.value = '';
    }

    /**
     * Atualiza dashboard com totais
     */
    updateDashboard() {
        const totals = this.calculateTotals();
        
        document.getElementById('totalBalance').textContent = this.formatCurrency(totals.balance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(totals.income);
        document.getElementById('totalExpense').textContent = this.formatCurrency(totals.expense);
    }

    /**
     * Calcula totais financeiros
     */
    calculateTotals() {
        const monthFilter = document.getElementById('monthFilter');
        const yearFilter = document.getElementById('yearFilter');
        if (!monthFilter || !yearFilter) return { income: 0, expense: 0, balance: 0 };
        
        const selectedMonth = monthFilter.value;
        const selectedYear = yearFilter.value;
        let filteredTransactions = this.transactions;
        
        // Filtra por ano
        if (selectedYear !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction => {
                const date = new Date(transaction.date + 'T00:00:00');
                return date.getFullYear() == selectedYear;
            });
        }
        
        // Filtra por mês
        if (selectedMonth !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction => {
                const date = new Date(transaction.date + 'T00:00:00');
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return monthKey === selectedMonth;
            });
        }
        
        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        return {
            income,
            expense,
            balance: income - expense
        };
    }

    /**
     * Renderiza lista de transações
     */
    renderTransactions() {
        const container = document.getElementById('transactionsList');
        const typeFilter = document.getElementById('filterType').value;
        const categoryFilter = document.getElementById('filterCategory').value;
        const yearFilter = document.getElementById('filterYearTrans').value;
        const monthFilter = document.getElementById('filterMonthTrans').value;
        
        let filteredTransactions = this.transactions;
        
        // Filtra por ano
        if (yearFilter && yearFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction => {
                const date = new Date(transaction.date + 'T00:00:00');
                return date.getFullYear() == yearFilter;
            });
        }
        
        // Filtra por mês
        if (monthFilter && monthFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction => {
                const date = new Date(transaction.date + 'T00:00:00');
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return monthKey === monthFilter;
            });
        }
        
        if (typeFilter) {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }
        
        if (categoryFilter) {
            filteredTransactions = filteredTransactions.filter(t => t.category == categoryFilter);
        }
        
        // Ordena por data (mais recente primeiro)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = filteredTransactions.map(transaction => {
            const category = this.categories.find(c => c.id == transaction.category);
            const categoryName = category ? category.name : 'Sem categoria';
            
            // Verifica se é recorrente por qualquer método
            const isRecurring = transaction.recurringGroupId || 
                (transaction.recurring && transaction.recurring !== 'none') ||
                transaction.description.includes('(Recorrente)');
            const recurringIcon = isRecurring ? ' 🔁' : '';
            
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-description">${transaction.description}${recurringIcon}</div>
                        <div class="transaction-meta">
                            ${categoryName} • ${this.formatDate(transaction.date)}${isRecurring ? ' • Recorrente' : ''}
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'} ${this.formatCurrency(transaction.amount)}
                    </div>
                    <div class="transaction-actions">
                        <button class="edit-btn" onclick="financialManager.editTransaction(${transaction.id})">
                            Editar
                        </button>
                        <button class="delete-btn" onclick="financialManager.deleteTransaction(${transaction.id})">
                            Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        if (filteredTransactions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Nenhuma transação encontrada.</p>';
        }
    }

    /**
     * Renderiza lista de categorias
     */
    renderCategories() {
        const container = document.getElementById('categoriesList');
        
        container.innerHTML = this.categories.map(category => `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    <div>
                        <div class="category-name">${category.name}</div>
                        <div class="category-type">${category.type === 'income' ? 'Receita' : 'Despesa'}</div>
                    </div>
                </div>
                <button class="delete-btn" onclick="financialManager.deleteCategory(${category.id})">
                    Excluir
                </button>
            </div>
        `).join('');
    }

    /**
     * Inicializa gráficos
     */
    initCharts() {
        this.initCashFlowChart();
        this.initCategoryChart();
        this.initMonthlyCharts();
        this.initInvestmentCharts();
    }

    /**
     * Inicializa gráfico de fluxo de caixa (pizza)
     */
    initCashFlowChart() {
        const ctx = document.getElementById('cashFlowChart').getContext('2d');
        
        this.charts.cashFlow = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Receitas', 'Despesas'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#0f0f23'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            color: '#e2e8f0',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return context.label + ': R$ ' + value.toLocaleString('pt-BR') + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Inicializa gráfico de categorias
     */
    initCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 2,
                    borderColor: '#0f0f23'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            color: '#e2e8f0',
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': R$ ' + context.parsed.toLocaleString('pt-BR');
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Atualiza dados dos gráficos
     */
    updateCharts() {
        this.updateCashFlowChart();
        this.updateCategoryChart();
    }

    /**
     * Atualiza gráficos mensais
     */
    updateMonthlyCharts() {
        if (this.charts.monthlyExpense) {
            this.updateMonthlyExpenseChart();
        }
        if (this.charts.monthlyComparison) {
            this.updateMonthlyComparisonChart();
        }
    }

    /**
     * Atualiza gráficos de investimentos
     */
    updateInvestmentCharts() {
        if (this.charts.investmentType) {
            this.updateInvestmentTypeChart();
        }
        if (this.charts.patrimonyEvolution) {
            this.updatePatrimonyEvolutionChart();
        }
    }

    /**
     * Atualiza gráfico de fluxo de caixa (pizza)
     */
    updateCashFlowChart() {
        const totals = this.calculateTotals();
        
        this.charts.cashFlow.data.datasets[0].data = [totals.income, totals.expense];
        this.charts.cashFlow.update();
    }

    /**
     * Atualiza gráfico de categorias
     */
    updateCategoryChart() {
        const categoryData = this.getCategoryData();
        
        this.charts.category.data.labels = categoryData.labels;
        this.charts.category.data.datasets[0].data = categoryData.values;
        this.charts.category.data.datasets[0].backgroundColor = categoryData.colors;
        this.charts.category.update();
    }

    /**
     * Obtém dados de categorias para gráfico
     */
    getCategoryData() {
        const monthFilter = document.getElementById('monthFilter');
        const selectedMonth = monthFilter ? monthFilter.value : 'all';
        
        let filteredTransactions = this.transactions.filter(t => t.type === 'expense');
        
        if (selectedMonth !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction => {
                const date = new Date(transaction.date + 'T00:00:00');
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return monthKey === selectedMonth;
            });
        }
        
        const categoryTotals = {};
        
        filteredTransactions.forEach(transaction => {
            const category = this.categories.find(c => c.id == transaction.category);
            if (category) {
                if (!categoryTotals[category.id]) {
                    categoryTotals[category.id] = {
                        name: category.name,
                        total: 0,
                        color: category.color
                    };
                }
                categoryTotals[category.id].total += transaction.amount;
            }
        });
        
        const sortedCategories = Object.values(categoryTotals)
            .filter(c => c.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
        
        if (sortedCategories.length === 0) {
            return {
                labels: ['Nenhuma despesa'],
                values: [1],
                colors: ['#64748b']
            };
        }
        
        return {
            labels: sortedCategories.map(c => c.name),
            values: sortedCategories.map(c => c.total),
            colors: sortedCategories.map(c => c.color)
        };
    }

    /**
     * Inicializa gráficos mensais
     */
    initMonthlyCharts() {
        this.initMonthlyExpenseChart();
        this.initMonthlyComparisonChart();
    }

    initMonthlyExpenseChart() {
        const ctx = document.getElementById('monthlyExpenseChart')?.getContext('2d');
        if (!ctx) return;
        
        this.charts.monthlyExpense = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 2,
                    borderColor: '#0f0f23'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            color: '#e2e8f0',
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    initMonthlyComparisonChart() {
        const ctx = document.getElementById('monthlyComparisonChart')?.getContext('2d');
        if (!ctx) return;
        
        this.charts.monthlyComparison = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Gastos',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Meta',
                    data: [],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e2e8f0',
                            font: { size: 10 }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        });
    }

    /**
     * Inicializa gráficos de investimentos
     */
    initInvestmentCharts() {
        this.initInvestmentTypeChart();
        this.initPatrimonyEvolutionChart();
    }

    initInvestmentTypeChart() {
        const ctx = document.getElementById('investmentTypeChart')?.getContext('2d');
        if (!ctx) return;
        
        this.charts.investmentType = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'],
                    borderWidth: 2,
                    borderColor: '#0f0f23'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            color: '#e2e8f0',
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    initPatrimonyEvolutionChart() {
        const ctx = document.getElementById('patrimonyEvolutionChart')?.getContext('2d');
        if (!ctx) return;
        
        this.charts.patrimonyEvolution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Patrimônio',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e2e8f0',
                            font: { size: 10 }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        });
    }

    /**
     * Atualiza gráfico de gastos mensais
     */
    updateMonthlyExpenseChart() {
        const monthFilter = document.getElementById('monthlyMonthFilter');
        if (!monthFilter) return;
        
        const selectedMonth = monthFilter.value;
        let monthKey = selectedMonth;
        
        if (selectedMonth === 'all') {
            const currentDate = new Date();
            monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        }
        
        const categoryData = this.getMonthlyExpensesByCategory(monthKey);
        
        this.charts.monthlyExpense.data.labels = categoryData.labels;
        this.charts.monthlyExpense.data.datasets[0].data = categoryData.values;
        this.charts.monthlyExpense.data.datasets[0].backgroundColor = categoryData.colors;
        this.charts.monthlyExpense.update();
    }

    /**
     * Atualiza gráfico de comparação mensal
     */
    updateMonthlyComparisonChart() {
        const last6Months = this.getLast6MonthsData();
        
        this.charts.monthlyComparison.data.labels = last6Months.labels;
        this.charts.monthlyComparison.data.datasets[0].data = last6Months.expenses;
        this.charts.monthlyComparison.data.datasets[1].data = last6Months.budgets;
        this.charts.monthlyComparison.update();
    }

    /**
     * Atualiza gráfico de tipos de investimento
     */
    updateInvestmentTypeChart() {
        const typeData = this.getInvestmentTypeData();
        
        this.charts.investmentType.data.labels = typeData.labels;
        this.charts.investmentType.data.datasets[0].data = typeData.values;
        this.charts.investmentType.update();
    }

    /**
     * Atualiza gráfico de evolução do patrimônio
     */
    updatePatrimonyEvolutionChart() {
        const evolutionData = this.getPatrimonyEvolutionData();
        
        this.charts.patrimonyEvolution.data.labels = evolutionData.labels;
        this.charts.patrimonyEvolution.data.datasets[0].data = evolutionData.values;
        this.charts.patrimonyEvolution.update();
    }

    /**
     * Obtém dados de gastos por categoria do mês
     */
    getMonthlyExpensesByCategory(monthKey) {
        const filteredTransactions = this.transactions.filter(t => {
            if (t.type !== 'expense') return false;
            const date = new Date(t.date + 'T00:00:00');
            const transactionMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return transactionMonthKey === monthKey;
        });
        
        const categoryTotals = {};
        
        filteredTransactions.forEach(transaction => {
            const category = this.categories.find(c => c.id == transaction.category);
            if (category) {
                if (!categoryTotals[category.id]) {
                    categoryTotals[category.id] = {
                        name: category.name,
                        total: 0,
                        color: category.color
                    };
                }
                categoryTotals[category.id].total += transaction.amount;
            }
        });
        
        const sortedCategories = Object.values(categoryTotals)
            .filter(c => c.total > 0)
            .sort((a, b) => b.total - a.total);
        
        if (sortedCategories.length === 0) {
            return {
                labels: ['Nenhuma despesa'],
                values: [1],
                colors: ['#64748b']
            };
        }
        
        return {
            labels: sortedCategories.map(c => c.name),
            values: sortedCategories.map(c => c.total),
            colors: sortedCategories.map(c => c.color)
        };
    }

    /**
     * Obtém dados dos últimos 6 meses
     */
    getLast6MonthsData() {
        const months = [];
        const expenses = [];
        const budgets = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
            
            months.push(monthName);
            expenses.push(this.getMonthlyExpenses(monthKey));
            budgets.push(this.budgets[monthKey] || 0);
        }
        
        return { labels: months, expenses, budgets };
    }

    /**
     * Obtém dados de tipos de investimento
     */
    getInvestmentTypeData() {
        const typeNames = {
            'poupanca': 'Poupança',
            'cdb': 'CDB',
            'tesouro': 'Tesouro Direto',
            'lci': 'LCI',
            'lca': 'LCA',
            'acoes': 'Ações',
            'fundos': 'Fundos',
            'outros': 'Outros'
        };
        
        const typeTotals = {};
        
        this.investments.forEach(investment => {
            const currentValue = investment.initialAmount + this.calculateCurrentYield(investment);
            if (!typeTotals[investment.type]) {
                typeTotals[investment.type] = 0;
            }
            typeTotals[investment.type] += currentValue;
        });
        
        const labels = Object.keys(typeTotals).map(type => typeNames[type] || type);
        const values = Object.values(typeTotals);
        
        return { labels, values };
    }

    /**
     * Obtém dados de evolução do patrimônio
     */
    getPatrimonyEvolutionData() {
        const months = [];
        const values = [];
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            
            let totalValue = 0;
            this.investments.forEach(investment => {
                const investmentDate = new Date(investment.investmentDate);
                if (investmentDate <= date) {
                    const daysDiff = Math.floor((date - investmentDate) / (1000 * 60 * 60 * 24));
                    const yearsDiff = daysDiff / 365.25;
                    const currentValue = investment.initialAmount * Math.pow(1 + (investment.interestRate / 100), yearsDiff);
                    totalValue += currentValue;
                }
            });
            
            months.push(monthName);
            values.push(totalValue);
        }
        
        return { labels: months, values };
    }

    /**
     * Salva dados no Firebase e localStorage
     */
    async saveData() {
        try {
            // Salva no Firebase (que também salva localmente como backup)
            await Promise.all([
                firebaseManager.saveToFirebase('transactions', this.transactions),
                firebaseManager.saveToFirebase('categories', this.categories),
                firebaseManager.saveToFirebase('budgets', this.budgets),
                firebaseManager.saveToFirebase('investments', this.investments)
            ]);
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            // Fallback para localStorage
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
            localStorage.setItem('categories', JSON.stringify(this.categories));
            localStorage.setItem('budgets', JSON.stringify(this.budgets));
            localStorage.setItem('investments', JSON.stringify(this.investments));
        }
    }

    /**
     * Formata valor como moeda
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    /**
     * Formata data
     */
    formatDate(dateString) {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
    }

    /**
     * Exibe notificação
     */
    showNotification(message) {
        // Cria elemento de notificação
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        // Adiciona animação CSS
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove após 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Registra service worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('SW registrado com sucesso:', registration.scope);
            })
            .catch(registrationError => {
                console.log('Falha ao registrar SW:', registrationError);
            });
    });
}

// Inicializa o sistema quando a página carrega
let financialManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando FinancialManager...');
    financialManager = new FinancialManager();
    console.log('🚀 FinancialManager criado:', financialManager);
});