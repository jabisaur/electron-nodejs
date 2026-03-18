const db = require('../../../database/connection')

const criar = (dados) => {
    const { nome, data_lancamento, imagem, gravadora_id, interprete_id } = dados;

    return new Promise((resolve, reject) => {
        db.get(
            `SELECT disco_id FROM disco 
             WHERE LOWER(nome) = LOWER(?) AND interprete_principal_id = ?`,
            [nome, interprete_id],
            (erroBusca, discoExistente) => {
                if (erroBusca) {
                    console.error('Erro ao verificar existência do disco:', erroBusca);
                    return reject(erroBusca);
                }

                if (discoExistente) {
                    return reject(new Error('Já existe um disco com esse nome cadastrado para este intérprete principal.'));
                }

                db.run(
                    `INSERT INTO disco (nome, data_lancamento, imagem, gravadora_id, interprete_principal_id)
                     VALUES (?, ?, ?, ?, ?)`,
                    [nome, data_lancamento, imagem || null, gravadora_id, interprete_id],
                    function (erroInsert) {
                        if (erroInsert) {
                            console.error('Erro ao inserir disco:', erroInsert);
                            return reject(erroInsert);
                        }

                        resolve({ id: this.lastID, mensagem: 'Disco criado com sucesso!' });
                    }
                );
            }
        );
    });
};

const listar = (pagina = 1, itensPorPagina = 10, filtros = {}) => {
    const limite = parseInt(itensPorPagina, 10);
    const offset = (parseInt(pagina, 10) - 1) * limite;
    const params = [];
    
    let sql = `
        SELECT d.*, g.nome as gravadora_nome
        FROM disco d
        LEFT JOIN gravadora g ON d.gravadora_id = g.gravadora_id
        WHERE 1=1
    `;

    if (filtros.nome) {
        sql += ` AND d.nome LIKE ?`;
        params.push(`%${filtros.nome}%`);
    }
    if (filtros.gravadora_id) {
        sql += ` AND d.gravadora_id = ?`;
        params.push(filtros.gravadora_id);
    }
    if (filtros.ano) {
        sql += ` AND strftime('%Y', d.data_lancamento) = ?`;
        params.push(filtros.ano.toString());
    }

    sql += ` ORDER BY d.nome LIMIT ? OFFSET ?`;
    params.push(limite, offset);

    return new Promise((resolve, reject) => {
        db.all(sql, params, (erro, discos) => {
            if (erro) reject(erro);
            else resolve(discos);
        });
    });
};

const contarTotal = (filtros = {}) => {
    let sql = `SELECT COUNT(*) as total FROM disco d WHERE 1=1`;
    const params = [];

    if (filtros.nome) {
        sql += ` AND d.nome LIKE ?`;
        params.push(`%${filtros.nome}%`);
    }
    if (filtros.gravadora_id) {
        sql += ` AND d.gravadora_id = ?`;
        params.push(filtros.gravadora_id);
    }
    if (filtros.ano) {
        sql += ` AND strftime('%Y', d.data_lancamento) = ?`;
        params.push(filtros.ano.toString());
    }

    return new Promise((resolve, reject) => {
        db.get(sql, params, (erro, row) => {
            if (erro) reject(erro);
            else resolve(row ? row.total : 0);
        });
    });
};

