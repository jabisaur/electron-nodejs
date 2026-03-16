const db = require('../../../database/connection')

const criar = (dados) => {
    const { nome, duracao, data_lancamento, estilo_id, interpretes, compositores } = dados

    console.log('>>> musicaService.criar - Dados recebidos:', {
        nome,
        duracao,
        data_lancamento,
        estilo_id,
        interpretes,
        compositores
    })

    // Garantir que a data está no formato correto (YYYY-MM-DD)
    let dataFormatada = data_lancamento
    if (data_lancamento && data_lancamento.includes('T')) {
        dataFormatada = data_lancamento.split('T')[0]
    }

    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO musica (nome, duracao, data_lancamento, estilo_id) VALUES (?, ?, ?, ?)',
            [nome, duracao, dataFormatada, estilo_id],
            function(erro) {
                if(erro) {
                    console.error('Erro ao criar música: ', erro)
                    reject(erro)
                    return
                }

                const musicaId = this.lastID
                console.log('Música criada com ID: ', musicaId)

                if (!interpretes || interpretes.length === 0) {
                    db.run('DELETE FROM musica WHERE musica_id = ?', [musicaId])
                    reject(new Error('É necessário selecionar pelo menos um intérprete'))
                    return
                }

                let operacoesPendentes = interpretes.length + (compositores?.length || 0)
                let erros = []

                const verificarConclusao = () => {
                    operacoesPendentes--
                    console.log('Operações pendentes:', operacoesPendentes)
                    
                    if (operacoesPendentes === 0) {
                        if (erros.length > 0) {
                            console.error('Erros ao associar artistas:', erros)
                        }
                        
                        db.get(
                            `SELECT m.*, e.descricao as estilo_nome
                             FROM musica m
                             INNER JOIN estilo e ON m.estilo_id = e.estilo_id
                             WHERE m.musica_id = ?`,
                            [musicaId],
                            (erro, musica) => {
                                if(erro) {
                                    console.error('Erro ao buscar música criada: ', erro)
                                    reject(erro)
                                } else {
                                    console.log('Música criada com sucesso:', musica)
                                    resolve(musica)
                                }
                            }
                        )
                    }
                }

                interpretes.forEach(artistaId => {
                    console.log(`Inserindo intérprete: música ${musicaId}, artista ${artistaId}`)
                    db.run(
                        'INSERT INTO interprete (musica_id, artista_id) VALUES (?, ?)',
                        [musicaId, artistaId],
                        function(erro) {
                            if (erro) {
                                console.error('Erro ao inserir intérprete:', erro)
                                erros.push(erro)
                            } else {
                                console.log(`Intérprete ${artistaId} inserido com sucesso`)
                            }
                            verificarConclusao()
                        }
                    )
                })

                if (compositores && compositores.length > 0) {
                    compositores.forEach(artistaId => {
                        console.log(`Inserindo compositor: música ${musicaId}, artista ${artistaId}`)
                        db.run(
                            'INSERT INTO compositor (musica_id, artista_id) VALUES (?, ?)',
                            [musicaId, artistaId],
                            function(erro) {
                                if (erro) {
                                    console.error('Erro ao inserir compositor:', erro)
                                    erros.push(erro)
                                } else {
                                    console.log(`Compositor ${artistaId} inserido com sucesso`)
                                }
                                verificarConclusao()
                            }
                        )
                    })
                } else {
                    for(let i = 0; i < (compositores?.length || 0); i++) {
                        verificarConclusao()
                    }
                }
            }
        )
    })
}

