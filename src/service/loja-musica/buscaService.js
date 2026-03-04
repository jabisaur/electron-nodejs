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
    },

    artistasFiltrados: (filtros = {}) => {
        console.log('>>> buscaService:artistasFiltrados >', filtros)

        return new Promise((resolve, reject) => {
            let query = `
            SELECT DISTINCT a.*
            FROM artista a`

            const parametros = []
            const condicoes = []

            // filtro por nome
            if(filtros.nome) {
                condicoes.push(`a.nome LIKE ?`)
                parametros.push(`%${filtros.nome}%`)
            }

            // filtro por interprete/compositor
            if (filtros.papel === 'interprete') {
                query += `INNER JOIN interprete i ON a.artista_id = i.artista_id`
            } 
            else if (filtros.papel === 'compositor') {
                query += `INNER JOIN compositor c ON a.artista_id = c.artista_id`

            }
            else if (filtros.papel === 'ambos') {
                query += `
                INNER JOIN interprete i ON a.artista_id = i.artista_id
                INNER JOIN compositor c ON a.artista_id = c.artista_id AND i.musica_id = c.musica_id`
            }

            if (filtros.papel === true) {
                query += ` INNER JOIN interprete i ON a.artista_id = i.artista_id `
            }

            if (condicoes.length > 0) {
                query += ` WHERE ` + condicoes.join(' AND ')
            }

            query += ` ORDER BY a.nome`

            db.all(query, parametros, (erro, artistas) => {
                if (erro) {
                    console.log('Erro ao buscar artistas filtrados:', erro)
                    reject (erro)
                    return
                }

                resolve(artistas)
            })
        })
    },

    // BUSCA DE DISCOS //
    discosCompletos: (filtros = {}) => {
        console.log('>>> buscaService:discosCompletos >', filtros)

        return new Promise((resolve, reject) => {
            let query = `
            SELECT 
            d.*, 
            g.nome as gravadora_nome,
            GROUP_CONCAT(DISTINCT a.nome) as artistas_nomes,
            COUNT(DISTINCT md.musica_id) as total_musicas
            FROM disco d
            LEFT JOIN gravadora g ON d.gravadora_id = d.gravadora_id
            LEFT JOIN musica_disco md ON d.disco_id = md.disco_id
            LEFT JOIN musica m ON d.musica_id = m.musica_id
            LEFT JOIN intereprete i ON m.musica_id = i.musica_id
            LEFT JOIN artista a ON i.artista_id = a.artista_id
            WHERE 1=1`

            const parametros = []

            if (filtros.nome) {
                query += `AND d.nome LIKE ?`
                parametros.push(`%${filtros.nome}%`)
            }

            if(filtros.gravadoraId) {
                query += `AND d.gravadora_id = ?`
                parametros.push(filtros.gravadoraId)
            }

            if(filtros.artistaId) {
                query += `AND i.artista_id = ?`
                parametros.push(filtros.artistaId)
            }

            if (filtros.anoInicio) {
                query += `AND d.data_lancamento >= ?`
                parametros.push(`${filtros.anoInicio}-01-01`)
            }

            if (filtros.anoFim){
                query += `AND d.data_lancamento <= ?`
                parametros.push(`${filtros.anoFim}-12-31`)
            }

            query += ` GROUP BY d.disco_id ORDER by d.nome`

            db.all(query, parametros, (erro, discos) => {
                if(erro){
                    console.log('Erro ao buscar discos completos:', erro)
                    reject(erro)
                    return
                }

                resolve (discos)
            })
        })

    },

    // BUSCA DE MUSICAS

    musicasComDetalhes: (filtros = {}) => {
        console.log('>>> buscaService:musicasComDetalhes >', filtros)

        return new Promise((resolve, reject) => {
            let query = `
            SELECT 
            m.*,
            e.descricao as estilo_nome,
            GROUP_CONCAT(DISTINCT ia.nome) as interpretes_nomes,
            GROUP_CONCAT(DISTINCT ca.nome) as compositores_nomes
            FROM musicas m
            INNER JOIN estilo e ON m.estilo_id = e.estilo_id
            LEFT JOIN interprete i ON m.musica_id = i.musica_id
            LEFT JOIN artista ia ON i.artista_id = ia.artista_id
            LEFT JOIN compositor c ON m.musica_id = c.musica_id
            LEFT JOIN artista ca ON c.artista_id = ca.artista_id
            WHERE 1=1`

            const parametros = []

            if (filtros.nome) {
                query += ` AND m.nome LIKE ?`
                params.push(`%${filtros.nome}%`)
            }

            if (filtros.estiloId) {
                query += ` AND m.estilo_id = ?`
                params.push(filtros.estiloId)
            }

            if (filtros.artistaId) {
                if (filtros.papel === 'interprete'){
                    query += ` AND i.artista_id = ?`
                }
                else if (filtros.papel === 'compositor') {
                    query += ` AND c.artista_id = ?`

                }
                else {
                    query += ` AND (i.artista_id = ? OR c.artista_id = ?)`
                    params.push(filtros.artistaId, filtros.artistaId)
                }
                if (!filtros.papel || filtros.papel !== 'ambos') {
                    params.push(filtros.artistaId)
                }
            }

            query += ` GROUP BY m.musica_id ORDER BY m.nome`

            db.all(query, params, (erro, musicas) => {
                if (erro) {
                    console.error('Erro ao buscar musicas com detalhes:', erro)
                    reject(erro)
                    return
                }
                resolve(musicas)
            })
        })
    }
}

module.exports = buscaService