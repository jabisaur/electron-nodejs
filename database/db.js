const db = require('./connection')

db.run(`
    CREATE TABLE IF NOT EXISTS artista (
    artista_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL
    );
`);

db.run(`
    CREATE TABLE IF NOT EXISTS estilo(
    estilo_id INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao VARCHAR(255) NOT NULL

);
    
`)

db.run(`
    CREATE TABLE IF NOT EXISTS gravadora(
    gravadora_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL

);
    
`)

db.run(`
    CREATE TABLE IF NOT EXISTS musica(
    musica_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    duracao VARCHAR(255) NOT NULL,
    data_lancamento DATE NOT NULL,
    estilo_id INT NOT NULL,

    -- regra de chave estrangeira
    FOREIGN KEY (estilo_id) REFERENCES estilo (estilo_id)

);
    
`)

db.run(`
    CREATE TABLE IF NOT EXISTS disco(
    disco_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    data_lancamento DATE NOT NULL,
    imagem TEXT,
    gravadora_id INT,
    interprete_principal_id INT

    -- regra de chave estrangeira
    FOREIGN KEY (gravadora_id) REFERENCES gravadora (gravadora_id),
    FOREIGN KEY (interprete_principal_id) REFERENCES artista (artista_id)

);
    
`)

db.run(`
    CREATE TABLE IF NOT EXISTS musica_disco(
    musica_id INTEGER NOT NULL,
    disco_id INTEGER NOT NULL,
    ordem INTEGER,

    -- regra de chave estrangeira
    FOREIGN KEY (musica_id) REFERENCES musica (musica_id) ON DELETE CASCADE,
    FOREIGN KEY (disco_id) REFERENCES disco (disco_id) ON DELETE CASCADE,

    -- regra de chave primaria composta
    PRIMARY KEY (musica_id, disco_id)

);
    
`)

db.run(`
    CREATE TABLE IF NOT EXISTS compositor(
    musica_id INTEGER NOT NULL,
    artista_id INTEGER NOT NULL,

    -- regra de chave estrangeira
    FOREIGN KEY (musica_id) REFERENCES musica (musica_id),
    FOREIGN KEY (artista_id) REFERENCES artista (artista_id),

    -- regra de chave primaria composta
    PRIMARY KEY (musica_id, artista_id)

);
    
`)

db.run(`
    CREATE TABLE IF NOT EXISTS interprete(
    musica_id INTEGER NOT NULL,
    artista_id INTEGER NOT NULL,

    -- regra de chave estrangeira
    FOREIGN KEY (musica_id) REFERENCES musica (musica_id),
    FOREIGN KEY (artista_id) REFERENCES artista (artista_id),

    -- regra de chave primaria composta
    PRIMARY KEY (musica_id, artista_id)

);
    
`)

db.run(`
    CREATE TABLE IF NOT EXISTS interprete_disco(
    disco_id INTEGER NOT NULL,
    artista_id INTEGER NOT NULL,
    
    -- regra de chave estrangeira
    FOREIGN KEY (disco_id) REFERENCES disco (disco_id) ON DELETE CASCADE,
    FOREIGN KEY (artista_id) REFERENCES artista (artista_id) ON DELETE CASCADE,
    
    -- regra de chave primaria composta
    PRIMARY KEY (disco_id, artista_id)

);

`)