const listar = (pagina = 1, itensPorPagina = 10, filtros = {}) => {
    return new Promise((resolve, reject) => {
        const offset = (pagina - 1) * itensPorPagina;
        const params = [];

        let sql = `
            SELECT 
                m.*, 
                e.descricao as estilo_nome,
                (SELECT GROUP_CONCAT(a.nome, ' | ') 
                 FROM interprete i 
                 JOIN artista a ON i.artista_id = a.artista_id 
                 WHERE i.musica_id = m.musica_id) as interpretes_nomes,
                (SELECT GROUP_CONCAT(a.nome, ' | ') 
                 FROM compositor c 
                 JOIN artista a ON c.artista_id = a.artista_id 
                 WHERE c.musica_id = m.musica_id) as compositores_nomes
            FROM musica m
            INNER JOIN estilo e ON m.estilo_id = e.estilo_id
            WHERE 1=1
        `;

        if (filtros.nome) {
            sql += ` AND m.nome LIKE ?`;
            params.push(`%${filtros.nome}%`);
        }
        if (filtros.estilo_id) {
            sql += ` AND m.estilo_id = ?`;
            params.push(filtros.estilo_id);
        }
        if (filtros.ano) {
            sql += ` AND strftime('%Y', m.data_lancamento) = ?`;
            params.push(filtros.ano);
        }

        sql += ` ORDER BY m.nome LIMIT ? OFFSET ?`;
        params.push(itensPorPagina, offset);

        db.all(sql, params, (erro, musicas) => {
            if (erro) {
                console.error('Erro ao listar músicas: ', erro);
                reject(erro);
            } else {
                resolve(musicas);
            }
        });
    });
};

const contarTotal = (filtros = {}) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT COUNT(*) as total FROM musica WHERE 1=1`;
        const params = [];

        if (filtros.nome) {
            sql += ` AND nome LIKE ?`;
            params.push(`%${filtros.nome}%`);
        }
        if (filtros.estilo_id) {
            sql += ` AND estilo_id = ?`;
            params.push(filtros.estilo_id);
        }

        db.get(sql, params, (erro, row) => {
            if (erro) reject(erro);
            else resolve(row.total);
        });
    });
};

const buscar = (id) => {
    console.log('>>> lojaMusica:musica:buscar > ID: ', id)

    return new Promise((resolve, reject) => {
        db.get(
            `SELECT m.*, e.descricao as estilo_nome
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
}

