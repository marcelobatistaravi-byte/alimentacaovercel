// api/users.js
// Gestão de usuários do sistema (usado pelo Painel Administrativo).
// GET    -> lista usuários (sem o hash da senha)
// POST   -> cria um novo usuário (senha, se enviada, é hasheada aqui)
// DELETE -> remove um usuário (?id=...)

const { readBin, writeBin } = require('../lib/jsonbin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = async (req, res) => {
  const BIN = process.env.JSONBIN_USERS_BIN_ID;

  try {
    if (req.method === 'GET') {
      const users = (await readBin(BIN)) || [];
      const safeUsers = users.map(({ senhaHash, ...u }) => u);
      return res.status(200).json({ ok: true, users: safeUsers });
    }

    if (req.method === 'POST') {
      const { nome, matricula, email, isAdmin, senha } = req.body || {};
      if (!nome || !matricula) {
        return res.status(400).json({ ok: false, message: 'Nome e matrícula são obrigatórios' });
      }

      const users = (await readBin(BIN)) || [];
      if (users.some((u) => u.matricula === matricula)) {
        return res.status(409).json({ ok: false, message: 'Já existe um usuário com essa matrícula' });
      }

      const novoUsuario = {
        id: crypto.randomUUID(),
        nome: nome.toUpperCase().trim(),
        matricula: matricula.trim(),
        email: email ? email.trim() : null,
        isAdmin: !!isAdmin,
        ativo: true,
        criadoEm: new Date().toISOString(),
      };

      if (senha) {
        novoUsuario.senhaHash = await bcrypt.hash(senha, 10);
      }

      users.push(novoUsuario);
      await writeBin(BIN, users);

      const { senhaHash, ...safeUsuario } = novoUsuario;
      return res.status(201).json({ ok: true, user: safeUsuario });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ ok: false, message: 'id é obrigatório' });

      const users = (await readBin(BIN)) || [];
      const restantes = users.filter((u) => u.id !== id);
      await writeBin(BIN, restantes);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, message: 'Método não permitido' });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Erro no servidor: ' + err.message });
  }
};
