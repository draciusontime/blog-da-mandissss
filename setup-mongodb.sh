#!/bin/bash

echo "🚀 Configurando MongoDB para o Blog da Mandis..."

# Verificar se o MongoDB está instalado
if ! command -v mongod &> /dev/null; then
    echo "📦 MongoDB não encontrado. Instalando..."
    
    # Para sistemas Ubuntu/Debian
    if command -v apt &> /dev/null; then
        echo "🔄 Instalando MongoDB no Ubuntu/Debian..."
        wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        sudo apt update
        sudo apt install -y mongodb-org
        
    # Para sistemas CentOS/RHEL/Fedora
    elif command -v dnf &> /dev/null; then
        echo "🔄 Instalando MongoDB no CentOS/RHEL/Fedora..."
        sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo > /dev/null <<EOF
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
        sudo dnf install -y mongodb-org
        
    else
        echo "❌ Sistema operacional não suportado automaticamente."
        echo "Por favor, instale o MongoDB manualmente: https://docs.mongodb.com/manual/installation/"
        exit 1
    fi
    
    # Habilitar e iniciar o serviço MongoDB
    sudo systemctl enable mongod
    sudo systemctl start mongod
else
    echo "✅ MongoDB já está instalado!"
fi

# Verificar se o MongoDB está rodando
if sudo systemctl is-active --quiet mongod; then
    echo "✅ MongoDB está rodando!"
else
    echo "🔄 Iniciando MongoDB..."
    sudo systemctl start mongod
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📝 Como usar:"
echo "1. Execute: node index.js"
echo "2. Acesse: http://localhost:3000"
echo "3. Login: mandis / 020407"
echo ""
echo "🔧 Comandos úteis:"
echo "• Parar MongoDB: sudo systemctl stop mongod"
echo "• Iniciar MongoDB: sudo systemctl start mongod"
echo "• Status MongoDB: sudo systemctl status mongod"
echo "• Acessar MongoDB Shell: mongosh"
echo ""
echo "📊 Verificar dados do blog:"
echo "mongosh --eval \"use blog_mandis; db.posts.find().pretty()\""