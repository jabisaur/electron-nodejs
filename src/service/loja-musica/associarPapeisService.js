// service/loja-musica/associarPapeisService.js
const db = require('../../../database/connection');

const buscarPapeis = (artistaId) => {
    console.log('>>> associarPapeis:buscarPapeis > ID: ', artistaId);

    return new Promise((resolve, reject) => {
        const papeis = [];
        
        // Verifica se é intérprete
        db.get(
            'SELECT COUNT(*) as total FROM interprete WHERE artista_id = ?',
            [artistaId],
            (erro, result) => {
                if (erro) {
                    console.error('Erro ao verificar intérprete:', erro);
                    reject(erro);
                    return;
                }

                if (result.total > 0) {
                    papeis.push('interprete');
                }

                // Verifica se é compositor
                db.get(
                    'SELECT COUNT(*) as total FROM compositor WHERE artista_id = ?',
                    [artistaId],
                    (erro, result) => {
                        if (erro) {
                            console.error('Erro ao verificar compositor:', erro);
                            reject(erro);
                            return;
                        }

                        if (result.total > 0) {
                            papeis.push('compositor');
                        }

                        console.log('Papéis encontrados:', papeis);
                        resolve(papeis);
                    }
                );
            }
        );
    });
};

const associarPapeis = (artistaId, interprete, compositor) => {
    console.log('>>> associarPapeis:associarPapeis >', { artistaId, interprete, compositor });

    return new Promise((resolve, reject) => {
        // Primeiro verifica se o artista existe
        db.get(
            'SELECT * FROM artista WHERE artista_id = ?',
            [artistaId],
            (erro, artista) => {
                if (erro) {
                    console.error('Erro ao verificar artista:', erro);
                    reject(erro);
                    return;
                }

                if (!artista) {
                    reject(new Error('Artista não encontrado'));
                    return;
                }

                // Usar transação para garantir consistência
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');

                    // Função para executar as operações em sequência
                    const executarOperacoes = () => {
                        let operacoesPendentes = 0;
                        let erroOcorrido = null;

                        const verificarConclusao = () => {
                            if (operacoesPendentes === 0 && !erroOcorrido) {
                                db.run('COMMIT', (erro) => {
                                    if (erro) {
                                        console.error('Erro ao commitar transação:', erro);
                                        reject(erro);
                                    } else {
                                        console.log('Papéis associados com sucesso');
                                        resolve({ 
                                            success: true, 
                                            message: 'Papéis associados com sucesso',
                                            papeis: {
                                                interprete: interprete,
                                                compositor: compositor
                                            }
                                        });
                                    }
                                });
                            }
                        };

                        // Remover papéis existentes
                        operacoesPendentes++;
                        db.run('DELETE FROM interprete WHERE artista_id = ?', [artistaId], function(erro) {
                            if (erro) {
                                console.error('Erro ao remover intérprete:', erro);
                                erroOcorrido = erro;
                                db.run('ROLLBACK');
                                reject(erro);
                                return;
                            }
                            operacoesPendentes--;
                            verificarConclusao();
                        });

                        operacoesPendentes++;
                        db.run('DELETE FROM compositor WHERE artista_id = ?', [artistaId], function(erro) {
                            if (erro) {
                                console.error('Erro ao remover compositor:', erro);
                                erroOcorrido = erro;
                                db.run('ROLLBACK');
                                reject(erro);
                                return;
                            }
                            operacoesPendentes--;
                            verificarConclusao();
                        });

                        // Adicionar novo papel de intérprete se necessário
                        if (interprete) {
                            operacoesPendentes++;
                            db.run(
                                'INSERT INTO interprete (artista_id) VALUES (?)',
                                [artistaId],
                                function(erro) {
                                    if (erro) {
                                        console.error('Erro ao adicionar intérprete:', erro);
                                        erroOcorrido = erro;
                                        db.run('ROLLBACK');
                                        reject(erro);
                                        return;
                                    }
                                    console.log('Intérprete adicionado com ID:', this.lastID);
                                    operacoesPendentes--;
                                    verificarConclusao();
                                }
                            );
                        }

                        // Adicionar novo papel de compositor se necessário
                        if (compositor) {
                            operacoesPendentes++;
                            db.run(
                                'INSERT INTO compositor (artista_id) VALUES (?)',
                                [artistaId],
                                function(erro) {
                                    if (erro) {
                                        console.error('Erro ao adicionar compositor:', erro);
                                        erroOcorrido = erro;
                                        db.run('ROLLBACK');
                                        reject(erro);
                                        return;
                                    }
                                    console.log('Compositor adicionado com ID:', this.lastID);
                                    operacoesPendentes--;
                                    verificarConclusao();
                                }
                            );
                        }
                    };

                    executarOperacoes();
                });
            }
        );
    });
};

