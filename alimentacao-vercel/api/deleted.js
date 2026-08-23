// api/deleted.js
// Lista o histórico de registros excluídos (com dados de auditoria).

const { readBin } = require('../lib/jsonbin');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Método não permitido' });
  }

  try {
    const deleted = (await readBin(process.env.JSONBIN_DELETED_BIN_ID)) || [];
    // Mais recentes primeiro
    deleted.sort((a, b) => new Date(b.dataExclusao) - new Date(a.dataExclusao));
    return res.status(200).json({ ok: true, deleted });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Erro no servidor: ' + err.message });
  }
};
