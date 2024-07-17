# Diarize

Made using [gabriel-dehan/ts-typeorm-koa-boilerplate](https://github.com/gabriel-dehan/ts-typeorm-koa-boilerplate)

- [Diarize](#diarize)
  - [Demo](#demo)
  - [How it works](#how-it-works)
    - [Improvement avenues](#improvement-avenues)
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

## Demo

[Check the youtube video demo](https://www.youtube.com/watch?v=uTHZmDGUQ7c)

## How it works

- User enters a youtube URL in the form
- In a background job Youtube video is downloaded using `ytdl-core` and written to the disk, see [video-download.worker.ts](https://github.com/gabriel-dehan/pyannote-checker/blob/main/src/jobs/workers/video-download.worker.ts)
- A second job in  the pipeline takes the video and passes it through `ffmpeg` to extract a `.wav` sound track that is uploaded to S3, see [audio-extraction.worker.ts](https://github.com/gabriel-dehan/pyannote-checker/blob/main/src/jobs/workers/audio-extraction.worker.ts)
- A third job calls the Youtube API to retrieve the caption in XML format and then normalises it to a segmented JSON file, see [captions-extraction.worker.ts](https://github.com/gabriel-dehan/pyannote-checker/blob/main/src/jobs/workers/captions-extraction.worker.ts)
- A final job takes the S3 uploaded `.wav` file and sends it to the PyannoteAPI for processing, see [diarization.worker.ts](https://github.com/gabriel-dehan/pyannote-checker/blob/main/src/jobs/workers/diarization.worker.ts)
- The PyannoteAPI calls the webhook defined in [diarize.controller.ts](https://github.com/gabriel-dehan/pyannote-checker/blob/main/src/controllers/diarize.controller.ts) and the resulting JSON file is written to disk.

The front-end just reads the disk and the database to display an interface where you can watch the youtube video with the diarized captions.

### Improvement avenues

- For now everything uses the disk, I wanted to try a DB-less approach for the sake of simplicity. In the real world, I would probably use S3 and lambdas to handle most of the pipeline:
  - A first lambda would download the youtube video by streaming it and piping the chunks directly into S3 to avoid writing on the lambda's ephemeral and limited file system
  - Then the lambda would call the audio extraction lambda which would use ffmpeg the same way and store the data directly on S3
  - The rest would probably be pretty much the same except uploaded to S3 instead of written to disk.

- The diarization is fast so when you are on the loading page, it would be nice  to have a WS opened so when the webhook is called the page is reloaded directly for the client so they don't have to reload themselves.

- Adding transcription through Whisper API to compare with the captions from Youtube.
- Adding persistence for the diarized speaker aliases
- Generate a final downloadable file with speaker + text embedded.

## Run

```
$ yarn dev
```

Or just run the docker-compose like indicated in the setup below if you want to use docker

```
$ docker-compose up
```

Note that this will run `yarn dev` but also run processes for the DB and background jobs.
If you want to go barebone check [Barebone Setup](#barebone-setup)

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
