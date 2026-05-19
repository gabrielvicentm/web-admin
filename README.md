# Web Admin

## Autores

- [Gabriel Vicente](https://github.com/gabrielvicentm)
- [João Vitor Gouvea](https://github.com/gouveazs)
- [Leon Kennedy](https://github.com/Kennedys-Leon)
- [Gabriel Gusmão](https://github.com/Gusmaozz)

## Sobre o projeto

O **Web Admin** e o painel administrativo do projeto. Ele centraliza a gestao operacional da transportadora, permitindo acompanhar indicadores, administrar cadastros, controlar viagens, visualizar ocorrencias, consultar abastecimentos, acompanhar manutencoes, gerenciar funcionarios e acessar relatorios.

A aplicacao foi construida como uma SPA em React, consumindo a API principal do backend Go e uma API separada de relatorios por meio dos proxies configurados no Vite.

## Tecnologias utilizadas

- **React**: biblioteca principal para construcao da interface.
- **TypeScript**: tipagem estatica para aumentar a confiabilidade do codigo.
- **Vite**: ambiente de desenvolvimento e build da aplicacao.
- **React Router DOM**: controle das rotas e navegacao interna.
- **Axios**: comunicacao HTTP com os servicos do backend.
- **Fetch Event Source**: suporte a eventos em tempo real via stream.
- **ESLint**: padronizacao e analise estatica do codigo.
- **Prettier**: formatacao automatizada.

## Estrutura do projeto

```text
web-admin/
├── public/
├── src/
│   ├── assets/              # Imagens e arquivos estaticos usados pela interface
│   ├── components/          # Componentes reutilizaveis
│   │   └── auth/            # Componentes de autenticacao e protecao de rotas
│   ├── layouts/             # Layouts compartilhados
│   ├── pages/               # Telas principais do sistema
│   ├── services/            # Clientes HTTP e servicos de integracao com a API
│   ├── App.tsx              # Declaracao das rotas da aplicacao
│   └── main.tsx             # Ponto de entrada do React
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Telas e rotas principais

### Autenticacao

- `/login`: tela de login do administrador.
- `/reset-password`: redefinicao de senha.

### Dashboard

- `/dashboard`: pagina inicial protegida com visao geral da operacao.

### Viagens

- `/dashboard/viagens/listar`: listagem de viagens.
- `/dashboard/viagens/finalizadas`: historico de viagens finalizadas.
- `/dashboard/viagens/nova`: cadastro de nova viagem.
- `/dashboard/viagens/:id/editar`: detalhes e edicao da viagem.

### Veiculos

- `/dashboard/veiculos/listar`: listagem de veiculos.
- `/dashboard/veiculos/novo`: cadastro de veiculo.
- `/dashboard/veiculos/:id/detalhes`: detalhes do veiculo.
- `/dashboard/veiculos/:id/editar`: edicao de veiculo.

### Clientes

- `/dashboard/clientes/listar`: listagem de clientes.
- `/dashboard/clientes/novo`: cadastro de cliente.
- `/dashboard/clientes/:id/editar`: edicao de cliente.

### Tipos de carga

- `/dashboard/tipos-carga/listar`: listagem de tipos de carga.
- `/dashboard/tipos-carga/novo`: cadastro de tipo de carga.
- `/dashboard/tipos-carga/:id/editar`: edicao de tipo de carga.

### Funcionarios e folha de pagamento

- `/dashboard/funcionarios/listar`: listagem de funcionarios.
- `/dashboard/funcionarios/novo`: cadastro de funcionario.
- `/dashboard/funcionarios/:id/editar`: edicao de funcionario.
- `/dashboard/folha-pagamento`: gestao da folha de pagamento.

### Motoristas

- `/dashboard/motoristas/listar`: listagem de motoristas.
- `/dashboard/motoristas/novo`: cadastro de motorista.
- `/dashboard/motoristas/:id/detalhes`: detalhes do motorista.
- `/dashboard/motoristas/:id/editar`: edicao de motorista.

### Manutencoes

- `/dashboard/manutencoes/listar`: listagem de manutencoes.
- `/dashboard/manutencoes/nova`: cadastro de manutencao.
- `/dashboard/manutencoes/:id/editar`: edicao de manutencao.
- `/dashboard/veiculos/:veiculoId/manutencoes`: historico de manutencoes por veiculo.

### Operacao e relatorios

- `/dashboard/abastecimentos`: consulta de abastecimentos.
- `/dashboard/ocorrencias`: acompanhamento de ocorrencias.
- `/dashboard/notificacoes`: area de notificacoes.
- `/dashboard/historico-alteracoes`: historico de alteracoes.
- `/dashboard/acessos/reset-senha`: reset de senha de usuarios administrativos.
- `/dashboard/relatorios`: central de relatorios.
- `/dashboard/relatorios/viagens`: relatorio de viagens.
- `/dashboard/relatorios/folha-pagamento`: relatorio de folha de pagamento.
- `/dashboard/relatorios/:tipo`: relatorios operacionais por tipo.

## Integracao com o backend

A aplicacao usa os seguintes proxies no Vite:

- `/api`: redireciona para `http://localhost:8080`, onde roda a API principal em Go.
- `/reports-api`: redireciona para `http://localhost:8000`, usado para servicos de relatorios.

Os servicos ficam em `src/services` e concentram as chamadas HTTP para cada modulo do sistema, como viagens, veiculos, clientes, motoristas, manutencoes, abastecimentos, ocorrencias, dashboard, folha de pagamento e relatorios.

## Como executar

### Requisitos

- Node.js instalado.
- Backend principal rodando em `http://localhost:8080`.
- API de relatorios rodando em `http://localhost:8000`, quando as telas de relatorio forem utilizadas.

### Instalar dependencias

```bash
npm install
```

### Rodar em desenvolvimento

```bash
npm run dev
```

Por padrao, o Vite disponibiliza a aplicacao em uma porta local informada no terminal, normalmente `http://localhost:5173`.

### Gerar build de producao

```bash
npm run build
```

### Visualizar build localmente

```bash
npm run preview
```

### Executar lint

```bash
npm run lint
```

## Resumo das funcionalidades

- Login e controle de acesso para administradores.
- Dashboard com indicadores da operacao.
- Cadastro e gerenciamento de viagens.
- Controle de veiculos, custos, consumo e historico.
- Cadastro de clientes e tipos de carga.
- Gestao de funcionarios, motoristas e folha de pagamento.
- Controle de manutencoes e abastecimentos.
- Acompanhamento de ocorrencias e notificacoes.
- Relatorios operacionais e financeiros.
- Historico de alteracoes para rastreabilidade.
