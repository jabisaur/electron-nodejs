CREATE DATABASE loja_musica_db;
USE loja_musica_db;

-- DDL
CREATE TABLE IF NOT EXISTS artista(
    artista_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS estilo(
    estilo_id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL

);

CREATE TABLE IF NOT EXISTS gravadora(
    gravadora_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL

);

CREATE TABLE IF NOT EXISTS musica(
    musica_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    duracao VARCHAR(255) NOT NULL,
    data_lancamento DATE NOT NULL,
    estilo_id INT NOT NULL

    -- regra de chave estrangeira
    FOREIGN KEY (estilo_id) REFERENCES estilo (estilo_id)

);

CREATE TABLE IF NOT EXISTS disco(
    disco_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_lancamento DATE NOT NULL,
    imagem TEXT,
    gravadora_id INT,

    -- regra de chave estrangeira
    FOREIGN KEY (gravadora_id) REFERENCES gravadora (gravadora_id)

);

CREATE TABLE IF NOT EXISTS musica_disco(
    musica_id INT NOT NULL,
    disco_id INT NOT NULL,

    -- regra de chave estrangeira
    FOREIGN KEY (musica_id) REFERENCES musica (musica_id),
    FOREIGN KEY (disco_id) REFERENCES disco (disco_id),

    -- regra de chave primaria composta
    PRIMARY KEY (musica_id, disco_id)

);

CREATE TABLE IF NOT EXISTS compositor(
    musica_id INT NOT NULL,
    artista_id INT NOT NULL,

    -- regra de chave estrangeira
    FOREIGN KEY (musica_id) REFERENCES musica (musica_id),
    FOREIGN KEY (artista_id) REFERENCES artista (artista_id),

    -- regra de chave primaria composta
    PRIMARY KEY (musica_id, artista_id)

);

CREATE TABLE IF NOT EXISTS interprete(
    musica_id INT NOT NULL,
    artista_id INT NOT NULL,

    -- regra de chave estrangeira
    FOREIGN KEY (musica_id) REFERENCES musica (musica_id),
    FOREIGN KEY (artista_id) REFERENCES artista (artista_id),

    -- regra de chave primaria composta
    PRIMARY KEY (musica_id, artista_id)

);

INSERT INTO artista(nome) VALUES 
('Ney Mato Grosso'), ('Chico Buarque'), ('Linkin Park');

INSERT INTO estilo(descricao) VALUES 
('MPB'), ('Rock'), ('Eletrônica');

INSERT INTO musica (nome, duracao, data_lancamento, estilo_id) VALUES 
('Faint', '2:42', '2003-03-25' (SELECT estilo_id FROM estilo WHERE descricao = 'Rock')),
('Numb', '3:07', '2003-03-25' (SELECT estilo_id FROM estilo WHERE descricao = 'Rock'));

INSERT INTO disco (nome, data_lancamento) VALUES 
('Meteora', '2003-03-25');

INSERT INTO musica_disco (musica_id, disco_id) VALUES (
    (SELECT musica_id FROM musica WHERE nome = 'Cálice'),
    (SELECT disco_id FROM disco WHERE nome = 'Chico Buarque')
);

SELECT * FROM musica_disco md 
INNER JOIN musica m ON m.musica_id = md.musica_id
INNER JOIN disco d ON d.disco_id = md.disco_id;

-- Inserir os artistas
INSERT INTO artista (nome) VALUES 
('Against The Current'),
('Charlie Brown Jr.'),
('Dreamcatcher');

-- Inserir estilos musicais (usando 'descricao' como atributo)
INSERT INTO estilo (descricao) VALUES 
('Pop Rock'),
('Rock Alternativo'),
('Pop'),
('Rap Rock'),
('Nu Metal'),
('K-Pop'),
('Rock'),
('Rock Coreano');

-- Inserir gravadoras
INSERT INTO gravadora (nome) VALUES 
('Fueled By Ramen'),
('Virgin Records'),
('Sony Music'),
('Happy Face Entertainment'),
('Dreamcatcher Company');

-- ÁLBUM 1: Against The Current - "Past Lives"
-- Inserir o álbum
INSERT INTO disco (nome, data_lancamento, gravadora_id) VALUES 
('Past Lives', '2018-09-28', (SELECT gravadora_id FROM gravadora WHERE nome = 'Fueled By Ramen'));

-- Inserir músicas do álbum Past Lives
INSERT INTO musica (nome, duracao, data_lancamento, estilo_id) VALUES 
('Strangers Again', '3:19', '2018-06-01', (SELECT estilo_id FROM estilo WHERE descricao = 'Pop Rock')),
('The Fuss', '3:17', '2018-06-08', (SELECT estilo_id FROM estilo WHERE descricao = 'Pop Rock')),
('I Like The Way', '3:12', '2018-06-15', (SELECT estilo_id FROM estilo WHERE descricao = 'Pop Rock')),
('Personal', '3:22', '2018-07-13', (SELECT estilo_id FROM estilo WHERE descricao = 'Pop Rock')),
('Voices', '3:42', '2018-08-03', (SELECT estilo_id FROM estilo WHERE descricao = 'Rock Alternativo')),
('Almost Forgot', '3:38', '2018-08-24', (SELECT estilo_id FROM estilo WHERE descricao = 'Pop')),
('P.A.T.T.', '3:07', '2018-09-07', (SELECT estilo_id FROM estilo WHERE descricao = 'Pop Rock')),
('Scream', '3:12', '2018-09-14', (SELECT estilo_id FROM estilo WHERE descricao = 'Rock Alternativo'));

-- Relacionar músicas com o álbum
INSERT INTO musica_disco (musica_id, disco_id) 
SELECT m.musica_id, d.disco_id 
FROM musica m, disco d 
WHERE d.nome = 'Past Lives' 
AND m.nome IN ('Strangers Again', 'The Fuss', 'I Like The Way', 'Personal', 'Voices', 'Almost Forgot', 'P.A.T.T.', 'Scream');

-- Relacionar artista como intérprete
INSERT INTO interprete (musica_id, artista_id) 
SELECT m.musica_id, a.artista_id 
FROM musica m, artista a 
WHERE a.nome = 'Against The Current' 
AND m.nome IN ('Strangers Again', 'The Fuss', 'I Like The Way', 'Personal', 'Voices', 'Almost Forgot', 'P.A.T.T.', 'Scream');

-- Relacionar artista como compositor (assumindo que a banda compõe suas músicas)
INSERT INTO compositor (musica_id, artista_id) 
SELECT m.musica_id, a.artista_id 
FROM musica m, artista a 
WHERE a.nome = 'Against The Current' 
AND m.nome IN ('Strangers Again', 'The Fuss', 'I Like The Way', 'Personal', 'Voices', 'Almost Forgot', 'P.A.T.T.', 'Scream');

-- ÁLBUM 2: Charlie Brown Jr. - "Acústico MTV"
-- Inserir o álbum
INSERT INTO disco (nome, data_lancamento, gravadora_id) VALUES 
('Acústico MTV: Charlie Brown Jr.', '2002-11-11', (SELECT gravadora_id FROM gravadora WHERE nome = 'Virgin Records'));

-- Inserir músicas do álbum Acústico MTV
INSERT INTO musica (nome, duracao, data_lancamento, estilo_id) VALUES 
('Proibida pra Mim (Grazon)', '3:35', '2002-11-11', (SELECT estilo_id FROM estilo WHERE descricao = 'Rap Rock')),
('Só por uma Noite', '3:45', '2002-11-11', (SELECT estilo_id FROM estilo WHERE descricao = 'Rap Rock')),
('Lugar ao Sol', '4:07', '2002-11-11', (SELECT estilo_id FROM estilo WHERE descricao = 'Rap Rock')),
('Hoje Eu Acordei Feliz', '3:12', '2002-11-11', (SELECT estilo_id FROM estilo WHERE descricao = 'Rap Rock')),
('Confisco', '3:28', '2002-11-11', (SELECT estilo_id FROM estilo WHERE descricao = 'Rap Rock')),
('Tudo que ela Gosta de Escutar', '3:15', '2002-11-11', (SELECT estilo_id FROM estilo WHERE descricao = 'Rap Rock')),
('Papelão', '3:42', '2002-11-11', (SELECT estilo_id FROM estilo WHERE descricao = 'Rap Rock')),
('Só os Loucos Sabem', '3:51', '2002-11-11', (SELECT estilo_id FROM estilo WHERE descricao = 'Rap Rock')),
('Zóio de Lula', '3:24', '2002-11-11', (SELECT estilo_id FROM estilo WHERE descricao = 'Nu Metal'));

-- Relacionar músicas com o álbum
INSERT INTO musica_disco (musica_id, disco_id) 
SELECT m.musica_id, d.disco_id 
FROM musica m, disco d 
WHERE d.nome = 'Acústico MTV: Charlie Brown Jr.' 
AND m.nome IN ('Proibida pra Mim (Grazon)', 'Só por uma Noite', 'Lugar ao Sol', 'Hoje Eu Acordei Feliz', 'Confisco', 'Tudo que ela Gosta de Escutar', 'Papelão', 'Só os Loucos Sabem', 'Zóio de Lula');

-- Relacionar artista como intérprete
INSERT INTO interprete (musica_id, artista_id) 
SELECT m.musica_id, a.artista_id 
FROM musica m, artista a 
WHERE a.nome = 'Charlie Brown Jr.' 
AND m.nome IN ('Proibida pra Mim (Grazon)', 'Só por uma Noite', 'Lugar ao Sol', 'Hoje Eu Acordei Feliz', 'Confisco', 'Tudo que ela Gosta de Escutar', 'Papelão', 'Só os Loucos Sabem', 'Zóio de Lula');

-- Relacionar artista como compositor
INSERT INTO compositor (musica_id, artista_id) 
SELECT m.musica_id, a.artista_id 
FROM musica m, artista a 
WHERE a.nome = 'Charlie Brown Jr.' 
AND m.nome IN ('Proibida pra Mim (Grazon)', 'Só por uma Noite', 'Lugar ao Sol', 'Hoje Eu Acordei Feliz', 'Confisco', 'Tudo que ela Gosta de Escutar', 'Papelão', 'Só os Loucos Sabem', 'Zóio de Lula');

-- ÁLBUM 3: Dreamcatcher - "Dystopia: The Tree of Language"
-- Inserir o álbum
INSERT INTO disco (nome, data_lancamento, gravadora_id) VALUES 
('Dystopia: The Tree of Language', '2020-02-18', (SELECT gravadora_id FROM gravadora WHERE nome = 'Dreamcatcher Company'));

-- Inserir músicas do álbum
INSERT INTO musica (nome, duracao, data_lancamento, estilo_id) VALUES 
('Scream', '3:24', '2020-02-18', (SELECT estilo_id FROM estilo WHERE descricao = 'K-Pop')),
('Tension', '3:11', '2020-02-18', (SELECT estilo_id FROM estilo WHERE descricao = 'Rock Coreano')),
('Red Sun', '3:05', '2020-02-18', (SELECT estilo_id FROM estilo WHERE descricao = 'K-Pop')),
('Black or White', '3:24', '2020-02-18', (SELECT estilo_id FROM estilo WHERE descricao = 'Rock Coreano')),
('Jazz Bar', '3:34', '2020-02-18', (SELECT estilo_id FROM estilo WHERE descricao = 'K-Pop')),
('SAHARA', '3:11', '2020-02-18', (SELECT estilo_id FROM estilo WHERE descricao = 'Rock')),
('In The Frozen', '3:31', '2020-02-18', (SELECT estilo_id FROM estilo WHERE descricao = 'Rock Coreano')),
('Daybreak', '3:07', '2020-02-18', (SELECT estilo_id FROM estilo WHERE descricao = 'K-Pop')),
('Full Moon', '3:09', '2020-02-18', (SELECT estilo_id FROM estilo WHERE descricao = 'Rock Coreano')),
('Over the Sky', '3:18', '2020-02-18', (SELECT estilo_id FROM estilo WHERE descricao = 'K-Pop'));

-- Relacionar músicas com o álbum
INSERT INTO musica_disco (musica_id, disco_id) 
SELECT m.musica_id, d.disco_id 
FROM musica m, disco d 
WHERE d.nome = 'Dystopia: The Tree of Language' 
AND m.nome IN ('Scream', 'Tension', 'Red Sun', 'Black or White', 'Jazz Bar', 'SAHARA', 'In The Frozen', 'Daybreak', 'Full Moon', 'Over the Sky');

-- Relacionar artista como intérprete
INSERT INTO interprete (musica_id, artista_id) 
SELECT m.musica_id, a.artista_id 
FROM musica m, artista a 
WHERE a.nome = 'Dreamcatcher' 
AND m.nome IN ('Scream', 'Tension', 'Red Sun', 'Black or White', 'Jazz Bar', 'SAHARA', 'In The Frozen', 'Daybreak', 'Full Moon', 'Over the Sky');

-- Relacionar artista como compositor
INSERT INTO compositor (musica_id, artista_id) 
SELECT m.musica_id, a.artista_id 
FROM musica m, artista a 
WHERE a.nome = 'Dreamcatcher' 
AND m.nome IN ('Scream', 'Tension', 'Red Sun', 'Black or White', 'Jazz Bar', 'SAHARA', 'In The Frozen', 'Daybreak', 'Full Moon', 'Over the Sky');

-- CONSULTAS PARA VERIFICAR OS DADOS
-- Consulta 1: Verificar quantas músicas cada álbum tem
SELECT 
    d.nome AS 'Álbum',
    a.nome AS 'Artista',
    COUNT(md.musica_id) AS 'Número de Músicas'
FROM disco d
INNER JOIN musica_disco md ON d.disco_id = md.disco_id
INNER JOIN interprete i ON md.musica_id = i.musica_id
INNER JOIN artista a ON i.artista_id = a.artista_id
WHERE d.nome IN ('Past Lives', 'Acústico MTV: Charlie Brown Jr.', 'Dystopia: The Tree of Language')
GROUP BY d.disco_id, a.artista_id
ORDER BY d.nome;

-- Consulta 2: Ver todas as músicas de cada álbum com detalhes
SELECT 
    d.nome AS 'Álbum',
    m.nome AS 'Música',
    m.duracao AS 'Duração',
    m.data_lancamento AS 'Data Lançamento',
    e.descricao AS 'Estilo',
    a.nome AS 'Artista Intérprete'
FROM disco d
INNER JOIN musica_disco md ON d.disco_id = md.disco_id
INNER JOIN musica m ON md.musica_id = m.musica_id
INNER JOIN estilo e ON m.estilo_id = e.estilo_id
INNER JOIN interprete i ON m.musica_id = i.musica_id
INNER JOIN artista a ON i.artista_id = a.artista_id
WHERE d.nome IN ('Past Lives', 'Acústico MTV: Charlie Brown Jr.', 'Dystopia: The Tree of Language')
ORDER BY d.nome, m.nome;

-- Consulta 3: Ver quais artistas são compositores
SELECT DISTINCT
    a.nome AS 'Artista Compositor'
FROM compositor c
INNER JOIN artista a ON c.artista_id = a.artista_id
WHERE a.nome IN ('Against The Current', 'Charlie Brown Jr.', 'Dreamcatcher');

-- Consulta 4: Resumo completo dos álbuns inseridos
SELECT 
    d.nome AS 'Álbum',
    a.nome AS 'Artista',
    g.nome AS 'Gravadora',
    d.data_lancamento AS 'Data Lançamento Álbum',
    COUNT(DISTINCT md.musica_id) AS 'Total de Músicas'
FROM disco d
INNER JOIN gravadora g ON d.gravadora_id = g.gravadora_id
INNER JOIN musica_disco md ON d.disco_id = md.disco_id
INNER JOIN interprete i ON md.musica_id = i.musica_id
INNER JOIN artista a ON i.artista_id = a.artista_id
WHERE d.nome IN ('Past Lives', 'Acústico MTV: Charlie Brown Jr.', 'Dystopia: The Tree of Language')
GROUP BY d.disco_id, g.gravadora_id, a.artista_id;

CREATE OR REPLACE VIEW vw_artista_disco_musica AS  ();
