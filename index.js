const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/blog_mandis', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado ao MongoDB!');
}).catch(err => {
  console.error('Erro ao conectar ao MongoDB:', err);
});

// Schema para os posts
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  fileUrl: { type: String, default: null },
  comments: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    sameSite: 'lax', // ou 'strict'
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

// Usuário fixo
const USER = { username: 'mandis', passwordHash: '020407' }; // Substitua pelo hash real

// Migração dos dados do JSON para MongoDB (executar uma vez)
async function migrateFromJson() {
  try {
    const postCount = await Post.countDocuments();
    if (postCount === 0 && fs.existsSync('posts.json')) {
      const jsonData = JSON.parse(fs.readFileSync('posts.json'));
      if (jsonData.length > 0) {
        await Post.insertMany(jsonData.map(post => ({
          title: post.title,
          content: post.content,
          fileUrl: post.fileUrl,
          comments: post.comments || [],
          createdAt: new Date(post.id) // usando o ID como timestamp
        })));
        console.log('Dados migrados do JSON para MongoDB!');
      }
    }
  } catch (error) {
    console.error('Erro na migração:', error);
  }
}

// Executar migração na inicialização
migrateFromJson();

// Rotas aqui...

app.listen(3000, () => console.log('Rodando na porta 3000'));

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === USER.username && await bcrypt.compare(password, '$2b$10$WS3iAICHZB19g9xUgtfpMuWXd8EpCn2arPguZDJR6ayJ27CAktrQm')) {
    req.session.user = username;
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Usuário ou senha inválidos!' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

app.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render('dashboard', { posts });
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
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
    console.error('Erro ao salvar post:', error);
    res.redirect('/dashboard');
  }
});

app.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render('index', { posts, session: req.session });
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.render('index', { posts: [], session: req.session });
  }
});

app.get('/post/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect('/');
    res.render('post', { post, session: req.session });
  } catch (error) {
    console.error('Erro ao buscar post:', error);
    res.redirect('/');
  }
});

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

// Excluir comentario
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
    console.error('Erro ao buscar post para edição:', error);
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
    console.error('Erro ao editar post:', error);
    res.redirect('/dashboard');
  }
});

