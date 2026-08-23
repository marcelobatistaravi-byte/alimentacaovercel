// api/admin-login.js
// Login do Painel Administrativo: Nome do Administrador + Senha de Acesso.
// Só usuários com isAdmin=true e senha cadastrada conseguem entrar.

const { readBin } = require('../lib/jsonbin');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Método não permitido' });
  }

  try {
    const { nome, senha } = req.body || {};
    if (!nome || !senha) {
      return res.status(400).json({ ok: false, message: 'Preencha nome e senha' });
    }

    const users = (await readBin(process.env.JSONBIN_USERS_BIN_ID)) || [];
    const admin = users.find(
      (u) => u.isAdmin && u.nome.trim().toLowerCase() === nome.trim().toLowerCase()
    );

    if (!admin || !admin.senhaHash) {
      return res.status(401).json({ ok: false, message: 'Administrador não encontrado' });
    }

    const valido = await bcrypt.compare(senha, admin.senhaHash);
    if (!valido) {
      return res.status(401).json({ ok: false, message: 'Senha incorreta' });
    }

    const { senhaHash, ...safeAdmin } = admin;
    return res.status(200).json({ ok: true, user: safeAdmin });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Erro no servidor: ' + err.message });
  }
};
