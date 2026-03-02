const db = require('../../../database/connection')

const criar = (descricao) => {
    console.log('>>> lojaMusica:estilo:criar > ', descricao)
    
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO estilo (descricao) VALUES (?)',
            [descricao],
            function(erro) {
                if (erro) {
                    console.error('Erro ao criar estilo:', erro);
                    reject(erro);
                    return;
                }
                    
                console.log('Estilo criado com ID:', this.lastID);
                    
                db.get(
                    'SELECT * FROM estilo WHERE estilo_id = ?',
                    [this.lastID],
                    (erro, estilo) => {
                        if (erro) {
                            console.error('Erro ao buscar estilo criado:', erro);
                            reject(erro);
                        } else {
                            resolve(estilo);
                        }
                    }
                );
            }
        );
    });
}

const listar = () => {
    console.log('>>> lojaMusica:estilo:listar')
    
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM estilo ORDER BY descricao;', [], (erro, estilos) => {  
            if (erro) {
                console.error('Erro ao listar estilos:', erro);
                reject(erro);
            } else {
                console.log(`${estilos.length} estilos encontrados`);
                resolve(estilos);
            }
        })
    })
}

const deletar = (id) => {
     console.log('>>> lojaMusica:estilo:deletar > ID', id)
    
    return new Promise((resolve, reject) => {
        // verifica se existem músicas
        db.get('SELECT COUNT(*) as total FROM musica WHERE estilo_id = ?', [id], (erro, musicas) => {
            if (erro) {
                reject(erro);
                return;
            }
    
            // se tem músicas linkadas com o estilo, não pode deletar
            if (musicas.total > 0) {
                reject(new Error('Existem músicas associadas a este estilo'));
                return;
            }
    
            // se não tem músicas, pode deletar
            db.run('DELETE FROM estilo WHERE estilo_id = ?', [id], function(erro) {
                if (erro) {
                    reject(erro);
                    return;
                }
    
                if (this.changes === 0) {
                    reject(new Error('Estilo não encontrado'));
                    return;
                }
    
                console.log('Estilo deletado com sucesso');
                resolve({ mensagem: 'Estilo deletado com sucesso' });
            });
        });
    });
}

const editar = (id, descricao) => {
    console.log('>>> lojaMusica:estilo:editar > ID:', id, 'Nova descrição:', descricao)

    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE estilo SET descricao = ? WHERE estilo_id = ?',
            [descricao, id],
            function(erro) {
                if (erro) {
                    console.error('Erro ao editar estilo:', erro);
                    reject(erro);
                    return;
                }

                if (this.changes === 0) {
                    reject(new Error('Estilo não encontrado'));
                    return;
                }

                db.get(
                    'SELECT * FROM estilo WHERE estilo_id = ?',
                    [id],
                    (erro, estilo) => {
                        if (erro) {
                            console.error('Erro ao buscar estilo editado:', erro);
                            reject(erro);
                            return;
                        }

                        console.log('Estilo atualizado com sucesso');
                        resolve(estilo);
                    }
                );
            }
        );
    });
}

const buscar = (id) => {
    console.log('>>> lojaMusica:estilo:buscar > ID:', id)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM estilo WHERE estilo_id = ?',
            [id], 
            (erro, estilo) => {
                if (erro) {
                    console.error('Erro ao buscar estilo:', erro);
                    reject(erro);
                    return;
                }

                if (!estilo) {
                    reject(new Error('Estilo não encontrado'));
                    return;
                }

                console.log('Estilo encontrado:', estilo);
                resolve(estilo);
            }
        );
    });
}

const buscarPorDescricao = (descricao) => {
    console.log('>>> lojaMusica:estilo:buscarPorDescricao >', descricao)

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM estilo WHERE LOWER(descricao) = LOWER(?)',
            [descricao], 
            (erro, estilo) => {
                if (erro) {
                    console.error('Erro ao buscar estilo por nome:', erro);
                    reject(erro);
                    return;
                }

                resolve(estilo);
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
    buscarPorDescricao
}