# 🔥 Configuração do Firebase

## 📋 Pré-requisitos
1. Conta no Google/Firebase
2. Node.js instalado (para criar executável)

## 🚀 Configuração do Firebase

### 1. Criar Projeto no Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nome do projeto: `gestor-financeiro` (ou outro nome)
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

### 2. Configurar Firestore Database
1. No painel do Firebase, vá em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Iniciar no modo de teste" (por enquanto)
4. Escolha a localização (preferencialmente `southamerica-east1`)

### 3. Configurar Authentication
1. Vá em "Authentication" → "Sign-in method"
2. Habilite "Anônimo" (para não precisar de login)
3. Salve as configurações

### 4. Obter Configurações do Projeto
1. Vá em "Configurações do projeto" (ícone de engrenagem)
2. Role até "Seus aplicativos"
3. Clique em "Adicionar app" → ícone da web `</>`
4. Nome do app: `Gestor Financeiro`
5. **NÃO** marque "Firebase Hosting"
6. Clique em "Registrar app"
7. **COPIE** as configurações que aparecem

### 5. Configurar o Projeto
1. Abra o arquivo `firebase-config.js`
2. Substitua as configurações:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "sua-app-id"
};
```

### 6. Configurar Regras de Segurança
1. Vá em "Firestore Database" → "Regras"
2. Substitua por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite acesso apenas aos dados do próprio usuário
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Clique em "Publicar"

## 📱 Criando Executáveis

### 1. Instalar Dependências
```bash
# No terminal, dentro da pasta do projeto:
npm install
```

### 2. Executar em Modo Desenvolvimento
```bash
npm start
```

### 3. Criar Executáveis

#### Windows:
```bash
npm run build-win
```

#### macOS:
```bash
npm run build-mac
```

#### Linux:
```bash
npm run build-linux
```

#### Todos os Sistemas:
```bash
npm run dist
```

### 4. Localizar Executáveis
Os arquivos serão criados na pasta `dist/`:
- **Windows**: `Gestor Financeiro Setup.exe`
- **macOS**: `Gestor Financeiro.dmg`
- **Linux**: `Gestor Financeiro.AppImage`

## 📱 PWA (Progressive Web App)

O projeto já está configurado como PWA e pode ser:

### 1. Instalado no Celular
1. Abra no navegador do celular
2. Menu → "Adicionar à tela inicial"
3. Funciona offline!

### 2. Instalado no Desktop
1. Abra no Chrome/Edge
2. Barra de endereço → ícone de instalação
3. Clique em "Instalar"

## 🔄 Funcionalidades do Firebase

### ✅ Implementadas:
- **Sincronização automática** entre dispositivos
- **Backup offline** (funciona sem internet)
- **Exportar/Importar** dados
- **Autenticação anônima** (sem necessidade de login)
- **Sincronização manual** (botão Sincronizar)

### 🎯 Como Funciona:
1. **Online**: Salva no Firebase + localStorage
2. **Offline**: Salva apenas no localStorage
3. **Volta online**: Sincroniza automaticamente
4. **Multi-dispositivo**: Dados compartilhados entre dispositivos

## 🛠️ Atualizações Futuras

### Sistema de Atualizações Automáticas:
- **Desktop**: Electron auto-updater
- **Web/PWA**: Service Worker atualiza automaticamente
- **Notificações**: Usuário é informado sobre atualizações

### Para Publicar Atualizações:
1. Altere a versão no `package.json`
2. Gere novos executáveis
3. Publique no GitHub Releases
4. Usuários recebem atualização automaticamente

## 🔒 Segurança

### Dados Protegidos:
- **Firebase**: Regras de segurança por usuário
- **Local**: Dados criptografados no localStorage
- **Backup**: Arquivos JSON podem ser criptografados

### Privacidade:
- **Sem login**: Autenticação anônima
- **Dados locais**: Funcionam 100% offline
- **Controle total**: Usuário pode exportar/deletar tudo

## 📞 Suporte

### Problemas Comuns:
1. **Erro de conexão**: Verifique configurações do Firebase
2. **Não sincroniza**: Verifique regras de segurança
3. **Executável não abre**: Instale Visual C++ Redistributable (Windows)

### Logs de Debug:
- Abra F12 → Console para ver logs detalhados
- Erros do Firebase aparecem no console