# Koa Boilerplate

- [Koa Boilerplate](#koa-boilerplate)
  - [Run](#run)
  - [Testing requests](#testing-requests)
  - [Setup](#setup)
    - [Dependencies](#dependencies)
    - [Docker](#docker)
    - [Barebone Setup](#barebone-setup)
      - [Database](#database)
      - [Create Database Schema](#create-database-schema)
    - [Init DB](#init-db)
    - [Migrations](#migrations)
  - [Database schema](#database-schema)
  - [TODO](#todo)

## Run

```
$ yarn dev
```

(Or just run the docker-compose like indicated in the setup below if you want to use docker)

## Testing requests

Use Insomnia or Postman.
For authenticated requests (marked with the `@Authorized` decorator) we use JWT and you need to pass a JWT token with your request.
You can generate one using jwt.io or an Insomnia or Postman plugin.
The `sub` of your JWT must contain the user ID you wish to use (you can create an user in Postico or your favorite postgresql client) or just use one of the existing users if you ran the seeds.

There is an existing Insomnia collection accessible in `docs/` that you can import to try requests. You'll still need to install the JWT plugin and set the `sub` to a user existing in your database.

Examples routes are `api/examples` and `api/examples/no-auth`.

## Setup

### Dependencies

```
$ yarn install
```

### Docker

Setup a development environment with Docker. Copy [.env.example](./.env.example) and rename to `.env` - `cp .env.example .env` - which sets the required environments for PostgreSQL such as `DATABASE_URL`.

Start the PostgreSQL database

```bash
docker-compose -f docker-compose-dev.yml up --build
```

### Barebone Setup

#### Database

```
$ psql -d postgres
```

```
CREATE ROLE myuser WITH LOGIN PASSWORD 'mypassword';
ALTER ROLE myuser SUPERUSER CREATEDB;
CREATE DATABASE mydatabase OWNER myuser;
GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;
```

To make sure everything is properly set, run `\l` in `psql`. It should return something like that:

```
 Name                      | Owner            | Encoding | Collate | Ctype | Access privileges
---------------------------+------------------+----------+---------+-------+-------------------
 mydatabase                | myuser           | UTF8     | C       | C     | =Tc/myuser +
```

#### Create Database Schema

Before going any further the API expects your Postgres database to have a schema named whatever you want. Use your favorite client to connect to your postgres instance and run.
This is not needed on docker, the init script does it.

```sql
CREATE SCHEMA IF NOT EXISTS myschema;
```

### Init DB

This will drop the database and seed it, do not use in production.

```
yarn dev:db:init
```

or

```
docker exec -it <your_container_id> yarn dev:db:init
// or
docker-compose -f docker-compose-dev.yml run yarn dev:db:init
```

### Migrations

Run migrations with

```
$ yarn typeorm migration:run
```

Other noteworthy commands:

```
$ yarn typeorm migration:generate src/db/migrations/NameOfYourMig
$ yarn typeorm migration:create src/db/migrations/NameOfYourMig
$ yarn typeorm migration:revert
```

## Database schema

![Database schema](docs/schema.png)

## TODO

- Use DTO for service inputs and outputs
  - Add validation on body params using those DTOs (see: https://github.com/typestack/routing-controllers#auto-validating-action-params)
- Add a SessionController and allow the creation of jwt token using https://github.com/auth0/node-jsonwebtoken in exchange for a pwd
- Add tests
- Add a swagger for documentation