const editar = (id, dados) => {
    const { nome, duracao, data_lancamento, estilo_id, interpretes, compositores } = dados

    let dataFormatada = data_lancamento
    if (data_lancamento && data_lancamento.includes('T')) {
        dataFormatada = data_lancamento.split('T')[0]
    }

    console.log('>>> lojaMusica:musica:editar > ID', id, dados)

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION')

            // Atualiza dados básicos da música
            db.run(
                'UPDATE musica SET nome = ?, duracao = ?, data_lancamento = ?, estilo_id = ? WHERE musica_id = ?',
                [nome, duracao, dataFormatada, estilo_id, id],
                function(erro) {
                    if(erro) {
                        console.error('Erro ao editar música: ', erro)
                        db.run('ROLLBACK')
                        reject(erro)
                        return
                    }

                    if(this.changes === 0) {
                        db.run('ROLLBACK')
                        reject(new Error('Música não encontrada'))
                        return
                    }

                    // Remove associações antigas
                    db.run('DELETE FROM interprete WHERE musica_id = ?', [id], function(erro) {
                        if(erro) {
                            console.error('Erro ao remover intérpretes antigos:', erro)
                            db.run('ROLLBACK')
                            reject(erro)
                            return
                        }

                        db.run('DELETE FROM compositor WHERE musica_id = ?', [id], function(erro) {
                            if(erro) {
                                console.error('Erro ao remover compositores antigos:', erro)
                                db.run('ROLLBACK')
                                reject(erro)
                                return
                            }

                            let operacoesPendentes = 0
                            let erros = []

                            // Conta quantas operações de inserção serão feitas
                            if (interpretes && interpretes.length > 0) {
                                operacoesPendentes += interpretes.length
                            }
                            if (compositores && compositores.length > 0) {
                                operacoesPendentes += compositores.length
                            }

                            console.log(`Total de operações pendentes: ${operacoesPendentes}`)

                            const verificarConclusao = () => {
                                operacoesPendentes--
                                console.log(`Operações restantes: ${operacoesPendentes}`)
                                
                                if (operacoesPendentes === 0) {
                                    if (erros.length > 0) {
                                        console.error('Erros ao associar novos artistas:', erros)
                                    }
                                    
                                    db.run('COMMIT', (erro) => {
                                        if(erro) {
                                            console.error('Erro ao commitar:', erro)
                                            reject(erro)
                                            return
                                        }

                                        // Busca música atualizada
                                        db.get(
                                            `SELECT m.*, e.descricao as estilo_nome
                                             FROM musica m
                                             INNER JOIN estilo e ON m.estilo_id = e.estilo_id
                                             WHERE m.musica_id = ?`,
                                            [id],
                                            (erro, musica) => {
                                                if(erro) {
                                                    console.error('Erro ao buscar música atualizada: ', erro)
                                                    reject(erro)
                                                    return
                                                }
                                                console.log('Música atualizada com sucesso')
                                                resolve(musica)
                                            }
                                        )
                                    })
                                }
                            }

                            // Se não há nada para inserir, commitar direto
                            if (operacoesPendentes === 0) {
                                db.run('COMMIT', (erro) => {
                                    if(erro) {
                                        reject(erro)
                                    } else {
                                        db.get(
                                            `SELECT m.*, e.descricao as estilo_nome
                                             FROM musica m
                                             INNER JOIN estilo e ON m.estilo_id = e.estilo_id
                                             WHERE m.musica_id = ?`,
                                            [id],
                                            (erro, musica) => {
                                                if(erro) reject(erro)
                                                else resolve(musica)
                                            }
                                        )
                                    }
                                })
                                return
                            }

                            // Insere novos intérpretes
                            if (interpretes && interpretes.length > 0) {
                                interpretes.forEach(artistaId => {
                                    db.run(
                                        'INSERT INTO interprete (musica_id, artista_id) VALUES (?, ?)',
                                        [id, artistaId],
                                        function(erro) {
                                            if(erro) {
                                                console.error('Erro ao adicionar intérprete:', erro)
                                                erros.push(erro)
                                            }
                                            verificarConclusao()
                                        }
                                    )
                                })
                            }

                            // Insere novos compositores
                            if (compositores && compositores.length > 0) {
                                compositores.forEach(artistaId => {
                                    db.run(
                                        'INSERT INTO compositor (musica_id, artista_id) VALUES (?, ?)',
                                        [id, artistaId],
                                        function(erro) {
                                            if(erro) {
                                                console.error('Erro ao adicionar compositor:', erro)
                                                erros.push(erro)
                                            }
                                            verificarConclusao()
                                        }
                                    )
                                })
                            }
                        })
                    })
                }
            )
        })
    })
}

const deletar = (id) => {
    console.log('>>> [SERVICE] Iniciando deleção da música ID:', id)

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION')

            // Primeiro, verificar discos associados
            db.get(
                'SELECT COUNT(*) as total FROM musica_disco WHERE musica_id = ?',
                [id],
                (erro, result) => {
                    if (erro) {
                        db.run('ROLLBACK')
                        reject(erro)
                        return
                    }

                    if (result.total > 0) {
                        db.run('ROLLBACK')
                        reject(new Error('Existem discos associados a esta música'))
                        return
                    }

                    // Deletar associações de intérpretes
                    db.run('DELETE FROM interprete WHERE musica_id = ?', [id], function(erro) {
                        if (erro) {
                            db.run('ROLLBACK')
                            reject(erro)
                            return
                        }

                        // Deletar associações de compositores
                        db.run('DELETE FROM compositor WHERE musica_id = ?', [id], function(erro) {
                            if (erro) {
                                db.run('ROLLBACK')
                                reject(erro)
                                return
                            }

                            // Finalmente, deletar a música
                            db.run('DELETE FROM musica WHERE musica_id = ?', [id], function(erro) {
                                if (erro) {
                                    db.run('ROLLBACK')
                                    reject(erro)
                                    return
                                }

                                if (this.changes === 0) {
                                    db.run('ROLLBACK')
                                    reject(new Error('Música não encontrada'))
                                    return
                                }

                                db.run('COMMIT', (erro) => {
                                    if (erro) {
                                        reject(erro)
                                        return
                                    }
                                    console.log('>>> [SERVICE] Música deletada com sucesso!')
                                    resolve({ mensagem: 'Música deletada com sucesso!' })
                                })
                            })
                        })
                    })
                }
            )
        })
    })
}

