const formMusica = document.getElementById('form-musica')
const tbodyMusica = document.getElementById('tbody-musicas')
const selectEstilo = document.getElementById('estilo_id')
const selectInterpretes = document.getElementById('interpretes')
const selectCompositores = document.getElementById('compositores')
const filtroNome = document.getElementById('filtroNome')
const filtroEstilo = document.getElementById('filtroEstilo')
const filtroAno = document.getElementById('filtroAno')
const loadingOverlay = document.getElementById('loadingOverlay')

let musicaEditandoId = null
let musicasFiltradas = []
let paginaAtual = 1
let itensPorPagina = 10
let totalMusicasNoBanco = 0
let musicasSelecionadas = []

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada')
    carregarEstilos()
    carregarArtistas()
    carregarMusicas()
    configurarModalEdicao()
    carregarAnos()
    
    if (filtroNome) {
        filtroNome.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') aplicarFiltros()
        })
    }
})

async function carregarEstilos() {
    try {
        const estilos = await window.lojaMusica.estilo.listar()
        if (selectEstilo) {
            selectEstilo.innerHTML = '<option value="">Selecione um estilo...</option>'
            estilos.forEach(estilo => {
                selectEstilo.innerHTML += `<option value="${estilo.estilo_id}">${estilo.descricao}</option>`
            })
        }
        
        if (filtroEstilo) {
            filtroEstilo.innerHTML = '<option value="">Todos os estilos</option>'
            estilos.sort((a, b) => a.descricao.localeCompare(b.descricao)).forEach(estilo => {
                filtroEstilo.innerHTML += `<option value="${estilo.estilo_id}">${estilo.descricao}</option>`
            })
        }
    } catch (erro) {
        console.error('Erro ao carregar estilos:', erro)
    }
}

async function carregarArtistas() {
    try {
        const artistas = await window.lojaMusica.artista.listar()
        artistas.sort((a, b) => a.nome.localeCompare(b.nome))
        
        if (selectInterpretes) {
            selectInterpretes.innerHTML = '<option value="">Selecione os intérpretes...</option>'
            artistas.forEach(artista => {
                selectInterpretes.innerHTML += `<option value="${artista.artista_id}">${artista.nome}</option>`
            })
        }
        
        if (selectCompositores) {
            selectCompositores.innerHTML = '<option value="">Selecione os compositores...</option>'
            artistas.forEach(artista => {
                selectCompositores.innerHTML += `<option value="${artista.artista_id}">${artista.nome}</option>`
            })
        }
    } catch (erro) {
        console.error('Erro ao carregar artistas:', erro)
    }
}

function carregarAnos() {
    if (!filtroAno) return
    const anoAtual = new Date().getFullYear()
    filtroAno.innerHTML = '<option value="">Todos os anos</option>'
    for (let ano = anoAtual; ano >= 1900; ano--) {
        filtroAno.innerHTML += `<option value="${ano}">${ano}</option>`
    }
}

async function carregarMusicas() {
    mostrarLoading(true)
    try {
        const filtros = {
            nome: filtroNome ? filtroNome.value.trim() : '',
            estilo_id: filtroEstilo ? filtroEstilo.value : '',
            ano: filtroAno ? filtroAno.value : ''
        }

        musicasFiltradas = await window.lojaMusica.musica.listar(paginaAtual, itensPorPagina, filtros)
        totalMusicasNoBanco = await window.lojaMusica.musica.contarTotal(filtros)
        
        atualizarTabela()
        
    } catch (erro) {
        console.error('Erro ao carregar músicas:', erro)
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar músicas: ' + erro.message
        })
    } finally {
        mostrarLoading(false)
    }
}

function aplicarFiltros() {
    paginaAtual = 1
    carregarMusicas()
}

function limparFiltros() {
    if (filtroNome) filtroNome.value = ''
    if (filtroEstilo) filtroEstilo.value = ''
    if (filtroAno) filtroAno.value = ''
    aplicarFiltros()
}

