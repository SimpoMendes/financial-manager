/**
 * Sistema de Gestão Financeira
 * Gerencia transações, categorias e gráficos de fluxo de caixa
 */

class FinancialManager {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || this.getDefaultCategories();
        this.charts = {};
        this.editingId = null;
        
        this.init();
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
        this.updateDashboard();
        this.renderTransactions();
        this.renderCategories();
        this.initCharts();
        
        // Define data atual como padrão
        document.getElementById('date').valueAsDate = new Date();
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
     * Adiciona nova transação ou salva edição
     */
    addTransaction() {
        const form = document.getElementById('transactionForm');
        const formData = new FormData(form);
        
        const recurring = document.getElementById('recurring').value;
        
        const transaction = {
            id: this.editingId || Date.now(),
            description: formData.get('description') || document.getElementById('description').value,
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            recurring: recurring,
            timestamp: new Date().toISOString()
        };

        if (this.editingId) {
            // Editando transação existente
            const index = this.transactions.findIndex(t => t.id === this.editingId);
            if (index !== -1) {
                this.transactions[index] = transaction;
            }
            this.editingId = null;
            document.querySelector('.btn-primary').textContent = 'Adicionar Transação';
            this.showNotification('Transação editada com sucesso!');
        } else {
            // Nova transação
            this.transactions.push(transaction);
            
            // Criar transações recorrentes se necessário
            if (recurring !== 'none') {
                this.createRecurringTransactions(transaction);
            }
            this.showNotification('Transação adicionada com sucesso!');
        }
        
        this.saveData();
        this.populateYearFilter();
        this.populateMonthFilter();
        this.populateYearFilterTrans();
        this.populateMonthFilterTrans();
        this.updateDashboard();
        this.renderTransactions();
        this.updateCharts();
        
        form.reset();
        document.getElementById('date').valueAsDate = new Date();
    }

    /**
     * Cria transações recorrentes
     */
    createRecurringTransactions(baseTransaction) {
        const startDate = new Date(baseTransaction.date);
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        
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
            }
            
            if (nextDate <= endDate) {
                const recurringTransaction = {
                    ...baseTransaction,
                    id: Date.now() + i,
                    date: nextDate.toISOString().split('T')[0],
                    description: baseTransaction.description + ' (Recorrente)'
                };
                
                this.transactions.push(recurringTransaction);
            }
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
        if (confirm('Deseja realmente excluir esta transação?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveData();
            this.populateYearFilter();
            this.populateMonthFilter();
            this.populateYearFilterTrans();
            this.populateMonthFilterTrans();
            this.updateDashboard();
            this.renderTransactions();
            this.updateCharts();
            this.showNotification('Transação removida com sucesso!');
        }
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
            
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-meta">
                            ${categoryName} • ${this.formatDate(transaction.date)}
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
     * Salva dados no localStorage
     */
    saveData() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        localStorage.setItem('categories', JSON.stringify(this.categories));
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
    financialManager = new FinancialManager();
});