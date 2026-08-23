// lib/jsonbin.js
// Funções auxiliares para ler e gravar "bins" (coleções JSON) no jsonbin.io.
// A chave mestra (X-Master-Key) NUNCA é exposta ao navegador — ela só existe
// aqui, no lado do servidor (variável de ambiente na Vercel).

const BASE_URL = 'https://api.jsonbin.io/v3/b';

async function readBin(binId) {
  if (!binId) throw new Error('ID do bin não configurado (verifique as variáveis de ambiente)');

  const response = await fetch(`${BASE_URL}/${binId}/latest`, {
    headers: {
      'X-Master-Key': process.env.JSONBIN_MASTER_KEY,
      'X-Bin-Meta': 'false',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao ler o bin ${binId}: HTTP ${response.status}`);
  }

  const data = await response.json();

  // O jsonbin.io não aceita salvar um array vazio ([]) como conteúdo inicial
  // do bin — por isso os bins são criados com um item "semente"
  // ([{"seed": true}]). Filtramos esse item aqui para que ele nunca apareça
  // nas listas reais do sistema.
  if (Array.isArray(data)) {
    return data.filter((item) => !(item && item.seed === true));
  }

  return data;
}

async function writeBin(binId, data) {
  if (!binId) throw new Error('ID do bin não configurado (verifique as variáveis de ambiente)');

  const response = await fetch(`${BASE_URL}/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': process.env.JSONBIN_MASTER_KEY,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Falha ao gravar o bin ${binId}: HTTP ${response.status}`);
  }

  return response.json();
}

module.exports = { readBin, writeBin };
