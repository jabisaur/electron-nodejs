const db = require('../../../database/connection');

const criar = (nome) => {
    console.log(">>> lojaMusica:artista:criar >", nome)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT artista_id FROM artista WHERE LOWER(nome) = LOWER(?)',
            [nome],
            (erroBusca, artistaExistente) => {
                if (erroBusca) {
                    console.error('Erro ao verificar artista existente: ', erroBusca)
                    reject(erroBusca)
                    return
                }

                if (artistaExistente) {
                    reject(new Error(`O artista "${nome}" já está cadastrado no sistema.`))
                    return
                }

                db.run(
                    'INSERT INTO artista (nome) VALUES (?)',
                    [nome],
                    function(erro) {
                        if(erro) {
                            console.error('Erro ao criar artista: ', erro)
                            reject(erro)
                            return
                        }

                        console.log('Artista criado com ID: ', this.lastID)

                        db.get(
                            'SELECT * FROM artista WHERE artista_id = ?',
                            [this.lastID],
                            (erroBuscaCriado, artista) => {
                                if(erroBuscaCriado) {
                                    console.error('Erro ao buscar artista criado: ', erroBuscaCriado)
                                    reject(erroBuscaCriado)
                                } else {
                                    resolve(artista)
                                }
                            }
                        )
                    }
                )
            }
        )
    })
};

const listar = (pagina = 1, itensPorPagina = 10) => {
    const limite = parseInt(itensPorPagina, 10);
    const offset = (parseInt(pagina, 10) - 1) * limite;
    
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM artista ORDER BY nome LIMIT ? OFFSET ?',
            [limite, offset],
            (erro, artistas) => {
                if (erro) {
                    console.error('Erro ao listar artistas: ', erro);
                    reject(erro);
                } else {
                    resolve(artistas);
                }
            }
        );
    });
};

const contarTotal = () => {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as total FROM artista', [], (erro, row) => {
            if (erro) reject(erro);
            else resolve(row ? row.total : 0);
        });
    });
};

const deletar = (id) => {
    console.log('>>> lojaMusica:artista:deletar ID > ', id)

    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as total FROM interprete WHERE artista_id = ?', 
            [id],
            (erro, interprete) => {
                if (erro) {
                    reject(erro)
                    return
                }

                if (interprete.total > 0) {
                    reject(new Error('Este artista possui intérpretes associados e não pode ser excluído.'))
                    return
                }

                db.get('SELECT COUNT(*) as total FROM compositor WHERE artista_id = ?',
                    [id],
                    (erro, compositor) => {
                        if (erro) {
                            reject(erro)
                            return
                        }

                        if (compositor.total > 0) {
                            reject(new Error('Este artista possui compositores associados e não pode ser excluído.'))
                            return
                        }

                        db.run('DELETE FROM artista WHERE artista_id = ?', 
                            [id], 
                            function(erro) {
                                if (erro) {
                                    reject(erro)
                                    return
                                }

                                if (this.changes === 0) {
                                    reject(new Error('Artista não encontrado'))
                                    return
                                }

                                console.log('Artista deletado com sucesso!')
                                resolve({ mensagem: 'Artista deletado com sucesso' })
                            }
                        )
                    }
                )
            }
        )
    })
};

const editar = (id, nome) => {
    console.log('>>> lojaMusica:artista:editar > ID: ', id, 'Novo nome: ', nome)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT artista_id FROM artista WHERE LOWER(nome) = LOWER(?) AND artista_id != ?',
            [nome, id],
            (erroBusca, artistaExistente) => {
                if (erroBusca) {
                    console.error('Erro ao verificar duplicidade na edição: ', erroBusca)
                    reject(erroBusca)
                    return
                }

                if (artistaExistente) {
                    reject(new Error(`Já existe um artista com este nome.`))
                    return
                }

                db.run(
                    'UPDATE artista SET nome = ? WHERE artista_id = ?',
                    [nome, id],
                    function(erro) {
                        if(erro) {
                            console.error('Erro ao editar artista: ', erro)
                            reject(erro)
                            return
                        }

                        if(this.changes === 0) {
                            reject(new Error('Artista não encontrado.'))
                            return
                        }

                        db.get(
                            'SELECT * FROM artista WHERE artista_id = ?',
                            [id],
                            (erroBuscaAtualizado, artista) => {
                                if (erroBuscaAtualizado) {
                                    console.error('Erro ao buscar artista atualizado: ', erroBuscaAtualizado)
                                    reject(erroBuscaAtualizado)
                                    return
                                }

                                console.log('Artista atualizado com sucesso:', artista.nome)
                                resolve(artista)
                            }
                        )
                    }
                )
            }
        )
    })
};

const buscar = (id) => {
    console.log('>>> lojaMusica:artista:buscar > ID: ', id)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM artista WHERE artista_id = ?',
            [id],
            (erro, artista) => {
                if (erro) {
                    console.error('Erro ao buscar artista: ', erro)
                    reject(erro)
                    return
                }

                if(!artista) {
                    reject(new Error('Artista não encontrado!'))
                    return
                }

                console.log('Artista encontrado: ', artista)
                resolve(artista)
            }
        )
    })
};

const buscarPorNome = (nome) => {
    console.log('>>> lojaMusica:artista:buscarPorNome >', nome)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM artista WHERE LOWER(nome) = LOWER(?)',
            [nome], 
            (erro, artista) => {
                if (erro) {
                    console.error('Erro ao buscar artista por nome:', erro);
                    reject(erro);
                    return;
                }

                resolve(artista);
            }
        );
    });
}

module.exports = {
    criar,
    listar,
    contarTotal,
    editar,
    deletar,
    buscar,
    buscarPorNome
}