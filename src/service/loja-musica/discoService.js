const db = require('../../../database/connection')

const criar = (dados) => {
    const { nome, data_lancamento, imagem, gravadora_id } = dados

    console.log('>>> lojaMusica:disco:criar >', dados)

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO disco (nome, data_lancamento, imagem, gravadora_id) 
             VALUES (?, ?, ?, ?)`,
            [nome, data_lancamento, imagem || null, gravadora_id],
            function (erro) {
                if (erro) {
                    console.error('Erro ao criar disco:', erro)
                    reject(erro)
                    return
                }

                console.log('Disco criado com ID:', this.lastID)

                db.get(
                    `SELECT d.*, g.nome as gravadora_nome
                     FROM disco d
                     LEFT JOIN gravadora g ON d.gravadora_id = g.gravadora_id
                     WHERE d.disco_id = ?`,
                    [this.lastID],
                    (erro, disco) => {
                        if (erro) {
                            console.error('Erro ao buscar disco criado:', erro)
                            reject(erro)
                        } else {
                            resolve(disco)
                        }
                    }
                )
            }
        )
    })
};

const listar = () => {
    console.log('>>> lojaMusica:disco:listar')

    return new Promise((resolve, reject) => {
        db.all(
            `SELECT d.*, g.nome as gravadora_nome
             FROM disco d
             LEFT JOIN gravadora g ON d.gravadora_id = g.gravadora_id
             ORDER BY d.nome`,
            [],
            (erro, discos) => {
                if (erro) {
                    console.error('Erro ao listar discos:', erro)
                    reject(erro)
                    return
                }

                console.log(`${discos.length} discos encontrados.`)
                resolve(discos)
            }
        )
    })
};

const buscar = (id) => {
    console.log('>>> lojaMusica:disco:buscar > ID:', id)

    return new Promise((resolve, reject) => {
        db.get(
            `SELECT d.*, g.nome as gravadora_nome
             FROM disco d
             LEFT JOIN gravadora g ON d.gravadora_id = g.gravadora_id
             WHERE d.disco_id = ?`,
            [id],
            (erro, disco) => {
                if (erro) {
                    console.error('Erro ao buscar disco:', erro)
                    reject(erro)
                    return
                }

                if (!disco) {
                    reject(new Error('Disco não encontrado'))
                    return
                }

                console.log('Disco encontrado:', disco)
                resolve(disco)
            }
        )
    })
};

const editar = (id, dados) => {
    const { nome, data_lancamento, imagem, gravadora_id } = dados

    console.log('>>> lojaMusica:disco:editar > ID:', id, dados)

    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE disco 
             SET nome = ?, data_lancamento = ?, imagem = ?, gravadora_id = ?
             WHERE disco_id = ?`,
            [nome, data_lancamento, imagem || null, gravadora_id, id],
            function (erro) {
                if (erro) {
                    console.error('Erro ao editar disco:', erro)
                    reject(erro)
                    return
                }

                if (this.changes === 0) {
                    reject(new Error('Disco não encontrado'))
                    return
                }

                db.get(
                    `SELECT d.*, g.nome as gravadora_nome
                     FROM disco d
                     LEFT JOIN gravadora g ON d.gravadora_id = g.gravadora_id
                     WHERE d.disco_id = ?`,
                    [id],
                    (erro, disco) => {
                        if (erro) {
                            console.error('Erro ao buscar disco atualizado:', erro)
                            reject(erro)
                            return
                        }

                        console.log('Disco atualizado com sucesso')
                        resolve(disco)
                    }
                )
            }
        )
    })
};

const deletar = (id) => {
    console.log('>>> lojaMusica:disco:deletar > ID:', id)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT COUNT(*) as total FROM musica_disco WHERE disco_id = ?',
            [id],
            (erro, result) => {
                if (erro) {
                    reject(erro)
                    return
                }

                if (result.total > 0) {
                    reject(new Error('Existem músicas associadas a este disco'))
                    return
                }

                db.run('DELETE FROM disco WHERE disco_id = ?', [id], function (erro) {
                    if (erro) {
                        reject(erro)
                        return
                    }

                    if (this.changes === 0) {
                        reject(new Error('Disco não encontrado'))
                        return
                    }

                    console.log('Disco deletado com sucesso!')

                    resetarSequencia()
                        .then(() => resolve({ mensagem: 'Disco deletado com sucesso!' }))
                        .catch(reject)
                })
            }
        )
    })
};

const resetarSequencia = () => {
    return new Promise((resolve, reject) => {
        // verifica se a tabela está vazia
        db.get('SELECT COUNT(*) as total FROM disco', [], (erro, result) => {
            if (erro) {
                reject(erro)
                return
            }

            // se estiver vazia, reseta a sequência
            if (result.total === 0) {
                db.run('DELETE FROM sqlite_sequence WHERE name="disco"', [], (erro) => {
                    if (erro && !erro.message.includes('no such table')) {
                        reject(erro)
                        return
                    }
                    resolve()
                })
            } else {
                resolve()
            }
        })
    })
};

const buscarPorNome = (nome) => {
    console.log('>>> lojaMusica:disco:buscarPorNome >', nome)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM disco WHERE LOWER(nome) = LOWER(?)',
            [nome],
            (erro, disco) => {
                if (erro) {
                    console.error('Erro ao buscar disco por nome:', erro)
                    reject(erro)
                    return
                }
                resolve(disco)
            }
        )
    })
};

