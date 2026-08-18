# Configuração do Banco de Dados

## Problema Identificado
O servidor não consegue exibir o frontend porque o banco de dados PostgreSQL não está rodando em `localhost:5432`.

## Soluções

### Opção 1: Instalar e Iniciar PostgreSQL (Recomendado para Produção)

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Configurar usuário e banco:
```bash
sudo -u postgres psql
CREATE DATABASE diix_whatsapp;
ALTER USER postgres PASSWORD 'postgres';
\q
```

#### Windows:
Baixe e instale de: https://www.postgresql.org/download/windows/

#### Docker (Mais Fácil):
```bash
docker run --name diix-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=diix_whatsapp -p 5432:5432 -d postgres:15
```

### Opção 2: Usar SQLite (Apenas para Desenvolvimento/Testes)

⚠️ **Atenção**: O schema atual usa tipos JSON que não são suportados pelo SQLite no Prisma. Seria necessário modificar o schema.prisma.

## Verificação

Após iniciar o PostgreSQL, execute:
```bash
npm run dev
```

E acesse: http://localhost:3000

## Status Atual
- ✅ Frontend buildado em `/workspace/public`
- ✅ Servidor configurado para servir estáticos
- ❌ PostgreSQL não está rodando
- ❌ Sem Docker disponível no ambiente

## Próximo Passo
Instale o PostgreSQL ou use Docker para subir um container PostgreSQL.
