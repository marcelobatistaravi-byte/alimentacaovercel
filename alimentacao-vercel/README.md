# Sistema de Controle de Alimentação para Custodiados

Versão migrada da Manus para **Vercel** (frontend estático + funções serverless)
usando **jsonbin.io** como banco de dados.

⚠️ **Atenção — dados sensíveis.** Este sistema guarda nomes de pessoas custodiadas
e números de BO. Siga os passos de segurança abaixo à risca antes de colocar
dados reais nele. Não pule a etapa de variáveis de ambiente: se a chave do
jsonbin for exposta no navegador, qualquer pessoa pode ler/apagar os dados.

---

## 1. Criar os "bins" no jsonbin.io

1. Crie uma conta em https://jsonbin.io
2. Vá em **API Keys** e copie sua **X-Master-Key** (fica só com você, nunca vai para o navegador).
3. Crie 3 bins (Create Bin), um para cada coleção, com o conteúdo inicial `[]` (array vazio):
   - `usuarios` → copie o **Bin ID**
   - `registros` → copie o **Bin ID**
   - `registros_excluidos` → copie o **Bin ID**

## 2. Subir o projeto para o GitHub

Crie um repositório novo e suba todos os arquivos desta pasta (`public/`, `api/`,
`lib/`, `package.json`, etc).

## 3. Importar na Vercel

1. Em https://vercel.com, clique em **Add New → Project** e selecione o repositório.
2. Framework preset: **Other** (a Vercel detecta `public/` como estático e `api/` como funções automaticamente).
3. Antes de fazer o deploy, vá em **Environment Variables** e adicione:

   | Nome | Valor |
   |---|---|
   | `JSONBIN_MASTER_KEY` | sua X-Master-Key |
   | `JSONBIN_USERS_BIN_ID` | ID do bin `usuarios` |
   | `JSONBIN_RECORDS_BIN_ID` | ID do bin `registros` |
   | `JSONBIN_DELETED_BIN_ID` | ID do bin `registros_excluidos` |

4. Clique em **Deploy**.

## 4. Cadastrar o primeiro administrador

O sistema não vem com nenhum usuário pré-cadastrado. Depois do primeiro deploy,
crie o primeiro administrador chamando a própria API do seu projeto (não é
preciso mexer manualmente no jsonbin — a senha já sai com hash aplicado):

```bash
curl -X POST https://SEU-PROJETO.vercel.app/api/users \
  -H "Content-Type: application/json" \
  -d '{"nome":"SEU NOME COMPLETO","matricula":"000000","senha":"uma-senha-forte","isAdmin":true}'
```

Depois disso, use "Acesso Administrativo" na tela de login com esse nome e senha
para entrar no Painel Administrativo e cadastrar os demais servidores.

## 5. Cadastrar servidores comuns

Pelo Painel Administrativo → Novo Usuário, informe nome completo e matrícula.
A matrícula funciona como senha padrão de acesso (o próprio servidor pode
depois cadastrar uma senha personalizada, se esse fluxo for implementado).

---

## Limitações desta versão (e o que considerar depois)

- **Login básico**: sem 2FA, sem bloqueio por tentativas, sem expiração de sessão
  automática. Adequado para uso interno controlado, mas vale reforçar depois.
- **jsonbin.io tem limite de tamanho por bin** (varia por plano — confira o
  limite atual no site). Com ~1000 registros o uso atual deve caber tranquilo,
  mas se o volume crescer muito nos próximos anos, migrar para um banco de
  verdade (Postgres no Neon/Supabase, por exemplo) escala melhor.
- **"Enviar relatório para o plantão" por e-mail** não foi implementado nesta
  versão (exigiria um serviço de envio de e-mail com API própria, como Resend
  ou SendGrid). O botão de baixar o PDF localmente funciona normalmente.
- **Edição de usuários**: o painel permite criar e excluir usuários, mas não
  editar um já existente — fácil de adicionar depois se for necessário.

## Estrutura do projeto

```
public/index.html   → toda a interface (SPA em HTML/JS puro, sem build)
api/login.js         → login do sistema (nome + matrícula/senha)
api/admin-login.js   → login do painel administrativo
api/users.js         → CRUD de usuários
api/records.js       → CRUD de registros de alimentação
api/deleted.js        → histórico de registros excluídos
lib/jsonbin.js        → funções auxiliares de leitura/gravação no jsonbin.io
```
