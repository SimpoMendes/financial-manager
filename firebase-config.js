/**
 * Configuração do Firebase
 */

// Configuração do Firebase - SUBSTITUA PELAS SUAS CREDENCIAIS
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "sua-app-id"
};

// IMPORTANTE: Antes de usar, substitua pelas suas configurações do Firebase Console

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Referências dos serviços
const db = firebase.firestore();
const auth = firebase.auth();

// Firebase ativado
const FIREBASE_DISABLED = false;

// Classe para gerenciar dados no Firebase
class FirebaseManager {
  constructor() {
    this.userId = null;
    this.isOnline = navigator.onLine;
    this.setupOnlineListener();
  }

  /**
   * Monitora status de conexão
   */
  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Autentica usuário anonimamente
   */
  async authenticateUser() {
    console.log('=== INICIANDO AUTENTICAÇÃO ===');
    console.log('Firebase disabled:', FIREBASE_DISABLED);
    console.log('Firebase object:', typeof firebase);
    
    if (FIREBASE_DISABLED) {
      // Gera um ID local único
      this.userId = localStorage.getItem('localUserId') || 'local-' + Date.now();
      localStorage.setItem('localUserId', this.userId);
      console.log('Modo local ativado:', this.userId);
      return this.userId;
    }
    
    try {
      console.log('Tentando autenticação anônima...');
      const result = await auth.signInAnonymously();
      this.userId = result.user.uid;
      console.log('✅ Usuário autenticado:', this.userId);
      return this.userId;
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return null;
    }
  }

  /**
   * Salva dados no Firebase
   */
  async saveToFirebase(collection, data) {
    if (FIREBASE_DISABLED || !this.userId || !this.isOnline) {
      return this.saveToLocal(collection, data);
    }

    try {
      await db.collection('users').doc(this.userId).collection(collection).doc('data').set({
        data: data,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Também salva localmente como backup
      this.saveToLocal(collection, data);
      return true;
    } catch (error) {
      console.error('Erro ao salvar no Firebase:', error);
      return this.saveToLocal(collection, data);
    }
  }

  /**
   * Carrega dados do Firebase
   */
  async loadFromFirebase(collection) {
    if (FIREBASE_DISABLED || !this.userId || !this.isOnline) {
      return this.loadFromLocal(collection);
    }

    try {
      const doc = await db.collection('users').doc(this.userId).collection(collection).doc('data').get();
      
      if (doc.exists) {
        const firebaseData = doc.data().data;
        // Salva localmente como backup
        this.saveToLocal(collection, firebaseData);
        return firebaseData;
      } else {
        // Se não existe no Firebase, tenta carregar do local
        return this.loadFromLocal(collection);
      }
    } catch (error) {
      console.error('Erro ao carregar do Firebase:', error);
      return this.loadFromLocal(collection);
    }
  }

  /**
   * Salva dados localmente
   */
  saveToLocal(collection, data) {
    try {
      localStorage.setItem(collection, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erro ao salvar localmente:', error);
      return false;
    }
  }

  /**
   * Carrega dados localmente
   */
  loadFromLocal(collection) {
    try {
      const data = localStorage.getItem(collection);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao carregar localmente:', error);
      return null;
    }
  }

  /**
   * Sincroniza dados offline quando volta online
   */
  async syncOfflineData() {
    if (!this.userId || !this.isOnline) return;

    const collections = ['transactions', 'categories', 'budgets', 'investments'];
    
    for (const collection of collections) {
      const localData = this.loadFromLocal(collection);
      if (localData) {
        await this.saveToFirebase(collection, localData);
      }
    }
    
    console.log('Dados sincronizados com Firebase');
  }

  /**
   * Exporta dados para backup
   */
  exportData() {
    const data = {
      transactions: this.loadFromLocal('transactions') || [],
      categories: this.loadFromLocal('categories') || [],
      budgets: this.loadFromLocal('budgets') || {},
      investments: this.loadFromLocal('investments') || [],
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestor-financeiro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Importa dados de backup
   */
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          if (data.transactions) await this.saveToFirebase('transactions', data.transactions);
          if (data.categories) await this.saveToFirebase('categories', data.categories);
          if (data.budgets) await this.saveToFirebase('budgets', data.budgets);
          if (data.investments) await this.saveToFirebase('investments', data.investments);
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }
}

// Instância global do Firebase Manager
console.log('🔥 Criando FirebaseManager...');
const firebaseManager = new FirebaseManager();
console.log('🔥 FirebaseManager criado:', firebaseManager);