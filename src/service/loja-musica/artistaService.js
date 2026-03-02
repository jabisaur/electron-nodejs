const db = require('../../../database/connection');

const criar = (nome) => {
    console.log(">>> lojaMusica:artista:criar >", nome)

    return new Promise((resolve, reject) => {
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
                    (erro, artista) => {
                        if(erro) {
                            console.error('Erro ao buscar artista criado: ', erro)
                            reject(erro)
                        } else {
                            resolve(artista)
                        }
                    }
                )
            }
        )
    })
};

const listar = () => {
    console.log('>>> lojaMusica:artista:listar')

    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM artista ORDER BY nome', [], (erro, artistas) => {
            if (erro) {
                console.error('Erro ao listar artistas: ', erro)
                reject(erro)
            } else {
                console.log(`${artistas.length} artistas encontrados.`)
                resolve(artistas)
            }
        })       
    })
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
                    reject(new Error('Existem interpretes associados a este artista'))
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
                            reject(new Error('Existem compositores associados a este artista'))
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
                    (erro, artista) => {
                        if (erro) {
                            console.error('Erro ao buscar artista atualizado: ', erro)
                            reject(erro)
                            return
                        }

                        console.log('Artista atualizado com sucesso')
                        resolve(artista)
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
    editar,
    deletar,
    buscar,
    buscarPorNome
}