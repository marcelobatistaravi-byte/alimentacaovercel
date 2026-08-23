// api/records.js
// CRUD dos registros de fornecimento de alimentação.
// GET    -> lista registros ativos
// POST   -> cria um novo registro
// PUT    -> atualiza um registro existente
// DELETE -> remove um registro (movendo-o para o bin de "excluídos" com dados de auditoria)

const { readBin, writeBin } = require('../lib/jsonbin');
const crypto = require('crypto');

module.exports = async (req, res) => {
  const RECORDS_BIN = process.env.JSONBIN_RECORDS_BIN_ID;
  const DELETED_BIN = process.env.JSONBIN_DELETED_BIN_ID;

  try {
    if (req.method === 'GET') {
      const records = (await readBin(RECORDS_BIN)) || [];
      return res.status(200).json({ ok: true, records });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const obrigatorios = ['tipo', 'valor', 'dataCompra', 'estabelecimento', 'custodiado', 'responsavel'];
      const faltando = obrigatorios.filter((campo) => !body[campo] && body[campo] !== 0);
      if (faltando.length) {
        return res.status(400).json({ ok: false, message: `Campos obrigatórios faltando: ${faltando.join(', ')}` });
      }

      const records = (await readBin(RECORDS_BIN)) || [];
      const novoRegistro = {
        id: crypto.randomUUID(),
        tipo: body.tipo,
        valor: Number(body.valor),
        dataCompra: body.dataCompra,
        estabelecimento: body.estabelecimento,
        custodiado: body.custodiado,
        nBo: body.nBo || null,
        dataEntrada: body.dataEntrada || null,
        horaEntrada: body.horaEntrada || null,
        dataSaida: body.dataSaida || null,
        horaSaida: body.horaSaida || null,
        responsavel: body.responsavel,
        inseridoPor: body.responsavel,
        dataInsercao: new Date().toISOString(),
        alteradoPor: null,
        dataAlteracao: null,
      };

      records.push(novoRegistro);
      await writeBin(RECORDS_BIN, records);
      return res.status(201).json({ ok: true, record: novoRegistro });
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      if (!body.id) return res.status(400).json({ ok: false, message: 'id é obrigatório' });

      const records = (await readBin(RECORDS_BIN)) || [];
      const index = records.findIndex((r) => r.id === body.id);
      if (index === -1) return res.status(404).json({ ok: false, message: 'Registro não encontrado' });

      records[index] = {
        ...records[index],
        ...body,
        valor: body.valor !== undefined ? Number(body.valor) : records[index].valor,
        alteradoPor: body.alteradoPor || records[index].alteradoPor,
        dataAlteracao: new Date().toISOString(),
      };

      await writeBin(RECORDS_BIN, records);
      return res.status(200).json({ ok: true, record: records[index] });
    }

    if (req.method === 'DELETE') {
      const { id, excluidoPor } = req.body || {};
      if (!id) return res.status(400).json({ ok: false, message: 'id é obrigatório' });

      const records = (await readBin(RECORDS_BIN)) || [];
      const index = records.findIndex((r) => r.id === id);
      if (index === -1) return res.status(404).json({ ok: false, message: 'Registro não encontrado' });

      const [removido] = records.splice(index, 1);
      await writeBin(RECORDS_BIN, records);

      const deletados = (await readBin(DELETED_BIN)) || [];
      deletados.push({
        ...removido,
        excluidoPor: excluidoPor || 'desconhecido',
        dataExclusao: new Date().toISOString(),
      });
      await writeBin(DELETED_BIN, deletados);

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, message: 'Método não permitido' });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Erro no servidor: ' + err.message });
  }
};
