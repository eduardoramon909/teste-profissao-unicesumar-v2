# Teste de Profissão UniCesumar

Questionário rápido (cerca de 1 minuto, 15 perguntas de múltipla escolha) para feiras de profissões em escolas, com captura de leads e painel administrativo.

**Como funciona**

1. **Tela inicial:** Nome completo, WhatsApp, CPF (validado pelo algoritmo oficial, sem API externa) e *Curso pretendido* (opcional).
   - Se o curso foi escolhido, o lead é salvo e **não há teste**.
   - Se ficou em branco, começa o teste.
2. **Teste (15 perguntas):**
   - **1:** escolaridade em formato sanfona (7º ao 9º ano, 1º ao 3º do médio, graduado). Define o tipo de curso do resultado: fundamental e 1º/2º médio recebem técnicos e profissionalizantes; 3º médio recebe graduação; graduado recebe pós-graduação.
   - **2 a 5:** descobrem a área (Educação, Saúde, Tecnologia, Gestão e Negócios, Direito/Segurança, Comunicação/Artes, Engenharias, Meio Ambiente, Alimentos). Para graduados, uma delas vira "Sua graduação é em qual área?".
   - **6 a 10:** gostos pessoais (traços de perfil).
   - **11 a 15:** específicas, tiradas do banco da(s) área(s) que mais combinaram.
3. **Resultado:** perfil (ex.: "Mente Criativa"), área e os **3 cursos** mais afins. Tocar em um deles preenche o *Curso pretendido* do lead. Há também "Ver todos os cursos".
4. **Painel `/admin`:** uma **ação por dia** (tudo cadastrado no mesmo dia cai junto), campo para o **nome da ação**, leads **editáveis**, busca, e botão para baixar a **planilha .xlsx no formato do modelo**.

---

## 1. Testar no seu computador (modo demonstração)

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. O painel fica em `http://localhost:5173/admin` (qualquer e-mail, senha `demo`).
Sem as variáveis do Firebase o app roda em **modo demonstração** (faixa amarela no topo): os dados ficam só no navegador.

## 2. Colocar no ar (Firebase + GitHub + Vercel)

### 2.1 Firebase (banco de dados e login do painel)

1. Em <https://console.firebase.google.com> crie um projeto.
2. **Build > Firestore Database > Criar banco de dados** (modo produção; região `southamerica-east1`, São Paulo).
3. **Build > Authentication > Começar > E-mail/senha > Ativar.** Na aba **Users**, adicione o usuário do admin (e-mail e senha).
4. **Firestore > Regras:** cole o conteúdo de [`firestore.rules`](firestore.rules), **troque `SEU-EMAIL@exemplo.com`** pelo(s) e-mail(s) da equipe (pode ser uma lista: `['a@x.com', 'b@x.com']`) e clique em **Publicar**.
5. **Configurações do projeto (engrenagem) > Seus apps > ícone `</>` (Web)** > registre o app e copie o `firebaseConfig`.

### 2.2 GitHub

```bash
git init
git add .
git commit -m "Teste de Profissão UniCesumar"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/teste-profissao-unicesumar.git
git push -u origin main
```

(`.env`, `node_modules` e `dist` já estão no `.gitignore`.)

### 2.3 Vercel

1. <https://vercel.com> > **Add New > Project** > importe o repositório (o framework **Vite** é detectado sozinho).
2. Em **Environment Variables**, cadastre as 6 variáveis abaixo com os valores do `firebaseConfig` (modelo em [`.env.example`](.env.example)):

   | Variável | Valor do firebaseConfig |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

3. **Deploy.** O teste fica em `https://SEU-PROJETO.vercel.app` e o painel em `/admin`. Se mudar as variáveis depois, faça **Redeploy**.

Conferiu que está em produção quando **não aparece a faixa amarela** de "Modo demonstração".

---

## 3. No dia da ação

- Deixe o aparelho na tela inicial. Ao fim de cada participante aparece **"Próximo participante"** (volta sozinho em 30 s). Sem mexer por 3 minutos, o app volta ao início e **apaga o que foi digitado** (aparelho compartilhado).
- **Sem internet?** O cadastro fica guardado no aparelho e sobe sozinho quando a conexão voltar. Não feche o navegador nem limpe os dados antes disso.
- O lead é criado assim que a pessoa sai da tela inicial. Quem abandona o teste fica como **"Teste não concluído"** (o contato já foi capturado).
- No painel (`/admin`), as ações aparecem por data. Dê um nome à ação (ex.: *Feira das Profissões - Colégio X*), edite leads (nome, WhatsApp, CPF, e-mail, curso), exclua duplicados e baixe a planilha. Os leads chegam ao vivo, sem recarregar.

## 4. A planilha exportada

