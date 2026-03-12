const db = require('../../../database/connection')

const editar = (id, nome) => {
    console.log('>>> lojaMusica:gravadora:editar > ID: ', id, 'Novo nome: ', nome )

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT gravadora_id FROM gravadora WHERE LOWER(nome) = LOWER(?) AND gravadora_id != ?',
            [nome, id],
            (erroBusca, gravadoraExistente) => {
                if (erroBusca) {
                    console.error('Erro ao verificar duplicidade na edição da gravadora: ', erroBusca)
                    reject(erroBusca)
                    return
                }

                if (gravadoraExistente) {
                    reject(new Error(`Já existe uma gravadora com este nome.`))
                    return
                }

                db.run (
                    'UPDATE gravadora SET nome = ? WHERE gravadora_id = ?',
                    [nome, id],
                    function(erro){
                        if (erro) {
                            console.error('Erro ao editar gravadora: ', erro)
                            reject(erro)
                            return
                        }

                        if (this.changes === 0) {
                            reject(new Error('Gravadora não encontrada'))
                            return
                        }

                        db.get(
                            'SELECT * FROM gravadora WHERE gravadora_id = ?',
                            [id],
                            (erro, gravadora) => {
                                if (erro) {
                                    console.error('Erro ao buscar gravadora atualizada: ', erro)
                                    reject(erro)
                                    return
                                }

                                console.log('Gravadora atualizada com sucesso')
                                resolve(gravadora)
                            }
                        )
                    }
                )
            }
        )
    })
}

const criar = (nome) => {
    console.log('>>> lojaMusica:gravadora:criar > ', nome)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT gravadora_id FROM gravadora WHERE LOWER(nome) = LOWER(?)',
            [nome],
            (erroBusca, gravadoraExistente) => {
                if (erroBusca) {
                    console.error('Erro ao verificar existência da gravadora: ', erroBusca)
                    reject(erroBusca)
                    return
                }

                if (gravadoraExistente) {
                    reject(new Error(`A gravadora "${nome}" já está cadastrada no sistema.`))
                    return
                }

                db.run (
                    'INSERT INTO gravadora (nome) VALUES (?)',
                    [nome],
                    function(erro) {
                        if (erro) {
                            console.error('Erro ao criar gravadora: ', erro)
                            reject(erro)
                            return
                        }

                        console.log('Gravadora criada com ID: ', this.lastID)

                        db.get(
                            'SELECT * FROM gravadora WHERE gravadora_id = ?',
                            [this.lastID],
                            (erro, gravadora) => {
                                if (erro) {
                                    console.error('Erro ao buscar gravadora criada: ', erro)
                                    reject(erro)
                                } else {
                                    resolve(gravadora)
                                }
                            }
                        )
                    }
                )
            }
        )
    })
}

const listar = () => {
    console.log('>>> lojaMusica:gravadora:listar')

    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM gravadora ORDER BY nome', [], (erro, gravadora) => {
            if (erro) {
                console.error('Erro ao listar gravadoras: ', erro)
                reject(erro)
            } else {
                console.log(`${gravadora.length} gravadoras encontradas.`)
                resolve(gravadora)
            }
        })   
    })
}

const deletar = (id) => {
    console.log('>>> lojaMusica:gravadora:deletar > ID: ', id)

    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as total FROM disco WHERE gravadora_id = ?', 
            [id], 
            (erro, discos) => {
            if (erro) {
                reject (erro)
                return
            }

            if (discos.total > 0) {
                reject(new Error('Existem discos associados a essa gravadora'))
                return
            }

            db.run ('DELETE FROM gravadora WHERE gravadora_id = ?', 
                [id], 
                function(erro) {
                    if (erro) {
                        reject(erro)
                        return
                }

                if (this.changes === 0) {
                    reject(new Error('Gravadora não encontrada'))
                    return
                }

                console.log('Gravadora deletada com sucesso!')
                resolve({ mensagem: 'Gravadora deletada com sucesso'})
            })
        })
        
    })
}

const buscar = (id) => {
    console.log(">>> lojaMusica:gravadora:buscar > ID: ", id)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM gravadora WHERE gravadora_id = ?',
            [id], 
            (erro, gravadora) => {
                if(erro) {
                    console.error('Erro ao buscar gravadora: ', erro)
                    reject(erro)
                    return
                }

                if (!gravadora) {
                    reject(new Error('Gravadora não encontrada'))
                    return
                }

                console.log('Gravadora encontrada: ', gravadora)
                resolve(gravadora)
            }
        )
    })
}

const buscarPorNome = (nome) => {
    console.log('>>> lojaMusica:gravadora:buscarPorNome >', nome)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM gravadora WHERE LOWER(nome) = LOWER(?)',
            [nome], 
            (erro, gravadora) => {
                if (erro) {
                    console.error('Erro ao buscar gravadora por nome:', erro);
                    reject(erro);
                    return;
                }

                resolve(gravadora);
            }
        );
    });
}

module.exports = {
    criar, 
    listar,
    deletar,
    editar,
    buscar,
    buscarPorNome
}