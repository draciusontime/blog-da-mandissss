# Blog da Mandis 🌟

Um blog pessoal construído com Node.js, Express e MongoDB.

## 🚀 Como usar localmente

### Pré-requisitos
- Node.js instalado
- MongoDB rodando localmente OU uma string de conexão do MongoDB Atlas

### Instalação
1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env`
   - Ajuste as configurações conforme necessário

4. Execute a aplicação:
```bash
npm start
```

## 🌐 Deploy na Railway

### 1. Configurar MongoDB Atlas (Recomendado)
1. Acesse [MongoDB Atlas](https://www.mongodb.com/atlas) e crie uma conta gratuita
2. Crie um cluster gratuito (tier M0)
3. Obtenha a string de conexão: `mongodb+srv://usuario:senha@cluster.mongodb.net/blog`

### 2. Deploy na Railway
1. **Faça push do código para GitHub**
2. **Conecte o repositório à Railway** 
3. **Configure as variáveis de ambiente:**
   ```
   MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/blog
   SESSION_SECRET=um-secret-muito-seguro-aqui
   NODE_ENV=production
   ```
4. **Deploy automático!** 🚀

> **Dica:** A Railway detecta automaticamente o comando `npm start` do package.json

## 🔧 Funcionalidades

- ✅ **Sistema de login** (usuário: `mandis`)
- ✅ **Criar posts** com títulos, conteúdo e arquivos
- ✅ **Upload de imagens e PDFs**
- ✅ **Sistema de comentários**
- ✅ **Editar e excluir posts**
- ✅ **Excluir comentários** (apenas admin)
- ✅ **Design responsivo**

## 🗂️ Estrutura do banco de dados

### Posts
```javascript
{
  title: String,        // Título do post
  content: String,      // Conteúdo do post
  fileUrl: String,      // URL do arquivo (opcional)
  comments: [{          // Array de comentários
    text: String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Users
```javascript
{
  username: String,     // Nome do usuário
  passwordHash: String, // Senha hasheada
  createdAt: Date
}
```

## 🔒 Credenciais padrão
- **Usuário:** `mandis`
- **Senha:** `020407`

## 🛠️ Tecnologias utilizadas
- **Backend:** Node.js + Express
- **Banco de dados:** MongoDB + Mongoose
- **Template engine:** EJS
- **Upload de arquivos:** Multer
- **Autenticação:** express-session + bcrypt
- **Deploy:** Railway

## 📝 Notas importantes
- O usuário padrão é criado automaticamente na primeira execução
- Os uploads são salvos na pasta `uploads/`
- A aplicação é otimizada para deploy na Railway
- Suporte a MongoDB Atlas e instâncias locais

---

**Feito com ❤️ para a Mandis** 🌸