const removerTodosPapeis = (artistaId) => {
    console.log('>>> associarPapeis:removerTodosPapeis > ID: ', artistaId);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            db.run('DELETE FROM interprete WHERE artista_id = ?', [artistaId], function(erro) {
                if (erro) {
                    console.error('Erro ao remover intérprete:', erro);
                    db.run('ROLLBACK');
                    reject(erro);
                    return;
                }
            });

            db.run('DELETE FROM compositor WHERE artista_id = ?', [artistaId], function(erro) {
                if (erro) {
                    console.error('Erro ao remover compositor:', erro);
                    db.run('ROLLBACK');
                    reject(erro);
                    return;
                }

                db.run('COMMIT', (erro) => {
                    if (erro) {
                        console.error('Erro ao commitar transação:', erro);
                        reject(erro);
                    } else {
                        console.log('Todos os papéis removidos com sucesso');
                        resolve({ success: true, message: 'Todos os papéis removidos com sucesso' });
                    }
                });
            });
        });
    });
};

const verificarPapel = (artistaId, papel) => {
    console.log('>>> associarPapeis:verificarPapel >', { artistaId, papel });

    return new Promise((resolve, reject) => {
        const tabela = papel === 'interprete' ? 'interprete' : 'compositor';
        
        db.get(
            `SELECT COUNT(*) as total FROM ${tabela} WHERE artista_id = ?`,
            [artistaId],
            (erro, result) => {
                if (erro) {
                    console.error('Erro ao verificar papel:', erro);
                    reject(erro);
                    return;
                }

                resolve(result.total > 0);
            }
        );
    });
};

const listarArtistasComPapeis = () => {
    console.log('>>> associarPapeis:listarArtistasComPapeis');

    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                a.*,
                CASE 
                    WHEN i.artista_id IS NOT NULL AND c.artista_id IS NOT NULL THEN 'ambos'
                    WHEN i.artista_id IS NOT NULL THEN 'interprete'
                    WHEN c.artista_id IS NOT NULL THEN 'compositor'
                    ELSE 'nenhum'
                END as papel_principal,
                (SELECT COUNT(*) FROM interprete WHERE artista_id = a.artista_id) as total_interpretacoes,
                (SELECT COUNT(*) FROM compositor WHERE artista_id = a.artista_id) as total_composicoes
            FROM artista a
            LEFT JOIN interprete i ON a.artista_id = i.artista_id
            LEFT JOIN compositor c ON a.artista_id = c.artista_id
            GROUP BY a.artista_id
            ORDER BY a.nome
        `;

        db.all(query, [], (erro, artistas) => {
            if (erro) {
                console.error('Erro ao listar artistas com papéis:', erro);
                reject(erro);
                return;
            }

            console.log(`${artistas.length} artistas encontrados com papéis`);
            resolve(artistas);
        });
    });
};

module.exports = {
    buscarPapeis,
    associarPapeis,
    removerTodosPapeis,
    verificarPapel,
    listarArtistasComPapeis
};