const db = require('../../../database/connection')

const buscaService = {
    // BUSCA GERAL // 

    buscaGlobal: (termo) => {
        console.log('>>> buscaService:buscaGlobal >', termo)

        return new Promise((resolve, reject) => {
            const resultados = {
                artistas: [],
                discos: [], 
                musicas: [],
                estilos: [],
                gravadoras: []
            }

            let consultasCompletas = 0
            const totalConsultas = 5

            const verificarConclusao = () => {
                consultasCompletas++
                if (consultasCompletas === totalConsultas) {
                    resolve(resultados)
                }
            }

            // busca por artistas
            db.all(
                `SELECT * FROM artista WHERE nome LIKE ? ORDER BY nome`,
                [`%${termo}%`],
                (erro, artistas) => {
                    if (!erro) resultados.artistas = artistas
                    verificarConclusao()
                }
            )

            // busca de disco (com gravadora)
            db.all(
                `SELECT d.*, g.nome as gravadora_nome
                FROM disco d
                LEFT JOIN gravadora g ON d.gravadora_id = g.gravadora_id
                WHERE d.nome LIKE ?
                ORDER BY d.nome`,
                [`%${termo}%`],
                (erro, discos) => {
                    if (!erro) resultados.discos = discos
                    verificarConclusao()
                }
            )

            // busca de musica (com estilo)
            db.all(
                `SELECT m.*, e.nome as estilo_nome
                FROM musica m
                INNER JOIN estilo e ON m.estilo_id = e.estilo_id
                WHERE m.nome LIKE ?
                ORDER BY m.nome`,
                [`%${termo}%`],
                (erro, musicas) => {
                    if (!erro) resultados.musicas = musicas
                    verificarConclusao()
                }
            )

            // buscar estilos
            db.all(
                `SELECT * FROM estilos WHERE descricao LIKE ? ORDER BY descricao`,
                [`%${termo}%`],
                (erro, estilos) => {
                    if (!erro) resultados.estilos = estilos
                    verificarConclusao()
                }
            )

            // buscar gravadoras
            db.all(
                `SELECT * FROM gravadoras WHERE nome LIKE ? ORDER BY nome`,
                [`%${termo}%`]
            )
        })
    },

    // BUSCA PERSONALIZADA: ARTISTAS //

    artistasComPapeis: () => {
        console.log('>>> buscaService:artistasComPapeis')

        return new Promise((resolve, reject) => {
            db.all(
                `SELECT 
                a.artista_id,
                a.nome, 
                COUNT(DISTINCT i.musica_id) as total_interpretes,
                COUNT(DISTINCT i.musica_id) as total_interpretes,
                CASE
                    WHEN COUNT(DISTINCT i.musica_id) > 0 AND COUNT(DISTINCT c.musica_id) > 0 THEN 'ambos'
                    WHEN COUNT(DISTINCT i.musica_id) > 0 THEN 'interprete'
                    WHEN COUNT(DISTINCT c.musica_id) > 0 THEN 'compositor'
                    ELSE 'nenhum'
                END as papel_principal
                FROM artista a
                LEFT JOIN interprete i ON a.artista_id = i.artista_id
                LEFT JOIN compositor c ON a.artista_id = c.artista_id
                GROUP BY a.artista_id, a.nome
                ORDER BY a.nome`,
                [],
                (erro, artistas) => {
                    if (erro) {
                        console.error('Erro ao buscar artistas com papéis:', erro)
                        reject(erro)
                        return
                    }
                    resolve(artistas)
                }
            )

        })
    }




}

module.exports = buscaService