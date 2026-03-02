const db = require('../../../database/connection')

const criar = (dados) => {
    const { nome, duracao, data_lancamento, estilo_id } = dados

    // Garantir que a data está no formato correto (YYYY-MM-DD)
    let dataFormatada = data_lancamento
    if (data_lancamento && data_lancamento.includes('T')) {
        dataFormatada = data_lancamento.split('T')[0]
    }

    return new Promise((resolve, reject) => {
        db.run (
            'INSERT INTO musica (nome, duracao, data_lancamento, estilo_id) VALUES (?, ?, ?, ?)',
            [nome, duracao, dataFormatada, estilo_id],
            function(erro) {
                if(erro) {
                    console.error('Erro ao criar música: ', erro)
                    reject(erro)
                    return
                }

                console.log('Música criada com ID: ', this.lastID)

                db.get(
                    `SELECT m.*, e.descricao as estilo_nome
                    FROM musica m
                    INNER JOIN estilo e ON m.estilo_id = e.estilo_id
                    WHERE m.musica_id = ?`,
                    [this.lastID],
                    (erro, musica) => {
                        if (erro) {
                            console.error('Erro ao buscar música criada: ', erro)
                            reject(erro)
                        } else {
                            resolve(musica)
                        }
                    }
                )
            }
        )
    })
};

const listar = () => {
    console.log('>>> lojaMusica:musica:listar')

    return new Promise((resolve, reject) => {
        db.all(
            `SELECT m.*, e.descricao as estilo_nome
            FROM musica m
            INNER JOIN estilo e ON m.estilo_id = e.estilo_id
            ORDER BY m.nome`,
            [],
            (erro, musicas) => {
                if(erro) {
                    console.error('Erro ao listar músicas: ', erro)
                    reject(erro)
                } else {
                    console.log(`${musicas.length} músicas encontradas.`)
                    resolve(musicas)
                }
            }
        )
    })
};

const editar = (id, dados) => {
    const { nome, duracao, data_lancamento, estilo_id } = dados;

    let dataFormatada = data_lancamento
    if (data_lancamento && data_lancamento.includes('T')) {
        dataFormatada = data_lancamento.split('T')[0]
    }

    console.log('>>> lojaMusica:musica:editar > ID', id, dados)

    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE musica SET nome = ?, duracao = ?, data_lancamento = ?, estilo_id = ? WHERE musica_id = ?',
            [nome, duracao, dataFormatada, estilo_id, id],
            function(erro) {
                if(erro) {
                    console.error('Erro ao editar música: ', erro)
                    reject(erro)
                    return
                }

                if(this.changes === 0) {
                    reject(new Error('Música não encontrada'))
                    return
                }

                db.get(
                    `SELECT m.*, e.descricao as estilo_nome
                    FROM musica m
                    INNER JOIN estilo e ON m.estilo_id = e.estilo_id
                    WHERE m.musica_id = ?`,
                    [id],
                    (erro, musica) => {
                        if (erro) {
                            console.error('Erro ao buscar música atualizada: ', erro)
                            reject(erro)
                            return
                        }

                        console.log('Música atualizada com sucesso')
                        resolve(musica)
                    }
                )
            }
        )
    })
};

const deletar = (id) => {
    console.log('>>> lojaMusica:musica:deletar > ID: ', id)

    return new Promise((resolve, reject) => {
        db.get(
            `SELECT
            (SELECT COUNT(*) FROM interprete WHERE musica_id = ?) as total_interprete,
            (SELECT COUNT(*) FROM compositor WHERE musica_id = ?) as total_compositor,
            (SELECT COUNT(*) FROM musica_disco WHERE musica_id = ?) as total_disco`,
            [id, id, id],
            (erro, assoc) => {
                if (erro) {
                    reject(erro)
                    return
                }

                if(assoc.total_interprete > 0 || assoc.total_compositor > 0 || assoc.total_disco > 0){
                    reject(new Error('Existem intérpretes, compositores ou discos associados a esta música'))
                    return
                }

                db.run('DELETE FROM musica WHERE musica_id = ?',
                    [id],
                    function(erro) {
                        if(erro) {
                            reject(erro)
                            return
                        }

                        if (this.changes === 0){
                            reject(new Error('Música não encontrada'))
                            return
                        }

                        console.log('Música deletada com sucesso!')
                        resolve({mensagem: 'Música deletada com sucesso!'})
                    }
                )
            }
        )       
    })
};

const buscar = (id) => {
    console.log('>>> lojaMusica:musica:buscar > ID: ', id)

    return new Promise((resolve, reject) => {
        db.get(
            `SELECT m.*, e.descricao as estilo_nome  // Corrigido: desricao -> descricao
            FROM musica m
            INNER JOIN estilo e ON m.estilo_id = e.estilo_id
            WHERE m.musica_id = ?`,
            [id], 
            (erro, musica) => {
                if(erro) {
                    console.error('Erro ao buscar música', erro)
                    reject(erro)
                    return
                }

                if(!musica) {
                    reject(new Error('Música não encontrada!'))
                    return
                }

                console.log('Música encontrada: ', musica)
                resolve(musica)
            }
        )
    })   
};

const buscarInterpretes = (musicaId) => {
    console.log('>>> lojaMusica:musica:buscarInterpretes > ID:', musicaId)

    return new Promise((resolve, reject) => {
        db.all(
            `SELECT a.* 
             FROM artista a
             INNER JOIN interprete i ON a.artista_id = i.artista_id
             WHERE i.musica_id = ?
             ORDER BY a.nome`,
            [musicaId],
            (erro, interpretes) => {
                if (erro) {
                    console.error('Erro ao buscar intérpretes da música:', erro)
                    reject(erro)
                    return
                }
                resolve(interpretes)
            }
        )
    })
}

module.exports = {
    criar,
    listar,
    editar,
    deletar,
    buscar,
    buscarInterpretes
}