const listarAnos = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT DISTINCT strftime('%Y', data_lancamento) as ano FROM disco WHERE data_lancamento IS NOT NULL ORDER BY ano DESC`, [], (erro, anos) => {
            if (erro) reject(erro);
            else resolve(anos.map(a => a.ano));
        });
    });
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
    const { nome, data_lancamento, imagem, gravadora_id, interprete_id } = dados

    console.log('>>> lojaMusica:disco:editar > ID:', id, dados)

    return new Promise((resolve, reject) => {
        db.get(
            `SELECT disco_id FROM disco 
             WHERE LOWER(nome) = LOWER(?) AND interprete_principal_id = ? AND disco_id != ?`,
            [nome, interprete_id, id],
            (erroBusca, discoExistente) => {
                if (erroBusca) {
                    console.error('Erro ao verificar duplicidade na edição do disco:', erroBusca)
                    return reject(erroBusca)
                }

                if (discoExistente) {
                    return reject(new Error('Já existe outro disco com esse nome para este intérprete principal.'));
                }

                db.run(
                    `UPDATE disco 
                     SET nome = ?, data_lancamento = ?, imagem = ?, gravadora_id = ?, interprete_principal_id = ?
                     WHERE disco_id = ?`,
                    [nome, data_lancamento, imagem || null, gravadora_id, interprete_id, id],
                    function (erroUpdate) {
                        if (erroUpdate) {
                            console.error('Erro ao editar disco:', erroUpdate)
                            return reject(erroUpdate)
                        }

                        if (this.changes === 0) {
                            return reject(new Error('Disco não encontrado'))
                        }

                        db.get(
                            `SELECT d.*, g.nome as gravadora_nome
                             FROM disco d
                             LEFT JOIN gravadora g ON d.gravadora_id = g.gravadora_id
                             WHERE d.disco_id = ?`,
                            [id],
                            (erroBuscaAtualizado, disco) => {
                                if (erroBuscaAtualizado) {
                                    console.error('Erro ao buscar disco atualizado:', erroBuscaAtualizado)
                                    return reject(erroBuscaAtualizado)
                                }

                                console.log('Disco atualizado com sucesso:', disco.nome)
                                resolve(disco)
                            }
                        )
                    }
                )
            }
        )
    })
};

const deletar = (id, force = false) => {
    console.log('>>> lojaMusica:disco:deletar > ID:', id, 'Force:', force)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT COUNT(*) as total FROM musica_disco WHERE disco_id = ?',
            [id],
            (erro, result) => {
                if (erro) {
                    console.error('Erro na consulta de musica_disco:', erro)
                    reject(erro)
                    return
                }

                console.log('Músicas associadas encontradas:', result ? result.total : 0)

                if (result && result.total > 0 && !force) {
                    reject(new Error('Existem músicas associadas a este disco'))
                    return
                }

                db.run('DELETE FROM disco WHERE disco_id = ?', [id], function (erro) {
                    if (erro) {
                        console.error('Erro ao executar DELETE no disco:', erro)
                        reject(erro)
                        return
                    }

                    console.log('DELETE executado. Linhas afetadas:', this.changes)

                    if (this.changes === 0) {
                        reject(new Error('Disco não encontrado'))
                        return
                    }

                    console.log('Disco deletado com sucesso!')

                    // Tenta resetar a sequência, mas não falha se der erro
                    resetarSequencia()
                        .then(() => {
                            console.log('Sequência resetada com sucesso')
                            resolve({ mensagem: 'Disco deletado com sucesso!' })
                        })
                        .catch((erroReset) => {
                            console.error('Erro ao resetar sequência (ignorado):', erroReset)
                            // Mesmo com erro no reset, consideramos sucesso na deleção
                            resolve({ mensagem: 'Disco deletado com sucesso!' })
                        })
                })
            }
        )
    })
}

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
            `SELECT DISTINCT a.* 
             FROM artista a
             INNER JOIN interprete i ON a.artista_id = i.artista_id
             INNER JOIN musica m ON i.musica_id = m.musica_id
             INNER JOIN musica_disco md ON m.musica_id = md.musica_id
             WHERE md.disco_id = ?
             ORDER BY a.nome`,
            [discoId],
            (erro, interpretes) => {
                if (erro) {
                    console.error('Erro ao buscar intérpretes do disco:', erro)
                    reject(erro)
                    return
                }
                console.log(`Intérpretes encontrados no disco ${discoId}:`, interpretes.length)
                resolve(interpretes)
            }
        )
    })
};

const getInterpretePrincipal = (discoId) => {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT a.* 
             FROM artista a
             INNER JOIN disco d ON a.artista_id = d.interprete_principal_id
             WHERE d.disco_id = ?`,
            [discoId],
            (erro, interprete) => {
                if (erro) {
                    console.error('Erro ao buscar intérprete principal:', erro)
                    reject(erro)
                    return
                }
                resolve(interprete)
            }
        )
    })
};

