# Blog System com MongoDB

Um sistema de blog simples construído com Node.js, Express e MongoDB.

## 🚀 Configuração do MongoDB

### Opção 1: MongoDB Atlas (Recomendado para produção)

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um novo cluster
4. Configure o usuário e senha do banco de dados
5. Adicione seu IP à lista de IPs permitidos (ou use 0.0.0.0/0 para permitir qualquer IP)
6. Obtenha a string de conexão que será algo como:
   ```
   mongodb+srv://usuario:senha@cluster.mongodb.net/blog-database?retryWrites=true&w=majority
   ```

### Opção 2: MongoDB Local (Para desenvolvimento)

1. Instale o MongoDB Community Server
2. Use a string de conexão local:
   ```
   mongodb://localhost:27017/blog-database
   ```

## 📋 Configuração do Projeto

1. **Clone o repositório e instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   
   Edite o arquivo `.env` e configure suas credenciais:
   ```env
   # Substitua pela sua string de conexão do MongoDB
   MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/blog-database?retryWrites=true&w=majority
   
   # Mantenha o resto como está ou personalize
   SESSION_SECRET=segredo-super-seguro
   PORT=3000
   ADMIN_USERNAME=mandis
   ADMIN_PASSWORD=020407
   ```

3. **Execute o projeto:**
   ```bash
   npm start
   ```

## 🔧 Deploy na Railway

1. **Prepare o projeto:**
   - Certifique-se de que o arquivo `.env` está no `.gitignore`
   - O projeto já está configurado com `process.env.PORT`

2. **Configure as variáveis de ambiente na Railway:**
   - `MONGODB_URI`: sua string de conexão do MongoDB Atlas
   - `SESSION_SECRET`: um segredo forte para as sessões
   - `ADMIN_USERNAME`: nome do usuário admin
   - `ADMIN_PASSWORD`: senha do usuário admin

3. **Deploy:**
   - Conecte seu repositório GitHub à Railway
   - A Railway detectará automaticamente que é um projeto Node.js
   - O deploy será feito automaticamente

## 📂 Estrutura do Projeto

```
├── config/
│   └── database.js      # Configuração do MongoDB
├── models/
│   ├── Post.js          # Modelo dos posts
│   └── User.js          # Modelo dos usuários
├── utils/
│   └── initAdmin.js     # Inicialização do usuário admin
├── views/               # Templates EJS
├── public/              # Arquivos estáticos
├── uploads/             # Arquivos enviados pelos usuários
├── .env                 # Variáveis de ambiente (não incluído no Git)
├── index.js             # Arquivo principal
└── package.json         # Dependências do projeto
```

## 🔑 Funcionalidades

- ✅ Sistema de autenticação
- ✅ CRUD de posts
- ✅ Upload de arquivos
- ✅ Sistema de comentários
- ✅ Dashboard administrativo
- ✅ Persistência no MongoDB
- ✅ Pronto para deploy na nuvem

## 📝 Migração dos Dados

Se você tinha dados no arquivo `posts.json`, eles não serão migrados automaticamente. O sistema agora usa o MongoDB como fonte única de verdade. O usuário admin será criado automaticamente na primeira execução.

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, Express.js
- **Banco de Dados:** MongoDB com Mongoose
- **Template Engine:** EJS
- **Upload de Arquivos:** Multer
- **Autenticação:** Express-session + bcrypt
- **Deploy:** Railway