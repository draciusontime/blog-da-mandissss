# 🍃 Integração MongoDB - Blog da Mandis

## O que foi implementado

Migrei o sistema de armazenamento do blog de arquivos JSON para **MongoDB**, uma base de dados NoSQL moderna e escalável. Agora os posts, comentários e todas as informações são armazenadas no MongoDB.

## 🚀 Como usar

### 1. Instalar MongoDB (Automático)

Execute o script de instalação automática:

```bash
./setup-mongodb.sh
```

Este script vai:
- ✅ Instalar MongoDB automaticamente no seu sistema
- ✅ Configurar e iniciar o serviço
- ✅ Migrar dados existentes do `posts.json` para MongoDB

### 2. Instalar MongoDB (Manual)

Se preferir instalar manualmente:

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**CentOS/RHEL/Fedora:**
```bash
sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo > /dev/null <<EOF
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
sudo dnf install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Executar a aplicação

```bash
node index.js
```

Acesse: http://localhost:3000

## 🔧 Comandos úteis

### Gerenciar MongoDB
```bash
# Verificar status
sudo systemctl status mongod

# Iniciar
sudo systemctl start mongod

# Parar
sudo systemctl stop mongod

# Reiniciar
sudo systemctl restart mongod
```

### Acessar dados do blog
```bash
# Entrar no MongoDB Shell
mongosh

# Usar a base de dados do blog
use blog_mandis

# Ver todos os posts
db.posts.find().pretty()

# Contar posts
db.posts.countDocuments()

# Ver post específico
db.posts.findOne()
```

## 📊 Estrutura dos dados

### Schema do Post
```javascript
{
  title: String,      // Título do post
  content: String,    // Conteúdo do post  
  fileUrl: String,    // URL do arquivo anexado (opcional)
  comments: [String], // Array de comentários
  createdAt: Date     // Data de criação
}
```

### Exemplo de dados
```json
{
  "_id": "ObjectId('...')",
  "title": "Meu primeiro post",
  "content": "Este é o conteúdo do post...",
  "fileUrl": "/uploads/1234567890-image.jpg",
  "comments": [
    "Ótimo post!",
    "Muito interessante"
  ],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

## 🔄 Migração automática

Quando você executar a aplicação pela primeira vez após a implementação:

1. **Detecta** se existe o arquivo `posts.json`
2. **Verifica** se o MongoDB está vazio
3. **Migra** automaticamente todos os dados do JSON para MongoDB
4. **Preserva** todos os posts e comentários existentes

## 🎯 Vantagens da migração

### Antes (JSON)
- ❌ Todos os dados em um arquivo
- ❌ Lento para muitos posts
- ❌ Sem estrutura de dados
- ❌ Difícil de fazer consultas

### Agora (MongoDB)
- ✅ Base de dados profissional
- ✅ Melhor performance
- ✅ Estrutura organizada
- ✅ Consultas avançadas
- ✅ Escalável para milhares de posts
- ✅ Backup e recuperação fáceis

## 🛠️ Funcionalidades

Todas as funcionalidades continuam funcionando:

- ✅ **Login/Logout**: `mandis` / `020407`
- ✅ **Criar posts** com texto e imagens
- ✅ **Editar posts** existentes
- ✅ **Excluir posts**
- ✅ **Adicionar comentários**
- ✅ **Excluir comentários**
- ✅ **Upload de arquivos**

## 🔍 Resolução de problemas

### MongoDB não inicia
```bash
# Verificar logs
sudo journalctl -u mongod

# Verificar configuração
sudo cat /etc/mongod.conf

# Reiniciar serviço
sudo systemctl restart mongod
```

### Erro de conexão
1. Verifique se MongoDB está rodando: `sudo systemctl status mongod`
2. Verifique se a porta 27017 está livre: `netstat -tlnp | grep 27017`
3. Reinicie a aplicação: `node index.js`

### Dados não aparecem
```bash
# Verificar se os dados foram migrados
mongosh --eval "use blog_mandis; db.posts.countDocuments()"
```

## 📱 Interface não mudou

A interface do blog continua **exatamente igual**. A única diferença é que agora os dados são armazenados no MongoDB em vez de arquivos JSON, oferecendo:

- 🚀 **Melhor performance**
- 🔒 **Mais segurança**
- 📈 **Maior escalabilidade**
- 🛠️ **Facilidade de manutenção**

---

## ⚡ Quick Start

```bash
# 1. Instalar e configurar MongoDB
./setup-mongodb.sh

# 2. Executar aplicação
node index.js

# 3. Acessar o blog
# http://localhost:3000
```

**Login:** `mandis` / `020407`

Pronto! Seu blog agora está funcionando com MongoDB! 🎉