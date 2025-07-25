const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Carregar posts
function loadPosts() {
  if (!fs.existsSync('posts.json')) return [];
  return JSON.parse(fs.readFileSync('posts.json'));
}
function savePosts(posts) {
  fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
}

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

app.get('/dashboard', requireLogin, (req, res) => {
  const posts = loadPosts();
  res.render('dashboard', { posts }); // <-- aqui!
});

app.post('/dashboard', requireLogin, upload.single('file'), (req, res) => {
  const posts = loadPosts();
  let fileUrl = null;
  if (req.file) {
    fileUrl = '/uploads/' + req.file.filename;
  }
  posts.unshift({
    id: Date.now(),
    title: req.body.title,
    content: req.body.content,
    fileUrl: fileUrl,
    comments: []
  });
  savePosts(posts);
  res.redirect('/dashboard');
});

app.get('/', (req, res) => {
  const posts = loadPosts();
  res.render('index', { posts, session: req.session });
});

app.get('/post/:id', (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.redirect('/');
  res.render('post', { post, session: req.session });
});

app.post('/post/:id/comment', (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.redirect('/');
  post.comments.push(req.body.comment);
  savePosts(posts);
  res.redirect('/post/' + req.params.id);
});

// Excluir post
app.post('/dashboard/delete/:id', requireLogin, (req, res) => {
  let posts = loadPosts();
  posts = posts.filter(p => p.id != req.params.id);
  savePosts(posts);
  res.redirect('/dashboard');
});

// Excluir comentario

app.post('/post/:id/comment/:commentIdx/delete', requireLogin, (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.redirect('/');
  const idx = parseInt(req.params.commentIdx, 10);
  if (!isNaN(idx) && idx >= 0 && idx < post.comments.length) {
    post.comments.splice(idx, 1);
    savePosts(posts);
  }
  res.redirect('/post/' + req.params.id);
});

// Editar post - mostrar formulário
app.get('/dashboard/edit/:id', requireLogin, (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.redirect('/dashboard');
  res.render('edit', { post });
});

// Editar post - salvar alterações
app.post('/dashboard/edit/:id', requireLogin, (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.redirect('/dashboard');
  post.title = req.body.title;
  post.content = req.body.content;
  savePosts(posts);
  res.redirect('/dashboard');
});

