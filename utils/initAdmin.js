const User = require('../models/User');

const initAdminUser = async () => {
  try {
    // Verificar se já existe o usuário admin
    const existingAdmin = await User.findOne({ username: process.env.ADMIN_USERNAME });
    
    if (!existingAdmin) {
      // Criar hash da senha
      const passwordHash = await User.hashPassword(process.env.ADMIN_PASSWORD);
      
      // Criar usuário admin
      const adminUser = new User({
        username: process.env.ADMIN_USERNAME,
        passwordHash: passwordHash
      });
      
      await adminUser.save();
      console.log('Usuário admin criado com sucesso!');
    } else {
      console.log('Usuário admin já existe.');
    }
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error.message);
  }
};

module.exports = initAdminUser;