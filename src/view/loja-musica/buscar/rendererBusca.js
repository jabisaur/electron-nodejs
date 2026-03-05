const formBusca = document.getElementById('form-busca')
const termoBusca = document.getElementById('termoBusca')
const tipoBusca = document.getElementById('tipoBusca')

// resultados
const resultadosArtistas = document.getElementById('resultadosArtistas')
const resultadosDiscos = document.getElementById('resultadosDiscos')
const resultadosMusicas = document.getElementById('resultadosMusicas')
const resultadosEstilos = document.getElementById('resultadosEstilos')
const resultadosGravadoras = document.getElementById('resultadosGravadoras')
const semResultados = document.getElementById('semResultados')

// tbodies
const tbodyArtistas = document.getElementById('tbodyArtistas')
const tbodyDiscos = document.getElementById('tbodyDiscos')
const tbodyMusicas = document.getElementById('tbodyMusicas')
const tbodyEstilos = document.getElementById('tbodyEstilos')
const tbodyGravadoras = document.getElementById('tbodyGravadoras')

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de busca carregada')
})

if (formBusca) {
    formBusca.addEventListener('submit', async (event) => {
        event.preventDefault()

        const termo = termoBusca.value.trim()

        if (!termo) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Atenção',
                mensagem: 'Por favor, digite um termo para buscar'
            })
            return
        }

        await realizarBusca(termo, tipoBusca.value)
    })
}

