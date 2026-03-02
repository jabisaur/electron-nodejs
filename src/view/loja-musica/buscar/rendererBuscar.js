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

// tbdoies
const tbodyArtistas = document.getElementById('tbodyArtistas')
const tbodyDiscos = document.getElementById('tbodyDiscos')
const tbodyMusicas = document.getElementById('tbodyMusicas')
const tbodyEstilos = document.getElementById('tbodyEstilos')
const tbodyGravadoras = document.getElementById('tbodyGravadoras')

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de busca carregada')

    // se veio com parâmetro na URL, faz a busca automaticamente
    const urlParams = new URLSearchParams(window.location.search)
    const termo = urlParams.get('q')
    if (termo) {
        termoBusca.value = termo
        realizarBusca(termo, tipoBusca.value)
    }
});

if (formBusca) {
    formBusca.addEventListener('submit', async (event) => {
        event.preventDefault()

        const termo = termoBusca.value.trim()

        if(!termo) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Atenção',
                mensagem: 'Por favor, digite um termo para buscar'
            })
            return
        }

        await realizarBusca(termo, tipoBusca.value)

    })
};

async function realizarBusca(termo, tipo) {
    console.log(`Buscando por "${termo}" em ${tipo}`)

    esconderTodosResultados()

    try {
        let encontrouAlgo = false

        if (tipo === 'todos' || tipo === 'artistas') {
            await buscarArtistas(termo)
            encontrouAlgo = true
        }

        if (tipo === 'todos' || tipo === 'discos') {
            await buscarDiscos(termo)
            encontrouAlgo = true
        }

        if (tipo === 'todos' || tipo === 'estilos') {
            await buscarEstilos(termo)
            encontrouAlgo = true
        }

        if (tipo === 'todos' || tipo === 'gravadoras') {
            await buscarGravadoras(termo)
            encontrouAlgo = true
        }

        if (tipo === 'todos' || tipo === 'musicas') {
            const encontrou = await buscarMusicas(termo)
            if (encontrou) encontrouAlgo = true
        }

        // verificando se algum resultado foi encontrado
        const algumResultado = verificarResultados()
        
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
    
};

async function buscarArtistas(termo) {
    try {
        const artistas = await window.lojaMusica.artista.listar()

        const artistasFiltrados = artistas.filter(artista =>
            artista.nome.toLowerCase().includes(termo.toLowerCase())
        )

        if (artistasFiltrados.length > 0) {
            resultadosArtistas.style.display = 'block'

            let html = ''

            artistasFiltrados.forEach(artista => {
                const nomeEscapado = artista.nome.replace(/'/g, "\\'")
                html += `
                    <tr>
                        <td>${artista.artista_id}</td>
                        <td>${artista.nome}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" 
                                    onclick="window.open('../artista/artista.html')">
                                Ver detalhes
                            </button>
                        </td>
                    </tr>`
            })

            tbodyArtistas.innerHTML = html
            return true
        }

        return false
        
    } catch (erro) {
        console.error('Erro ao buscar artistas:', erro)
        return false
    }  
};

async function buscarDiscos(termo) {
    try {
        const discos = await window.lojaMusica.disco.listar()

        const discosFiltrados = discos.filter(disco => 
            disco.nome.toLowerCase().includes(termo.toLowerCase())
        )

        if (discosFiltrados.length > 0) {
            resultadosDiscos.style.display = 'block'

            let html = ''
            for (const disco of discosFiltrados) {
                
                let dataFormatada = 'Data inválida'
                if (disco.data_lancamento) {
                    const partes = disco.data_lancamento.split('T')[0].split('-')
                    if (partes.length === 3) {
                        dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`
                    }
                }

                let interpretesTexto = 'Carregando...'
                try {
                    const interpretes = await window.lojaMusica.disco.getInterpretes(disco.disco_id)
                    if (interpretes && interpretes.length > 0){
                        interpretesTexto = interpretes.map(i => i.nome).join(', ')
                    } else {
                        interpretesTexto = 'Sem intérprete'
                    }
                    
                } catch (e) {
                    interpretesTexto = 'Erro ao carregar'  
                }

                html += `
                    <tr>
                        <td>${disco.disco_id}</td>
                        <td>
                            ${disco.imagem ? `<img src="${disco.imagem}" alt="Capa" style="width: 50px; height: 50px; object-fit: cover;">` : '📀'}
                        </td>
                        <td>${disco.nome}<br><small class="text-muted">${interpretesTexto}</small></td>
                        <td>${dataFormatada}</td>
                        <td>${disco.gravadora_nome || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-info" 
                                    onclick="window.open('../disco/disco.html')">
                                Ver detalhes
                            </button>
                        </td>
                    </tr>`
            }

            tbodyMusicas.innerHTML = html
            return true
        }

        return false
        
    } catch (erro) {
        console.error('Erro ao buscar discos:', erro)
        return false
    }
};

async function buscarMusicas(termo) {
    try {
        const musicas = await window.lojaMusica.musica.listar()

        const musicasFiltradas = musicas.filter(musica =>
            musica.nome.toLowerCase().includes(termo.toLowerCase())
        )

        if (musicasFiltradas.length > 0){
            resultadosMusicas.style.display = 'block'

            let html = ''

            for (const musica of musicasFiltradas) {
                let dataFormatada = 'Data inválida'
                
                if (musica.data_lancamento) {
                    const partes = musica.data_lancamento.split('T')[0].split('-')
                    if (partes.length === 3) {
                        dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`
                    } else {
                        // fallback para o formato padrão
                        try {
                            const data = new Date(musica.data_lancamento + 'T12:00:00')
                            dataFormatada = data.toLocaleDateString('pt-BR')
                        } catch (e) {
                            console.error('Erro ao formatar data:', e)
                        }
                    }
                }

                let interpretesTexto = 'Carregando...'
                try {
                    const interpretes = await window.lojaMusica.musica.buscarInterpretes(musica.musica_id)
                    if (interpretes && interpretes.length > 0) {
                        interpretesTexto = interpretes.map(i => i.nome).join(', ')
                    } else {
                        interpretesTexto = 'Sem intérprete'
                    }
                } catch (e) {
                    interpretesTexto = 'Erro ao carregar'
                }
                
                html += `
                    <tr>
                        <td>${musica.musica_id}</td>
                        <td>${musica.nome}</td>
                        <td>${musica.duracao}</td>
                        <td>${dataFormatada}</td>
                        <td>${musica.estilo_nome || 'N/A'}</td>
                        <td>${interpretesTexto}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" 
                                    onclick="window.open('../musica/musica.html')">
                                Ver detalhes
                            </button>
                        </td>
                    </tr>`
            }
            
            tbodyMusicas.innerHTML = html
            return true
        }

        return false
        
    } catch (erro) {
        console.error('Erro ao buscar músicas:', erro)
        return false
    }
}

async function buscarEstilos(termo) {
    try {
        const estilos = await window.lojaMusica.estilo.listar()

        const estilosFiltrados = estilos.filter(estilo => 
            estilo.descricao.toLowerCase().includes(termo.toLowerCase())
        )

        if (estilosFiltrados.length > 0){
            resultados.style.display = 'block'

            let html = ''
            estilosFiltrados.forEach(estilo => {
                html += `
                    <tr>
                        <td>${estilo.estilo_id}</td>
                        <td>${estilo.descricao}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" 
                                    onclick="window.open('../estilo/estilo.html')">
                                Ver detalhes
                            </button>
                        </td>
                    </tr>`
            })

            tbodyEstilos.innerHTML = html
            return true
        }

        return false
        
    } catch (erro) {
        console.error('Erro ao buscar estilos:', erro)
        return false
    }
};

async function buscarGravadora(termo){
    try {
        const gravadoras = await window.lojaMusica.gravadora.listar()

        const gravadorasFiltradas = gravadora.filter(gravadora =>
            gravadora.nome.toLowerCase().includes(termo.toLowerCase())
        )

        if (gravadorasFiltradas.length > 0) {
            resultadosGravadoras.style.display = 'block'

            let html = ''
            gravadorasFiltradas.forEach(gravadora => {
                html += `
                    <tr>
                        <td>${gravadora.gravadora_id}</td>
                        <td>${gravadora.nome}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" 
                                    onclick="window.open('../gravadora/gravadora.html')">
                                Ver detalhes
                            </button>
                        </td>
                    </tr>`
            })

            tbodyGravadoras.innerHTML = html
            return true
        }

        return false
        
    } catch (erro) {
        console.error('Erro ao buscar gravadoras:', erro)
        return false
    }
};

function esconderTodosResultados() {
    resultadosArtistas.style.display = 'none'
    resultadosDiscos.style.display = 'none'
    resultadosMusicas.style.display = 'none'
    resultadosEstilos.style.display = 'none'
    resultadosGravadoras.style.display = 'none'
    semResultados.style.display = 'none'
};

function verificarResultados() {
    return resultadosArtistas.style.display === 'block' ||
           resultadosDiscos.style.display === 'block' ||
           resultadosMusicas.style.display === 'block' || 
           resultadosEstilos.style.display === 'block' ||
           resultadosGravadoras.style.display === 'block'
}
