require('dotenv').config();
const fs = require('fs');
const connectDB = require('../config/database');
const Post = require('../models/Post');

async function migrateData() {
  try {
    // Conectar ao MongoDB
    await connectDB();
    
    // Verificar se o arquivo posts.json existe
    if (!fs.existsSync('posts.json')) {
      console.log('Arquivo posts.json não encontrado. Nada para migrar.');
      process.exit(0);
    }
    
    // Ler dados do arquivo JSON
    const jsonData = fs.readFileSync('posts.json', 'utf8');
    const posts = JSON.parse(jsonData);
    
    if (!Array.isArray(posts) || posts.length === 0) {
      console.log('Nenhum post encontrado no arquivo JSON.');
      process.exit(0);
    }
    
    console.log(`Encontrados ${posts.length} posts para migrar...`);
    
    // Migrar cada post
    for (const oldPost of posts) {
      try {
        // Verificar se o post já existe (baseado no título e conteúdo)
        const existingPost = await Post.findOne({
          title: oldPost.title,
          content: oldPost.content
        });
        
        if (existingPost) {
          console.log(`Post "${oldPost.title}" já existe no banco de dados. Pulando...`);
          continue;
        }
        
        // Criar novo post no MongoDB
        const newPost = new Post({
          title: oldPost.title,
          content: oldPost.content,
          fileUrl: oldPost.fileUrl || null,
          comments: oldPost.comments || [],
          createdAt: oldPost.createdAt ? new Date(oldPost.createdAt) : new Date()
        });
        
        await newPost.save();
        console.log(`✅ Post "${oldPost.title}" migrado com sucesso!`);
        
      } catch (error) {
        console.error(`❌ Erro ao migrar post "${oldPost.title}":`, error.message);
      }
    }
    
    console.log('\n🎉 Migração concluída!');
    console.log('💡 Recomenda-se fazer backup do arquivo posts.json e depois removê-lo.');
    
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    process.exit(0);
  }
}

// Executar migração
migrateData();