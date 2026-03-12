const db = require('../../../database/connection')

const buscarDetalhesCompletos = (discoId) => {
    console.log('>>> discoDetalhesService:buscarDetalhesCompletos > ID:', discoId)

    return new Promise((resolve, reject) => {
        const resultado = {}

        db.get(`
            SELECT 
                d.*,
                g.nome as gravadora_nome,
                g.gravadora_id,
                a.nome as interprete_principal_nome,
                a.artista_id as interprete_principal_id
            FROM disco d
            LEFT JOIN gravadora g ON d.gravadora_id = g.gravadora_id
            LEFT JOIN artista a ON d.interprete_principal_id = a.artista_id
            WHERE d.disco_id = ?
        `, [discoId], (erro, disco) => {
            if (erro) {
                console.error('Erro ao buscar disco:', erro)
                reject(erro)
                return
            }

            if (!disco) {
                reject(new Error('Disco não encontrado'))
                return
            }

            resultado.disco = disco

            db.all(`
                SELECT 
                    md.ordem,
                    m.musica_id,
                    m.nome as musica_nome,
                    m.duracao,
                    m.data_lancamento,
                    e.descricao as estilo_nome,
                    e.estilo_id,
                    (SELECT GROUP_CONCAT(a.nome, ' | ') 
                     FROM interprete i 
                     JOIN artista a ON i.artista_id = a.artista_id 
                     WHERE i.musica_id = m.musica_id) as interpretes_nomes,
                    (SELECT GROUP_CONCAT(a.nome, ' | ') 
                     FROM compositor c 
                     JOIN artista a ON c.artista_id = a.artista_id 
                     WHERE c.musica_id = m.musica_id) as compositores_nomes
                FROM musica_disco md
                INNER JOIN musica m ON md.musica_id = m.musica_id
                LEFT JOIN estilo e ON m.estilo_id = e.estilo_id
                WHERE md.disco_id = ?
                ORDER BY md.ordem ASC
            `, [discoId], (erro, musicas) => {
                if (erro) {
                    console.error('Erro ao buscar músicas do disco:', erro)
                    reject(erro)
                    return
                }

                resultado.musicas = musicas || []

                const totalMusicas = resultado.musicas.length
                
                let totalSegundos = 0
                resultado.musicas.forEach(musica => {
                    if (musica.duracao) {
                        const partes = musica.duracao.split(':')
                        if (partes.length === 2) {
                            totalSegundos += parseInt(partes[0]) * 60 + parseInt(partes[1])
                        }
                    }
                })

                const horas = Math.floor(totalSegundos / 3600)
                const minutos = Math.floor((totalSegundos % 3600) / 60)
                const segundos = totalSegundos % 60

                let duracaoTotal = ''
                if (horas > 0) {
                    duracaoTotal = `${horas}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
                } else {
                    duracaoTotal = `${minutos}:${segundos.toString().padStart(2, '0')}`
                }

                resultado.estatisticas = {
                    totalMusicas,
                    duracaoTotal,
                    totalSegundos
                }

                db.all(`
                    SELECT DISTINCT 
                        a.artista_id,
                        a.nome,
                        COUNT(DISTINCT i.musica_id) as musicas_interpretadas
                    FROM artista a
                    INNER JOIN interprete i ON a.artista_id = i.artista_id
                    INNER JOIN musica m ON i.musica_id = m.musica_id
                    INNER JOIN musica_disco md ON m.musica_id = md.musica_id
                    WHERE md.disco_id = ?
                    GROUP BY a.artista_id, a.nome
                    ORDER BY a.nome
                `, [discoId], (erro, interpretes) => {
                    if (erro) {
                        console.error('Erro ao buscar intérpretes do disco:', erro)
                        reject(erro)
                        return
                    }

                    resultado.interpretes = interpretes || []

                    db.all(`
                        SELECT DISTINCT 
                            a.artista_id,
                            a.nome,
                            COUNT(DISTINCT c.musica_id) as musicas_compostas
                        FROM artista a
                        INNER JOIN compositor c ON a.artista_id = c.artista_id
                        INNER JOIN musica m ON c.musica_id = m.musica_id
                        INNER JOIN musica_disco md ON m.musica_id = md.musica_id
                        WHERE md.disco_id = ?
                        GROUP BY a.artista_id, a.nome
                        ORDER BY a.nome
                    `, [discoId], (erro, compositores) => {
                        if (erro) {
                            console.error('Erro ao buscar compositores do disco:', erro)
                            reject(erro)
                            return
                        }

                        resultado.compositores = compositores || []

                        console.log('Detalhes completos carregados:', resultado)
                        resolve(resultado)
                    })
                })
            })
        })
    })
}

module.exports = {
    buscarDetalhesCompletos
}