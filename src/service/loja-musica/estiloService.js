const db = require('../../../database/connection')

const criar = (descricao) => {
    console.log('>>> lojaMusica:estilo:criar > ', descricao)
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT estilo_id FROM estilo WHERE LOWER(descricao) = LOWER(?)',
            [descricao],
            (erroBusca, estiloExistente) => {
                if (erroBusca) {
                    console.error('Erro ao verificar existência do estilo:', erroBusca);
                    reject(erroBusca);
                    return;
                }

                if (estiloExistente) {
                    reject(new Error(`O estilo "${descricao}" já está cadastrado no sistema.`));
                    return;
                }

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
            }
        );
    });
}

const listar = (pagina = 1, itensPorPagina = 10) => {
    console.log(`>>> lojaMusica:estilo:listar > Página: ${pagina}`);
    const limite = parseInt(itensPorPagina, 10);
    const offset = (parseInt(pagina, 10) - 1) * limite;

    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM estilo ORDER BY descricao LIMIT ? OFFSET ?', 
            [limite, offset], 
            (erro, estilos) => {  
                if (erro) {
                    console.error('Erro ao listar estilos:', erro);
                    reject(erro);
                } else {
                    resolve(estilos);
                }
            }
        );
    });
}

const contarTotal = () => {
    console.log('>>> lojaMusica:estilo:contarTotal');
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as total FROM estilo', [], (erro, row) => {
            if (erro) {
                console.error('Erro ao contar estilos:', erro);
                reject(erro);
            } else {
                resolve(row ? row.total : 0);
            }
        });
    });
}

const deletar = (id) => {
     console.log('>>> lojaMusica:estilo:deletar > ID', id)
    
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as total FROM musica WHERE estilo_id = ?', [id], (erro, musicas) => {
            if (erro) {
                reject(erro);
                return;
            }

            if (musicas.total > 0) {
                reject(new Error('Existem músicas associadas a este estilo'));
                return;
            }

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
        db.get(
            'SELECT estilo_id FROM estilo WHERE LOWER(descricao) = LOWER(?) AND estilo_id != ?',
            [descricao, id],
            (erroBusca, estiloExistente) => {
                if (erroBusca) {
                    console.error('Erro ao verificar duplicidade na edição do estilo:', erroBusca);
                    reject(erroBusca);
                    return;
                }

                if (estiloExistente) {
                    reject(new Error(`Já existe um estilo com esta descrição.`));
                    return;
                }

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
    contarTotal,
    deletar,
    editar,
    buscar,
    buscarPorDescricao
}