const musicas = {
    listar: (discoId) => {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT 
                    m.*, 
                    e.descricao as estilo_nome, 
                    md.ordem,
                    (SELECT GROUP_CONCAT(a.nome, ', ') 
                     FROM interprete i 
                     JOIN artista a ON i.artista_id = a.artista_id 
                     WHERE i.musica_id = m.musica_id) as interpretes_nomes,
                    (SELECT GROUP_CONCAT(a.nome, ', ') 
                     FROM compositor c 
                     JOIN artista a ON c.artista_id = a.artista_id 
                     WHERE c.musica_id = m.musica_id) as compositores_nomes
                 FROM musica m
                 INNER JOIN musica_disco md ON m.musica_id = md.musica_id
                 LEFT JOIN estilo e ON m.estilo_id = e.estilo_id
                 WHERE md.disco_id = ?
                 ORDER BY md.ordem ASC`,
                [discoId],
                (erro, musicas) => {
                    if (erro) {
                        console.error('Erro ao listar músicas do disco:', erro)
                        reject(erro)
                        return
                    }

                    const musicasFormatadas = musicas.map(m => ({
                        ...m,
                        interpretes_nomes: m.interpretes_nomes || 'Sem intérprete',
                        compositores_nomes: m.compositores_nomes || 'Sem compositor'
                    }))

                    console.log(`Músicas do disco ${discoId} (por ordem):`,
                        musicasFormatadas.map(m => ({ nome: m.nome, ordem: m.ordem })))

                    resolve(musicasFormatadas)
                }
            )
        })
    },

    adicionar: (discoId, musicaId, ordem) => {
        console.log('>>> adicionar música ao disco:', { discoId, musicaId, ordem })

        return new Promise((resolve, reject) => {
            if (!discoId || !musicaId) {
                reject(new Error('ID do disco e ID da música são obrigatórios'))
                return
            }

            if (ordem === undefined || ordem === null || ordem === '') {
                reject(new Error('A ordem da música é obrigatória'))
                return
            }

            const ordemInt = parseInt(ordem)
            if (isNaN(ordemInt) || ordemInt < 1) {
                reject(new Error('Ordem deve ser um número válido maior que 0'))
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

                    db.get(
                        'SELECT * FROM musica_disco WHERE disco_id = ? AND musica_id = ?',
                        [discoId, musicaId],
                        (erro, musicaExistente) => {
                            if (erro) {
                                console.error('Erro ao verificar música existente:', erro)
                                reject(erro)
                                return
                            }

                            if (musicaExistente) {
                                reject(new Error('Esta música já está neste disco'))
                                return
                            }

                            db.run(
                                'INSERT INTO musica_disco (disco_id, musica_id, ordem) VALUES (?, ?, ?)',
                                [discoId, musicaId, ordemInt],
                                function (erro) {
                                    if (erro) {
                                        console.error('Erro ao adicionar música:', erro)
                                        reject(erro)
                                        return
                                    }

                                    console.log('Música adicionada com sucesso! Ordem:', ordemInt)

                                    db.get(
                                        `SELECT m.*, e.descricao as estilo_nome, md.ordem
                                     FROM musica m
                                     INNER JOIN musica_disco md ON m.musica_id = md.musica_id
                                     LEFT JOIN estilo e ON m.estilo_id = e.estilo_id
                                     WHERE md.disco_id = ? AND md.musica_id = ?`,
                                        [discoId, musicaId],
                                        (erro, musica) => {
                                            if (erro) {
                                                console.error('Erro ao buscar música adicionada:', erro)
                                                resolve({
                                                    mensagem: 'Música adicionada ao disco com sucesso!',
                                                    id: this.lastID
                                                })
                                                return
                                            }
                                            resolve({
                                                mensagem: 'Música adicionada ao disco com sucesso!',
                                                musica: musica
                                            })
                                        }
                                    )
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
    contarTotal,
    listarAnos,
    editar,
    deletar,
    buscar,
    buscarPorNome,
    buscarPorNomeEInterpretes,
    getInterpretesDoDisco,
    getInterpretePrincipal,
    musicas
}