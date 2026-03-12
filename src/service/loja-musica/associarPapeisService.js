const db = require('../../../database/connection');

const buscarPapeis = (artistaId) => {
    console.log('>>> associarPapeis:buscarPapeis > ID: ', artistaId);

    return new Promise((resolve, reject) => {
        const papeis = [];
        
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
                    WHEN EXISTS (SELECT 1 FROM interprete WHERE artista_id = a.artista_id) 
                     AND EXISTS (SELECT 1 FROM compositor WHERE artista_id = a.artista_id) THEN 'ambos'
                    WHEN EXISTS (SELECT 1 FROM interprete WHERE artista_id = a.artista_id) THEN 'interprete'
                    WHEN EXISTS (SELECT 1 FROM compositor WHERE artista_id = a.artista_id) THEN 'compositor'
                    ELSE 'nenhum'
                END as papel_principal,
                (SELECT COUNT(*) FROM interprete WHERE artista_id = a.artista_id) as total_interpretacoes,
                (SELECT COUNT(*) FROM compositor WHERE artista_id = a.artista_id) as total_composicoes
            FROM artista a
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
    verificarPapel,
    listarArtistasComPapeis
};