function atualizarTabela() {
    if (!tbodyMusica) return
    
    const totalPaginas = Math.ceil(totalMusicasNoBanco / itensPorPagina)
    const inicioDisplay = (paginaAtual - 1) * itensPorPagina + 1
    const fimDisplay = Math.min(paginaAtual * itensPorPagina, totalMusicasNoBanco)
    
    const totalMusicasCount = document.getElementById('totalMusicasCount')
    const paginacaoInfo = document.getElementById('paginacaoInfo')
    const resumoResultados = document.getElementById('resumoResultados')
    const btnAnterior = document.getElementById('btnAnterior')
    const btnProxima = document.getElementById('btnProxima')
    
    if (totalMusicasCount) totalMusicasCount.textContent = `${totalMusicasNoBanco} música(s)`
    if (paginacaoInfo) paginacaoInfo.textContent = `Página ${paginaAtual} de ${totalPaginas || 1}`
    if (resumoResultados) {
        resumoResultados.textContent = totalMusicasNoBanco === 0 
            ? `Mostrando 0 de 0 músicas`
            : `Mostrando ${inicioDisplay}-${fimDisplay} de ${totalMusicasNoBanco} músicas`
    }
    
    if (btnAnterior) btnAnterior.disabled = paginaAtual <= 1
    if (btnProxima) btnProxima.disabled = paginaAtual >= totalPaginas
    
    if (musicasFiltradas.length === 0) {
        tbodyMusica.innerHTML = '<tr><td colspan="9" class="text-center">Nenhuma música encontrada</td></tr>'
        return
    }
    
    let html = ''
    musicasFiltradas.forEach(musica => {
        const dataFormatada = musica.data_lancamento 
            ? new Date(musica.data_lancamento).toLocaleDateString('pt-BR') 
            : ''
        
        const interpretesTexto = musica.interpretes_nomes ? musica.interpretes_nomes.replace(/ \| /g, ', ') : 'Nenhum'
        const compositoresTexto = musica.compositores_nomes ? musica.compositores_nomes.replace(/ \| /g, ', ') : 'Nenhum'
        const nomeEscapado = musica.nome.replace(/'/g, "\\'")
        const checked = musicasSelecionadas.includes(musica.musica_id) ? 'checked' : ''
        
        html += `
            <tr>
                <td><input type="checkbox" class="musica-checkbox" value="${musica.musica_id}" ${checked} onchange="toggleSelecionarMusica(this, ${musica.musica_id})"></td>
                <td>${musica.musica_id}</td>
                <td>${musica.nome}</td>
                <td>${musica.duracao}</td>
                <td>${dataFormatada}</td>
                <td>${musica.estilo_nome || 'N/A'}</td>
                <td><small title="${interpretesTexto}">${interpretesTexto.substring(0, 30)}${interpretesTexto.length > 30 ? '...' : ''}</small></td>
                <td><small title="${compositoresTexto}">${compositoresTexto.substring(0, 30)}${compositoresTexto.length > 30 ? '...' : ''}</small></td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="editarMusica(${musica.musica_id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deletarMusica(${musica.musica_id}, '${nomeEscapado}')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`
    })
    
    tbodyMusica.innerHTML = html
    atualizarBotaoSelecionadas()
}

function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--
        carregarMusicas()
    }
}

function proximaPagina() {
    const totalPaginas = Math.ceil(totalMusicasNoBanco / itensPorPagina)
    if (paginaAtual < totalPaginas) {
        paginaAtual++
        carregarMusicas()
    }
}

function mostrarLoading(mostrar) {
    if (loadingOverlay) {
        loadingOverlay.style.display = mostrar ? 'flex' : 'none'
    }
}

if (formMusica) {
    formMusica.addEventListener('submit', async (e) => {
        e.preventDefault()
        mostrarLoading(true)
        
        const nome = document.getElementById('nome').value.trim()
        const duracao = document.getElementById('duracao').value.trim()
        const data_lancamento = document.getElementById('data_lancamento').value
        const estilo_id = document.getElementById('estilo_id').value
        const interpretes = Array.from(selectInterpretes.selectedOptions).map(opt => parseInt(opt.value))
        const compositores = Array.from(selectCompositores.selectedOptions).map(opt => parseInt(opt.value))

        if (!nome || !duracao || !data_lancamento || !estilo_id || interpretes.length === 0) {
            mostrarLoading(false)
            window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: 'Preencha os campos obrigatórios' })
            return
        }

        try {
            await window.lojaMusica.musica.criar({ nome, duracao, data_lancamento, estilo_id: parseInt(estilo_id), interpretes, compositores })
            formMusica.reset()
            await carregarMusicas()
            window.dialog.exibirDialogMensagem({ titulo: 'Sucesso', mensagem: `Música "${nome}" cadastrada!` })
        } catch (erro) {
            console.error(erro)
        } finally {
            mostrarLoading(false)
        }
    })
}

function configurarModalEdicao() {
    const btnConfirmar = document.getElementById('edicaoBtnConfirmar')
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => {
            if (!musicaEditandoId) return
            mostrarLoading(true)
            const dados = {
                nome: document.getElementById('edicaoNome').value,
                duracao: document.getElementById('edicaoDuracao').value,
                data_lancamento: document.getElementById('edicaoData').value,
                estilo_id: parseInt(document.getElementById('edicaoEstilo').value),
                interpretes: Array.from(document.getElementById('edicaoInterpretes').selectedOptions).map(opt => parseInt(opt.value)),
                compositores: Array.from(document.getElementById('edicaoCompositores').selectedOptions).map(opt => parseInt(opt.value))
            }
            try {
                await window.lojaMusica.musica.editar(musicaEditandoId, dados)
                await carregarMusicas()
                fecharModalEdicao()
            } catch (erro) {
                console.error(erro)
            } finally {
                mostrarLoading(false)
            }
        })
    }
}