const deletarMultiplas = (ids) => {
    console.log('>>> [SERVICE] Iniciando deleção de múltiplas músicas IDs:', ids)

    return new Promise((resolve, reject) => {
        if (!ids || ids.length === 0) {
            reject(new Error('Nenhuma música selecionada para deletar'))
            return
        }

        db.serialize(() => {
            db.run('BEGIN TRANSACTION')

            const placeholders = ids.map(() => '?').join(',')
            
            // Verificar se alguma música está associada a discos
            db.get(
                `SELECT COUNT(*) as total FROM musica_disco WHERE musica_id IN (${placeholders})`,
                ids,
                (erro, result) => {
                    if (erro) {
                        db.run('ROLLBACK')
                        reject(erro)
                        return
                    }

                    if (result.total > 0) {
                        db.run('ROLLBACK')
                        reject(new Error('Uma ou mais músicas estão associadas a discos. Remova-as dos discos primeiro.'))
                        return
                    }

                    // Deletar associações de intérpretes
                    db.run(
                        `DELETE FROM interprete WHERE musica_id IN (${placeholders})`,
                        ids,
                        function(erro) {
                            if (erro) {
                                db.run('ROLLBACK')
                                reject(erro)
                                return
                            }

                            // Deletar associações de compositores
                            db.run(
                                `DELETE FROM compositor WHERE musica_id IN (${placeholders})`,
                                ids,
                                function(erro) {
                                    if (erro) {
                                        db.run('ROLLBACK')
                                        reject(erro)
                                        return
                                    }

                                    // deletar as músicas
                                    db.run(
                                        `DELETE FROM musica WHERE musica_id IN (${placeholders})`,
                                        ids,
                                        function(erro) {
                                            if (erro) {
                                                db.run('ROLLBACK')
                                                reject(erro)
                                                return
                                            }

                                            if (this.changes === 0) {
                                                db.run('ROLLBACK')
                                                reject(new Error('Nenhuma música foi deletada'))
                                                return
                                            }

                                            db.run('COMMIT', (erro) => {
                                                if (erro) {
                                                    reject(erro)
                                                    return
                                                }
                                                console.log('>>> [SERVICE] Músicas deletadas com sucesso:', this.changes)
                                                resolve({ 
                                                    mensagem: `${this.changes} música(s) deletada(s) com sucesso!`,
                                                    quantidade: this.changes 
                                                })
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
    })
}

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
                console.log(`${interpretes.length} intérpretes encontrados`)
                resolve(interpretes)
            }
        )
    })
}

const buscarCompositores = (musicaId) => {
    console.log('>>> lojaMusica:musica:buscarCompositores > ID:', musicaId)

    return new Promise((resolve, reject) => {
        db.all(
            `SELECT a.* 
             FROM artista a
             INNER JOIN compositor c ON a.artista_id = c.artista_id
             WHERE c.musica_id = ?
             ORDER BY a.nome`,
            [musicaId],
            (erro, compositores) => {
                if (erro) {
                    console.error('Erro ao buscar compositores da música:', erro)
                    reject(erro)
                    return
                }
                console.log(`${compositores.length} compositores encontrados para a música ${musicaId}`)
                resolve(compositores)
            }
        )
    })
}

module.exports = {
    criar,
    listar,
    contarTotal,
    buscar,
    editar,
    deletar,
    deletarMultiplas,
    buscarInterpretes,
    buscarCompositores
}