async function realizarBusca(termo, tipo) {
    console.log(`Buscando por "${termo}" em ${tipo}`)

    esconderTodosResultados()

    try {
        let algumResultado = false

        // busca global
        if (tipo === 'todos') {
            const resultados = await window.lojaMusica.busca.global(termo)
            
            if (resultados.artistas && resultados.artistas.length > 0) {
                exibirArtistas(resultados.artistas)
                algumResultado = true
            }
            
            if (resultados.discos && resultados.discos.length > 0) {
                exibirDiscos(resultados.discos)
                algumResultado = true
            }
            
            if (resultados.musicas && resultados.musicas.length > 0) {
                exibirMusicas(resultados.musicas)
                algumResultado = true
            }
            
            if (resultados.estilos && resultados.estilos.length > 0) {
                exibirEstilos(resultados.estilos)
                algumResultado = true
            }
            
            if (resultados.gravadoras && resultados.gravadoras.length > 0) {
                exibirGravadoras(resultados.gravadoras)
                algumResultado = true
            }
        } 
        // buscas específicas
        else {
            if (tipo === 'artistas') {
                const artistas = await window.lojaMusica.busca.artistasFiltrados({ nome: termo })
                if (artistas && artistas.length > 0) {
                    exibirArtistas(artistas)
                    algumResultado = true
                } else {
                    resultadosArtistas.style.display = 'block'
                    tbodyArtistas.innerHTML = `<tr><td colspan="3" class="text-center">Nenhum artista encontrado</td></tr>`
                }
            }

            if (tipo === 'discos') {
                const discos = await window.lojaMusica.busca.discosCompletos({ nome: termo })
                if (discos && discos.length > 0) {
                    exibirDiscos(discos)
                    algumResultado = true
                } else {
                    resultadosDiscos.style.display = 'block'
                    tbodyDiscos.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum disco encontrado</td></tr>`
                }
            }

            if (tipo === 'musicas') {
                const musicas = await window.lojaMusica.busca.musicasComDetalhes({ nome: termo })
                if (musicas && musicas.length > 0) {
                    exibirMusicas(musicas)
                    algumResultado = true
                } else {
                    resultadosMusicas.style.display = 'block'
                    tbodyMusicas.innerHTML = `<tr><td colspan="7" class="text-center">Nenhuma música encontrada</td></tr>`
                }
            }

            if (tipo === 'estilos') {
                const estilos = await window.lojaMusica.estilo.listar()
                const estilosFiltrados = estilos.filter(estilo => 
                    estilo.descricao.toLowerCase().includes(termo.toLowerCase())
                )
                if (estilosFiltrados.length > 0) {
                    exibirEstilos(estilosFiltrados)
                    algumResultado = true
                } else {
                    resultadosEstilos.style.display = 'block'
                    tbodyEstilos.innerHTML = `<tr><td colspan="3" class="text-center">Nenhum estilo encontrado</td></tr>`
                }
            }

            if (tipo === 'gravadoras') {
                const gravadoras = await window.lojaMusica.gravadora.listar()
                const gravadorasFiltradas = gravadoras.filter(gravadora =>
                    gravadora.nome.toLowerCase().includes(termo.toLowerCase())
                )
                if (gravadorasFiltradas.length > 0) {
                    exibirGravadoras(gravadorasFiltradas)
                    algumResultado = true
                } else {
                    resultadosGravadoras.style.display = 'block'
                    tbodyGravadoras.innerHTML = `<tr><td colspan="3" class="text-center">Nenhuma gravadora encontrada</td></tr>`
                }
            }
        }

        if (!algumResultado) {
            semResultados.style.display = 'block'
        }

    } catch (erro) {
        console.error('Erro na busca:', erro)
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao realizar busca: ' + erro.message
        })
    }
}

function exibirArtistas(artistas) {
    resultadosArtistas.style.display = 'block'
    
    let html = ''
    artistas.forEach(artista => {
        html += `
            <tr>
                <td>${artista.artista_id}</td>
                <td>${artista.nome}</td>
                <td>
                    <button class="btn btn-sm btn-primary" 
                            onclick="abrirArtista(${artista.artista_id})">
                        Ver detalhes
                    </button>
                </td>
            </tr>`
    })
    
    tbodyArtistas.innerHTML = html
}

function exibirDiscos(discos) {
    resultadosDiscos.style.display = 'block'
    
    let html = ''
    discos.forEach(disco => {
        let dataFormatada = 'Data inválida'
        if (disco.data_lancamento) {
            try {
                const data = new Date(disco.data_lancamento + 'T12:00:00')
                dataFormatada = data.toLocaleDateString('pt-BR')
            } catch (e) {
                console.error('Erro ao formatar data:', e)
            }
        }

        html += `
            <tr>
                <td>${disco.disco_id}</td>
                <td>
                    ${disco.imagem_caminho ? 
                        `<img src="${disco.imagem_caminho}" alt="Capa" style="width: 50px; height: 50px; object-fit: cover;">` : 
                        '📀'}
                </td>
                <td>${disco.nome}</td>
                <td>${dataFormatada}</td>
                <td>${disco.gravadora_nome || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-info" 
                            onclick="abrirDisco(${disco.disco_id})">
                        Ver detalhes
                    </button>
                </td>
            </tr>`
    })
    
    tbodyDiscos.innerHTML = html
}

async function exibirMusicas(musicas) {
    resultadosMusicas.style.display = 'block'
    
    let html = ''
    
    for (const musica of musicas) {
        let dataFormatada = 'Data inválida'
        if (musica.data_lancamento) {
            try {
                const data = new Date(musica.data_lancamento + 'T12:00:00')
                dataFormatada = data.toLocaleDateString('pt-BR')
            } catch (e) {
                console.error('Erro ao formatar data:', e)
            }
        }

        let interpretesTexto = musica.interpretes_nomes || 'Carregando...'
        if (!musica.interpretes_nomes && musica.musica_id) {
            try {
                const interpretes = await window.lojaMusica.musica.buscarInterpretes(musica.musica_id)
                interpretesTexto = interpretes && interpretes.length > 0 
                    ? interpretes.map(i => i.nome).join(', ') 
                    : 'Sem intérprete'
            } catch (e) {
                interpretesTexto = 'Erro ao carregar'
            }
        }
        
        html += `
            <tr>
                <td>${musica.musica_id}</td>
                <td>${musica.nome}</td>
                <td>${musica.duracao || '-'}</td>
                <td>${dataFormatada}</td>
                <td>${musica.estilo_nome || 'N/A'}</td>
                <td>${interpretesTexto}</td>
                <td>
                    <button class="btn btn-sm btn-primary" 
                            onclick="abrirMusica(${musica.musica_id})">
                        Ver detalhes
                    </button>
                </td>
            </tr>`
    }
    
    tbodyMusicas.innerHTML = html
}

function exibirEstilos(estilos) {
    resultadosEstilos.style.display = 'block'
    
    let html = ''
    estilos.forEach(estilo => {
        html += `
            <tr>
                <td>${estilo.estilo_id}</td>
                <td>${estilo.descricao}</td>
                <td>
                    <button class="btn btn-sm btn-primary" 
                            onclick="abrirEstilo(${estilo.estilo_id})">
                        Ver detalhes
                    </button>
                </td>
            </tr>`
    })
    
    tbodyEstilos.innerHTML = html
}

function exibirGravadoras(gravadoras) {
    resultadosGravadoras.style.display = 'block'
    
    let html = ''
    gravadoras.forEach(gravadora => {
        html += `
            <tr>
                <td>${gravadora.gravadora_id}</td>
                <td>${gravadora.nome}</td>
                <td>
                    <button class="btn btn-sm btn-primary" 
                            onclick="abrirGravadora(${gravadora.gravadora_id})">
                        Ver detalhes
                    </button>
                </td>
            </tr>`
    })
    
    tbodyGravadoras.innerHTML = html
}

// funçoes de navegação
function abrirArtista(id) {
    window.location.href = `../artista/artista.html?id=${id}`
}

function abrirDisco(id) {
    window.location.href = `../disco/disco.html?id=${id}`
}

function abrirMusica(id) {
    window.location.href = `../musica/musica.html?id=${id}`
}

function abrirEstilo(id) {
    window.location.href = `../estilo/estilo.html?id=${id}`
}

function abrirGravadora(id) {
    window.location.href = `../gravadora/gravadora.html?id=${id}`
}

function esconderTodosResultados() {
    resultadosArtistas.style.display = 'none'
    resultadosDiscos.style.display = 'none'
    resultadosMusicas.style.display = 'none'
    resultadosEstilos.style.display = 'none'
    resultadosGravadoras.style.display = 'none'
    semResultados.style.display = 'none'
}