async function editarMusica(id) {
    mostrarLoading(true)
    try {
        const musica = await window.lojaMusica.musica.buscar(id)
        const interpretes = await window.lojaMusica.musica.buscarInterpretes(id)
        const compositores = await window.lojaMusica.musica.buscarCompositores(id)
        const artistas = await window.lojaMusica.artista.listar()
        const estilos = await window.lojaMusica.estilo.listar()

        document.getElementById('edicaoTitulo').textContent = 'Editar Música'
        document.getElementById('edicaoNome').value = musica.nome
        document.getElementById('edicaoDuracao').value = musica.duracao
        document.getElementById('edicaoData').value = musica.data_lancamento.split('T')[0]

        let estiloHtml = '<option value="">Selecione...</option>'
        estilos.forEach(e => {
            estiloHtml += `<option value="${e.estilo_id}" ${e.estilo_id === musica.estilo_id ? 'selected' : ''}>${e.descricao}</option>`
        })
        document.getElementById('edicaoEstilo').innerHTML = estiloHtml

        const intIds = interpretes.map(i => i.artista_id)
        let intHtml = ''
        artistas.forEach(a => intHtml += `<option value="${a.artista_id}" ${intIds.includes(a.artista_id) ? 'selected' : ''}>${a.nome}</option>`)
        document.getElementById('edicaoInterpretes').innerHTML = intHtml

        const compIds = compositores.map(c => c.artista_id)
        let compHtml = ''
        artistas.forEach(a => compHtml += `<option value="${a.artista_id}" ${compIds.includes(a.artista_id) ? 'selected' : ''}>${a.nome}</option>`)
        document.getElementById('edicaoCompositores').innerHTML = compHtml

        musicaEditandoId = id
        document.getElementById('edicaoMusicaModal').style.display = 'flex'
    } finally {
        mostrarLoading(false)
    }
}

function fecharModalEdicao() {
    document.getElementById('edicaoMusicaModal').style.display = 'none'
    musicaEditandoId = null
}

async function deletarMusica(id, nomeMusica) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: `Tem certeza que deseja deletar a música "${nomeMusica}"?`
    })
    if (!confirmado) return
    
    mostrarLoading(true)
    try {
        await window.lojaMusica.musica.deletar(id)
        await carregarMusicas()
    } catch (erro) {
        window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: erro.message })
    } finally {
        mostrarLoading(false)
    }
}

function atualizarBotaoSelecionadas() {
    const btn = document.getElementById('btnDeletarSelecionadas')
    const countSpan = document.getElementById('selectedCount')
    if (btn) {
        btn.disabled = musicasSelecionadas.length === 0
        countSpan.textContent = musicasSelecionadas.length
    }
}

function selecionarTodas() {
    const selectAll = document.getElementById('selectAll')
    const checkboxes = document.querySelectorAll('.musica-checkbox')
    checkboxes.forEach(cb => {
        cb.checked = selectAll.checked
        const id = parseInt(cb.value)
        if (selectAll.checked) {
            if (!musicasSelecionadas.includes(id)) musicasSelecionadas.push(id)
        } else {
            musicasSelecionadas = musicasSelecionadas.filter(mid => mid !== id)
        }
    })
    atualizarBotaoSelecionadas()
}

function toggleSelecionarMusica(checkbox, musicaId) {
    if (checkbox.checked) {
        if (!musicasSelecionadas.includes(musicaId)) musicasSelecionadas.push(musicaId)
    } else {
        musicasSelecionadas = musicasSelecionadas.filter(id => id !== musicaId)
        document.getElementById('selectAll').checked = false
    }
    atualizarBotaoSelecionadas()
}

async function deletarSelecionadas() {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão em massa',
        mensagem: `Deletar ${musicasSelecionadas.length} música(s)?`
    })
    if (!confirmado) return
    mostrarLoading(true)
    try {
        await window.lojaMusica.musica.deletarMultiplas(musicasSelecionadas)
        musicasSelecionadas = []
        document.getElementById('selectAll').checked = false
        await carregarMusicas()
    } finally {
        mostrarLoading(false)
        atualizarBotaoSelecionadas()
    }
}


window.editarMusica = editarMusica
window.deletarMusica = deletarMusica
window.fecharModalEdicao = fecharModalEdicao
window.aplicarFiltros = aplicarFiltros
window.limparFiltros = limparFiltros
window.paginaAnterior = paginaAnterior
window.proximaPagina = proximaPagina
window.deletarSelecionadas = deletarSelecionadas
window.selecionarTodas = selecionarTodas
window.toggleSelecionarMusica = toggleSelecionarMusica