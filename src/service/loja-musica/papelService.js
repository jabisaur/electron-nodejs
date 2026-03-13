const db = require('../../../database/connection');

const associarPapel = (artistaId, musicaId, papel) => {
    console.log(`>>> papelService:associarPapel > Artista: ${artistaId}, Música: ${musicaId}, Papel: ${papel}`);

    return new Promise((resolve, reject) => {
        const tabela = papel === 'interprete' ? 'interprete' : 'compositor';
        
        db.get(
            `SELECT COUNT(*) as total FROM ${tabela} WHERE artista_id = ? AND musica_id = ?`,
            [artistaId, musicaId],
            (erro, result) => {
                if (erro) {
                    reject(erro);
                    return;
                }

                if (result.total > 0) {
                    resolve({ 
                        success: false, 
                        message: `Artista já é ${papel} desta música` 
                    });
                    return;
                }

                db.run(
                    `INSERT INTO ${tabela} (artista_id, musica_id) VALUES (?, ?)`,
                    [artistaId, musicaId],
                    function(erro) {
                        if (erro) {
                            reject(erro);
                            return;
                        }

                        resolve({ 
                            success: true, 
                            message: `Artista associado como ${papel} com sucesso`,
                            id: this.lastID 
                        });
                    }
                );
            }
        );
    });
};

const desassociarPapel = (artistaId, musicaId, papel) => {
    console.log(`>>> papelService:desassociarPapel > Artista: ${artistaId}, Música: ${musicaId}, Papel: ${papel}`);

    return new Promise((resolve, reject) => {
        const tabela = papel === 'interprete' ? 'interprete' : 'compositor';

        db.run(
            `DELETE FROM ${tabela} WHERE artista_id = ? AND musica_id = ?`,
            [artistaId, musicaId],
            function(erro) {
                if (erro) {
                    reject(erro);
                    return;
                }

                if (this.changes === 0) {
                    resolve({ 
                        success: false, 
                        message: `Artista não estava associado como ${papel}` 
                    });
                    return;
                }

                resolve({ 
                    success: true, 
                    message: `Artista desassociado como ${papel} com sucesso` 
                });
            }
        );
    });
};

const listarMusicasComPapeis = (artistaId) => {
    console.log(`>>> papelService:listarMusicasComPapeis > Artista: ${artistaId}`);

    return new Promise((resolve, reject) => {
        const query = `
            SELECT DISTINCT
                m.musica_id,
                m.nome as musica_nome,
                m.duracao,
                CASE 
                    WHEN i.artista_id IS NOT NULL AND c.artista_id IS NOT NULL THEN 'ambos'
                    WHEN i.artista_id IS NOT NULL THEN 'interprete'
                    WHEN c.artista_id IS NOT NULL THEN 'compositor'
                    ELSE 'nenhum'
                END as papel_atual,
                i.artista_id as is_interprete,
                c.artista_id as is_compositor
            FROM musica m
            INNER JOIN (
                SELECT musica_id FROM interprete WHERE artista_id = ?
                UNION
                SELECT musica_id FROM compositor WHERE artista_id = ?
            ) rel ON m.musica_id = rel.musica_id
            LEFT JOIN interprete i ON m.musica_id = i.musica_id AND i.artista_id = ?
            LEFT JOIN compositor c ON m.musica_id = c.musica_id AND c.artista_id = ?
            ORDER BY m.nome
        `;

        db.all(query, [artistaId, artistaId, artistaId, artistaId], (erro, musicas) => {
            if (erro) {
                console.error('Erro ao listar músicas com papéis:', erro);
                reject(erro);
                return;
            }

            console.log(`Encontradas ${musicas.length} músicas relacionadas ao artista ${artistaId}`);
            resolve(musicas);
        });
    });
};

const listarArtistasComPapeisDetalhados = () => {
    console.log('>>> papelService:listarArtistasComPapeisDetalhados');

    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                a.*,
                COUNT(DISTINCT i.musica_id) as total_interpretacoes,
                COUNT(DISTINCT c.musica_id) as total_composicoes,
                CASE 
                    WHEN COUNT(DISTINCT i.musica_id) > 0 AND COUNT(DISTINCT c.musica_id) > 0 THEN 'ambos'
                    WHEN COUNT(DISTINCT i.musica_id) > 0 THEN 'interprete'
                    WHEN COUNT(DISTINCT c.musica_id) > 0 THEN 'compositor'
                    ELSE 'nenhum'
                END as papel_principal,
                GROUP_CONCAT(DISTINCT 
                    CASE WHEN i.musica_id IS NOT NULL THEN m_i.nome END
                ) as musicas_interpretadas,
                GROUP_CONCAT(DISTINCT 
                    CASE WHEN c.musica_id IS NOT NULL THEN m_c.nome END
                ) as musicas_compostas
            FROM artista a
            LEFT JOIN interprete i ON a.artista_id = i.artista_id
            LEFT JOIN musica m_i ON i.musica_id = m_i.musica_id
            LEFT JOIN compositor c ON a.artista_id = c.artista_id
            LEFT JOIN musica m_c ON c.musica_id = m_c.musica_id
            GROUP BY a.artista_id
            ORDER BY a.nome
        `;

        db.all(query, [], (erro, artistas) => {
            if (erro) {
                reject(erro);
                return;
            }

            resolve(artistas);
        });
    });
};

module.exports = {
    associarPapel,
    desassociarPapel,
    listarMusicasComPapeis,
    listarArtistasComPapeisDetalhados
};