/**
 * Configuração do Firebase para Executável (Electron)
 * Esta versão usa suas credenciais reais para o executável
 */

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDV2HHOVnYOqJJgubbByYLkUphWOWP_TjM",
  authDomain: "sim-finance.firebaseapp.com",
  projectId: "sim-finance",
  storageBucket: "sim-finance.firebasestorage.app",
  messagingSenderId: "958885685156",
  appId: "1:958885685156:web:ccf18c33e78ee864484331"
};

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

  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async authenticateUser() {
    console.log('=== INICIANDO AUTENTICAÇÃO (ELECTRON) ===');
    
    try {
      const result = await auth.signInAnonymously();
      this.userId = result.user.uid;
      console.log('✅ Usuário autenticado:', this.userId);
      return this.userId;
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      return null;
    }
  }

  async saveToFirebase(collection, data) {
    if (!this.userId || !this.isOnline) {
      return this.saveToLocal(collection, data);
    }

    try {
      await db.collection('users').doc(this.userId).collection(collection).doc('data').set({
        data: data,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      this.saveToLocal(collection, data);
      return true;
    } catch (error) {
      console.error('Erro ao salvar no Firebase:', error);
      return this.saveToLocal(collection, data);
    }
  }

  async loadFromFirebase(collection) {
    if (!this.userId || !this.isOnline) {
      return this.loadFromLocal(collection);
    }

    try {
      const doc = await db.collection('users').doc(this.userId).collection(collection).doc('data').get();
      
      if (doc.exists) {
        const firebaseData = doc.data().data;
        this.saveToLocal(collection, firebaseData);
        return firebaseData;
      } else {
        return this.loadFromLocal(collection);
      }
    } catch (error) {
      console.error('Erro ao carregar do Firebase:', error);
      return this.loadFromLocal(collection);
    }
  }

  saveToLocal(collection, data) {
    try {
      localStorage.setItem(collection, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erro ao salvar localmente:', error);
      return false;
    }
  }

  loadFromLocal(collection) {
    try {
      const data = localStorage.getItem(collection);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao carregar localmente:', error);
      return null;
    }
  }

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
console.log('🔥 Criando FirebaseManager (Electron)...');
const firebaseManager = new FirebaseManager();
console.log('🔥 FirebaseManager criado:', firebaseManager);