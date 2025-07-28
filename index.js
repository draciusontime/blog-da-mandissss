require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Importar configurações e modelos
const connectDB = require('./config/database');
const Post = require('./models/Post');
const User = require('./models/User');
const initAdminUser = require('./utils/initAdmin');

const app = express();

// Conectar ao MongoDB
connectDB().then(() => {
  // Inicializar usuário admin após conectar ao banco
  initAdminUser();
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    sameSite: 'lax',
    // secure: true, // só ative se estiver usando HTTPS
  }
}));

// Configuração do multer para salvar arquivos na pasta 'uploads'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Garanta que a pasta 'uploads' existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use('/uploads', express.static('uploads'));

// Middleware para autenticação
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ROTAS

// Rota de login - mostrar formulário
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Rota de login - processar autenticação
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Buscar usuário no banco de dados
    const user = await User.findOne({ username: username });
    
    if (user && await user.comparePassword(password)) {
      // Atualizar último login
      user.lastLogin = new Date();
      await user.save();
      
      req.session.user = username;
      res.redirect('/dashboard');
    } else {
      res.render('login', { error: 'Usuário ou senha inválidos!' });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.render('login', { error: 'Erro interno do servidor.' });
  }
});

// Rota de logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Dashboard - listar posts (admin)
app.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render('dashboard', { posts });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    res.render('dashboard', { posts: [] });
  }
});

// Criar novo post
app.post('/dashboard', requireLogin, upload.single('file'), async (req, res) => {
  try {
    let fileUrl = null;
    if (req.file) {
      fileUrl = '/uploads/' + req.file.filename;
    }
    
    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      fileUrl: fileUrl,
      comments: []
    });
    
    await newPost.save();
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Erro ao criar post:', error);
    res.redirect('/dashboard');
  }
});

// Página inicial - listar todos os posts
app.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render('index', { posts, session: req.session });
  } catch (error) {
    console.error('Erro ao carregar posts:', error);
    res.render('index', { posts: [], session: req.session });
  }
});

// Visualizar post específico
app.get('/post/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect('/');
    res.render('post', { post, session: req.session });
  } catch (error) {
    console.error('Erro ao carregar post:', error);
    res.redirect('/');
  }
});

// Adicionar comentário
app.post('/post/:id/comment', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect('/');
    
    post.comments.push(req.body.comment);
    await post.save();
    
    res.redirect('/post/' + req.params.id);
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.redirect('/post/' + req.params.id);
  }
});

// Excluir post
app.post('/dashboard/delete/:id', requireLogin, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Erro ao excluir post:', error);
    res.redirect('/dashboard');
  }
});

// Excluir comentário
app.post('/post/:id/comment/:commentIdx/delete', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect('/');
    
    const idx = parseInt(req.params.commentIdx, 10);
    if (!isNaN(idx) && idx >= 0 && idx < post.comments.length) {
      post.comments.splice(idx, 1);
      await post.save();
    }
    
    res.redirect('/post/' + req.params.id);
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    res.redirect('/post/' + req.params.id);
  }
});

// Editar post - mostrar formulário
app.get('/dashboard/edit/:id', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect('/dashboard');
    res.render('edit', { post });
  } catch (error) {
    console.error('Erro ao carregar post para edição:', error);
    res.redirect('/dashboard');
  }
});

// Editar post - salvar alterações
app.post('/dashboard/edit/:id', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect('/dashboard');
    
    post.title = req.body.title;
    post.content = req.body.content;
    await post.save();
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Erro ao atualizar post:', error);
    res.redirect('/dashboard');
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