const buscarPorNomeEInterpretes = (nome, interpreteIds) => {
    console.log('>>> lojaMusica:disco:buscarPorNomeEInterpretes >', nome, interpreteIds)

    return new Promise((resolve, reject) => {

        db.all(
            `SELECT d.* 
             FROM disco d
             WHERE LOWER(d.nome) = LOWER(?)`,
            [nome],
            (erro, discos) => {
                if (erro) {
                    console.error('Erro ao buscar discos por nome:', erro)
                    reject(erro)
                    return
                }

                if (!discos || discos.length === 0) {
                    resolve(null)
                    return
                }

                let discosEncontrados = []
                let processados = 0

                if (discos.length === 0) {
                    resolve(null)
                    return
                }

                discos.forEach(disco => {
                    db.all(
                        `SELECT DISTINCT i.artista_id
                         FROM musica_disco md
                         INNER JOIN musica m ON md.musica_id = m.musica_id
                         INNER JOIN interprete i ON m.musica_id = i.musica_id
                         WHERE md.disco_id = ?`,
                        [disco.disco_id],
                        (erro, interpretes) => {
                            if (erro) {
                                console.error('Erro ao buscar intérpretes do disco:', erro)
                                reject(erro)
                                return
                            }

                            const interpretesIds = interpretes.map(i => i.artista_id)

                            // verifica se os intérpretes do disco correspondem aos fornecidos
                            // todos os intérpretes fornecidos devem estar no disco
                            const match = interpreteIds.every(id => interpretesIds.includes(id))

                            if (match) {
                                discosEncontrados.push(disco)
                            }

                            processados++
                            if (processados === discos.length) {
                                resolve(discosEncontrados.length > 0 ? discosEncontrados[0] : null)
                            }
                        }
                    )
                })
            }
        )
    })
};

const getInterpretesDoDisco = (discoId) => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT a.* 
             FROM artista a
             INNER JOIN interprete_disco id ON a.artista_id = id.artista_id
             WHERE id.disco_id = ?
             ORDER BY a.nome`,
            [discoId],
            (erro, interpretes) => {
                if (erro) {
                    console.error('Erro ao buscar intérpretes do disco:', erro)
                    reject(erro)
                    return
                }
                resolve(interpretes)
            }
        )
    })
};

const musicas = {
    
    listar: (discoId) => {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT m.*, e.descricao as estilo_nome, md.ordem
             FROM musica m
             INNER JOIN musica_disco md ON m.musica_id = md.musica_id
             LEFT JOIN estilo e ON m.estilo_id = e.estilo_id
             WHERE md.disco_id = ?
             ORDER BY md.ordem ASC, m.nome`,
                [discoId],
                (erro, musicas) => {
                    if (erro) {
                        console.error('Erro ao listar músicas do disco:', erro)
                        reject(erro)
                        return
                    }
                    resolve(musicas)
                }
            )
        })
    },

    // discoService.js - método adicionar (CORRIGIDO)
    adicionar: (discoId, musicaId, ordem) => {
        console.log('>>> adicionar música ao disco:', { discoId, musicaId, ordem })
    
        return new Promise((resolve, reject) => {
            if (!discoId || !musicaId || ordem === undefined || ordem === null) {
                console.error('Parâmetros inválidos:', { discoId, musicaId, ordem })
                reject(new Error('Parâmetros inválidos para adicionar música'))
                return
            }

            const ordemInt = parseInt(ordem)
            if (isNaN(ordemInt)) {
                reject(new Error('Ordem deve ser um número válido'))
                return
            }

            db.get(
                'SELECT * FROM musica_disco WHERE disco_id = ? AND ordem = ?',
                [discoId, ordemInt],
                (erro, resultado) => {
                    if (erro) {
                        console.error('Erro ao verificar ordem:', erro)
                        reject(erro)
                        return
                    }

                    if (resultado) {
                        reject(new Error(`Já existe uma música na ordem ${ordemInt}`))
                        return
                    }

                    db.run(
                        'INSERT INTO musica_disco (disco_id, musica_id, ordem) VALUES (?, ?, ?)',
                        [discoId, musicaId, ordemInt],  // <- AGORA PASSA OS 3!
                        function (erro) {
                            if (erro) {
                                console.error('Erro ao adicionar música:', erro)
                                reject(erro)
                                return
                            }

                            console.log('Música adicionada com sucesso! ID da inserção:', this.lastID)
                        
                            db.get(
                                'SELECT * FROM musica_disco WHERE disco_id = ? AND musica_id = ?',
                                [discoId, musicaId],
                                (erro, resultado) => {
                                    if (erro) {
                                        console.error('Erro ao buscar registro inserido:', erro)
                                    } else {
                                        console.log('Registro inserido:', resultado)
                                    }
                                    resolve({ 
                                        mensagem: 'Música adicionada ao disco com sucesso!',
                                        dados: resultado 
                                    })
                                }
                            )
                        }
                    )
                }
            )
        })
    },

    remover: (discoId, musicaId) => {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM musica_disco WHERE disco_id = ? AND musica_id = ?',
                [discoId, musicaId],
                function (erro) {
                    if (erro) {
                        console.error('Erro ao remover música do disco:', erro)
                        reject(erro)
                        return
                    }
                    resolve({ mensagem: 'Música removida do disco com sucesso!' })
                }
            )
        })
    },

    verificar: (discoId, musicaId) => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM musica_disco WHERE disco_id = ? AND musica_id = ?',
                [discoId, musicaId],
                (erro, resultado) => {
                    if (erro) {
                        console.error('Erro ao verificar música no disco:', erro)
                        reject(erro)
                        return
                    }
                    resolve(!!resultado)
                }
            )
        })
    }
};

module.exports = {
    criar,
    listar,
    editar,
    deletar,
    buscar,
    buscarPorNome,
    buscarPorNomeEInterpretes,
    getInterpretesDoDisco,
    musicas
}