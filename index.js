const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// Configuração de sessão com MongoStore
app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo-super-seguro',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  }
}));

// Schema e Model dos Posts
const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    default: null
  },
  comments: [{
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Post = mongoose.model('Post', PostSchema);

// Schema e Model do Usuário (para futuras expansões)
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

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

// Usuário fixo (mantendo compatibilidade)
const USER = { username: 'mandis', passwordHash: '$2b$10$WS3iAICHZB19g9xUgtfpMuWXd8EpCn2arPguZDJR6ayJ27CAktrQm' };

// Função para inicializar usuário padrão
async function initializeDefaultUser() {
  try {
    const existingUser = await User.findOne({ username: USER.username });
    if (!existingUser) {
      const defaultUser = new User({
        username: USER.username,
        passwordHash: USER.passwordHash
      });
      await defaultUser.save();
      console.log('✅ Usuário padrão criado');
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuário padrão:', error);
  }
}

// Inicializar usuário padrão
initializeDefaultUser();

// Middleware de autenticação
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ROTAS

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      req.session.user = username;
      res.redirect('/dashboard');
    } else {
      res.render('login', { error: 'Usuário ou senha inválidos!' });
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.render('login', { error: 'Erro interno do servidor' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render('dashboard', { posts });
  } catch (error) {
    console.error('❌ Erro ao carregar posts:', error);
    res.render('dashboard', { posts: [] });
  }
});

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
    console.error('❌ Erro ao criar post:', error);
    res.redirect('/dashboard');
  }
});

app.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render('index', { posts, session: req.session });
  } catch (error) {
    console.error('❌ Erro ao carregar posts:', error);
    res.render('index', { posts: [], session: req.session });
  }
});

app.get('/post/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect('/');
    res.render('post', { post, session: req.session });
  } catch (error) {
    console.error('❌ Erro ao carregar post:', error);
    res.redirect('/');
  }
});

app.post('/post/:id/comment', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect('/');
    
    post.comments.push({
      text: req.body.comment
    });
    
    await post.save();
    res.redirect('/post/' + req.params.id);
  } catch (error) {
    console.error('❌ Erro ao adicionar comentário:', error);
    res.redirect('/post/' + req.params.id);
  }
});

// Excluir post
app.post('/dashboard/delete/:id', requireLogin, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('❌ Erro ao excluir post:', error);
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
    console.error('❌ Erro ao excluir comentário:', error);
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
    console.error('❌ Erro ao carregar post para edição:', error);
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
    post.updatedAt = new Date();
    
    await post.save();
    res.redirect('/dashboard');
  } catch (error) {
    console.error('❌ Erro ao editar post:', error);
    res.redirect('/dashboard');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

