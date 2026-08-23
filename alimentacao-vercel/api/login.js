// api/login.js
// Login do sistema principal: Nome Completo + Número de Matrícula (ou senha
// cadastrada). A verificação acontece no servidor, então a lista de usuários
// e senhas nunca é exposta ao navegador.

const { readBin } = require('../lib/jsonbin');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Método não permitido' });
  }

  try {
    const { nome, credencial } = req.body || {};
    if (!nome || !credencial) {
      return res.status(400).json({ ok: false, message: 'Preencha nome e matrícula/senha' });
    }

    const users = (await readBin(process.env.JSONBIN_USERS_BIN_ID)) || [];
    const user = users.find(
      (u) => u.nome.trim().toLowerCase() === nome.trim().toLowerCase() && u.ativo !== false
    );

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Usuário não encontrado ou inativo' });
    }

    // Aceita a matrícula "crua" OU uma senha customizada (com hash) se o
    // usuário já tiver cadastrado uma pelo fluxo "Cadastre uma Senha".
    let valido = credencial === user.matricula;
    if (!valido && user.senhaHash) {
      valido = await bcrypt.compare(credencial, user.senhaHash);
    }

    if (!valido) {
      return res.status(401).json({ ok: false, message: 'Credenciais inválidas' });
    }

    const { senhaHash, ...safeUser } = user;
    return res.status(200).json({ ok: true, user: safeUser });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Erro no servidor: ' + err.message });
  }
};