Segue o modelo enviado: aba **Leads** (NOME COMPLETO, CPF, EMAIL, CELULAR, MODALIDADE, ID_MODALIDADE, CURSO, ID_CURSO, com as colunas de ID ocultas e preenchidas pelos mesmos `VLOOKUP`s, e as listas suspensas) e aba **Cursos** (cópia da lista oficial). Uma terceira aba, **Detalhes**, traz dados extras para a equipe: hora, escolaridade, área, perfil, sugestões do teste e situação.

Pontos de atenção:

- **EMAIL:** o formulário que você descreveu não pede e-mail, então a coluna sai vazia (dá para preencher pelo painel). Para coletar no cadastro, use `COLETAR_EMAIL: true` em `src/config.js`.
- **Modalidade:** a lista do modelo não tem "semipresencial"; cursos semipresenciais saem como `EAD - GRADUAÇÃO`. O nome do curso (com o sufixo `SEMIPRESENCIAL`) identifica o curso certo.
- **CPF repetido:** a opção *Não repetir CPF na planilha* (ligada por padrão) mantém um registro por CPF, preferindo o que tem curso escolhido.
- 7 itens dos folhetos não existem na lista oficial (as "Segunda Licenciatura" e a "Segunda Habilitação"). Eles aparecem no seletor, mas saem **sem ID** na planilha.

## 5. Personalização

| O que mudar | Onde |
|---|---|
| Nome do polo, telefone, site de matrícula, logo, texto de consentimento, nº de perguntas específicas (até 10 = teste de 20), tempos de reset, `COLETAR_EMAIL` | `src/config.js` |
| Quais tipos de curso cada escolaridade recebe | `TRILHAS` em `src/data/escolaridade.js` |
| Perguntas e pesos | `src/data/perguntas.js` (o topo do arquivo explica o formato) |
| Cursos, áreas e famílias | `src/data/cursos.js`, `src/data/familias.js`, `src/data/areas.js` |
| Logo oficial | coloque o arquivo em `public/` e informe `LOGO_URL` em `src/config.js` |

Hoje 7º ao 9º ano recebem **técnicos e profissionalizantes**, como combinado. Como cursos técnicos costumam exigir estar no ensino médio, se preferir que o fundamental receba só profissionalizantes, deixe `['profissionalizante']` nas linhas `fund7`, `fund8` e `fund9` de `TRILHAS`.

**Adicionar um curso:** inclua uma linha em `src/data/cursos.js` (copie uma existente). `area` e `familia` definem quando ele é sugerido. Se o curso existir na planilha oficial, use o mesmo `oficial` e o `id` dela.

## 6. Como o teste escolhe os cursos (resumo)

Todas as respostas somam pontos em **áreas**, **traços de perfil** (números, pessoas, criatividade, tecnologia, cuidar, ensinar...), **famílias de cursos** e palavras-chave. Cada curso do tipo certo recebe uma nota: 30% área, 30% semelhança de traços, 30% respostas específicas e 10% palavras-chave (com um pequeno bônus para cursos que estão nos folhetos). Os 3 melhores são sugeridos, evitando repetir a mesma família. É 100% local: as mesmas respostas dão sempre o mesmo resultado. Para ver o raciocínio de perfis simulados: `node tests/personas.mjs`.

## 7. Segurança e LGPD

- Qualquer pessoa pode **criar** um lead e **atualizá-lo por 6 horas** (para gravar o resultado do teste); só os e-mails listados em `firestore.rules` conseguem **ler, editar ou excluir**. O formato dos dados também é validado nas regras.
- O CPF vale pelo dígito verificador (confere se o número é válido, não se pertence à pessoa).
- Há uma caixa de **consentimento** obrigatória, com aviso para menores de 18 anos. Para público menor de idade, combine com a escola a autorização dos responsáveis. Ajuste o texto em `TEXTO_CONSENTIMENTO`.
- Depois de usar os dados, exclua o que não for mais necessário (botão *Excluir* no painel).
- Para barrar cadastros em massa de bots, ative o **Firebase App Check** (opcional).

## 8. Testes e estrutura

```bash
npm test          # validações, banco de perguntas, motor de recomendação e planilha
npm run build     # gera a pasta dist
```

```
firestore.rules        regras de segurança do Firestore
src/config.js          configurações
src/data/              cursos, planilha oficial, áreas, famílias, perguntas, perfis
src/lib/               motor do teste, validações (CPF), datas, banco de dados, exportação
src/pages/teste/       telas do teste (início, perguntas, resultado, final)
src/pages/admin/       login, painel, edição de lead
tests/                 testes automáticos e ferramentas de ajuste (personas.mjs, debug.mjs)
```

**Dados no Firestore:** coleção `acoes` (um documento por dia, ex.: `2026-09-28`, com o `nome`) e coleção `leads` (nome, whatsapp, cpf, email, curso, escolaridade, área, perfil, sugestões, respostas, status, `acaoId`, datas).
