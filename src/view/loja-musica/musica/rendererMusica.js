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
let todasMusicas = []
let musicasFiltradas = []
let paginaAtual = 1
let itensPorPagina = 10
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
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar estilos: ' + erro.message
        })
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
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar artistas: ' + erro.message
        })
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
        console.log('Carregando todas as músicas...')
        todasMusicas = await window.lojaMusica.musica.listar()
        console.log(`${todasMusicas.length} músicas carregadas`)
        
        musicasFiltradas = [...todasMusicas]
        aplicarFiltros()
        
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
    if (!filtroNome || !filtroEstilo || !filtroAno) return
    
    const nomeFiltro = filtroNome.value.toLowerCase().trim()
    const estiloId = filtroEstilo.value
    const anoFiltro = filtroAno.value
    
    musicasFiltradas = todasMusicas.filter(musica => {
        if (nomeFiltro && !musica.nome.toLowerCase().includes(nomeFiltro)) {
            return false
        }
        
        if (estiloId && musica.estilo_id != estiloId) {
            return false
        }
        
        if (anoFiltro) {
            const anoMusica = musica.data_lancamento ? new Date(musica.data_lancamento).getFullYear() : null
            if (anoMusica != anoFiltro) {
                return false
            }
        }
        
        return true
    })
    
    console.log(`${musicasFiltradas.length} músicas após filtros`)
    paginaAtual = 1
    atualizarTabela()
}

function limparFiltros() {
    if (filtroNome) filtroNome.value = ''
    if (filtroEstilo) filtroEstilo.value = ''
    if (filtroAno) filtroAno.value = ''
    aplicarFiltros()
}

function atualizarTabela() {
    if (!tbodyMusica) return
    
    const totalMusicas = musicasFiltradas.length
    const totalPaginas = Math.ceil(totalMusicas / itensPorPagina)
    const inicio = (paginaAtual - 1) * itensPorPagina
    const fim = Math.min(inicio + itensPorPagina, totalMusicas)
    const musicasPagina = musicasFiltradas.slice(inicio, fim)
    
    const totalMusicasCount = document.getElementById('totalMusicasCount')
    const paginacaoInfo = document.getElementById('paginacaoInfo')
    const resumoResultados = document.getElementById('resumoResultados')
    const btnAnterior = document.getElementById('btnAnterior')
    const btnProxima = document.getElementById('btnProxima')
    
    if (totalMusicasCount) totalMusicasCount.textContent = `${totalMusicas} música(s)`
    if (paginacaoInfo) paginacaoInfo.textContent = `Página ${paginaAtual} de ${totalPaginas || 1}`
    if (resumoResultados) {
        resumoResultados.textContent = totalMusicas === 0 
            ? `Mostrando 0 de 0 músicas`
            : `Mostrando ${inicio + 1}-${fim} de ${totalMusicas} músicas`
    }
    
    if (btnAnterior) btnAnterior.disabled = paginaAtual <= 1
    if (btnProxima) btnProxima.disabled = paginaAtual >= totalPaginas
    
    if (musicasPagina.length === 0) {
        tbodyMusica.innerHTML = '<tr><td colspan="9" class="text-center">Nenhuma música encontrada</td></tr>'
        return
    }
    
    let html = ''
    musicasPagina.forEach(musica => {
        const dataFormatada = musica.data_lancamento 
            ? new Date(musica.data_lancamento).toLocaleDateString('pt-BR') 
            : ''
        
        const interpretesTexto = musica.interpretes_nomes ? musica.interpretes_nomes.replace(/ \| /g, ', ') : 'Nenhum'
        const compositoresTexto = musica.compositores_nomes ? musica.compositores_nomes.replace(/ \| /g, ', ') : 'Nenhum'
        
        // Escapar aspas simples para não quebrar o onclick
        const nomeEscapado = musica.nome.replace(/'/g, "\\'")
        
        const checked = musicasSelecionadas.includes(musica.musica_id) ? 'checked' : ''
        
        html += `
            <tr>
                <td>
                    <input type="checkbox" class="musica-checkbox" value="${musica.musica_id}" 
                           ${checked} onchange="toggleSelecionarMusica(this, ${musica.musica_id})">
                </td>
                <td>${musica.musica_id}</td>
                <td>${musica.nome}</td>
                <td>${musica.duracao}</td>
                <td>${dataFormatada}</td>
                <td>${musica.estilo_nome || 'N/A'}</td>
                <td><small title="${interpretesTexto}">${interpretesTexto.substring(0, 30)}${interpretesTexto.length > 30 ? '...' : ''}</small></td>
                <td><small title="${compositoresTexto}">${compositoresTexto.substring(0, 30)}${compositoresTexto.length > 30 ? '...' : ''}</small></td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="editarMusica(${musica.musica_id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deletarMusica(${musica.musica_id}, '${nomeEscapado}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `
    })
    
    tbodyMusica.innerHTML = html
    atualizarBotaoSelecionadas()
}

function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--
        atualizarTabela()
    }
}

function proximaPagina() {
    const totalPaginas = Math.ceil(musicasFiltradas.length / itensPorPagina)
    if (paginaAtual < totalPaginas) {
        paginaAtual++
        atualizarTabela()
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
            window.dialog.exibirDialogMensagem({
                titulo: 'Campos obrigatórios',
                mensagem: 'Preencha todos os campos obrigatórios'
            })
            return
        }

        try {
            await window.lojaMusica.musica.criar({
                nome,
                duracao,
                data_lancamento,
                estilo_id: parseInt(estilo_id),
                interpretes,
                compositores
            })
            
            formMusica.reset()
            await carregarMusicas()
            
            window.dialog.exibirDialogMensagem({
                titulo: 'Sucesso',
                mensagem: `Música "${nome}" cadastrada com sucesso!`
            })
        } catch (erro) {
            console.error('Erro:', erro)
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao cadastrar música: ' + erro.message
            })
        } finally {
            mostrarLoading(false)
        }
    })
}

function configurarModalEdicao() {
    const modal = document.getElementById('edicaoMusicaModal')
    const btnConfirmar = document.getElementById('edicaoBtnConfirmar')
    const closeBtn = document.querySelector('#edicaoMusicaModal .close-btn')
    const btnCancelar = document.querySelector('#edicaoMusicaModal .btn-secondary')
    
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
            
            if (!dados.nome || !dados.duracao || !dados.data_lancamento || !dados.estilo_id || dados.interpretes.length === 0) {
                mostrarLoading(false)
                window.dialog.exibirDialogMensagem({
                    titulo: 'Campos obrigatórios',
                    mensagem: 'Preencha todos os campos obrigatórios'
                })
                return
            }
            
            try {
                await window.lojaMusica.musica.editar(musicaEditandoId, dados)
                await carregarMusicas()
                fecharModalEdicao()
                
                window.dialog.exibirDialogMensagem({
                    titulo: 'Sucesso',
                    mensagem: 'Música atualizada com sucesso!'
                })
            } catch (erro) {
                console.error('Erro ao editar:', erro)
                window.dialog.exibirDialogMensagem({
                    titulo: 'Erro',
                    mensagem: 'Erro ao editar música: ' + erro.message
                })
            } finally {
                mostrarLoading(false)
            }
        })
    }
    
    if (closeBtn) closeBtn.addEventListener('click', fecharModalEdicao)
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalEdicao)
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) fecharModalEdicao()
    })
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
        document.getElementById('edicaoMensagem').textContent = `Editando: ${musica.nome}`
        document.getElementById('edicaoNome').value = musica.nome
        document.getElementById('edicaoDuracao').value = musica.duracao
        document.getElementById('edicaoData').value = musica.data_lancamento.split('T')[0]

        let estiloHtml = '<option value="">Selecione...</option>'
        estilos.forEach(e => {
            estiloHtml += `<option value="${e.estilo_id}" ${e.estilo_id === musica.estilo_id ? 'selected' : ''}>${e.descricao}</option>`
        })
        document.getElementById('edicaoEstilo').innerHTML = estiloHtml

        const interpreteIds = interpretes.map(i => i.artista_id)
        let interpreteHtml = ''
        artistas.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(a => {
            const selected = interpreteIds.includes(a.artista_id) ? 'selected' : ''
            interpreteHtml += `<option value="${a.artista_id}" ${selected}>${a.nome}</option>`
        })
        document.getElementById('edicaoInterpretes').innerHTML = interpreteHtml

        const compositorIds = compositores.map(c => c.artista_id)
        let compositorHtml = ''
        artistas.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(a => {
            const selected = compositorIds.includes(a.artista_id) ? 'selected' : ''
            compositorHtml += `<option value="${a.artista_id}" ${selected}>${a.nome}</option>`
        })
        document.getElementById('edicaoCompositores').innerHTML = compositorHtml

        musicaEditandoId = id
        document.getElementById('edicaoMusicaModal').style.display = 'flex'
        
    } catch (erro) {
        console.error('Erro ao abrir edição:', erro)
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao abrir edição: ' + erro.message
        })
    } finally {
        mostrarLoading(false)
    }
}

function fecharModalEdicao() {
    document.getElementById('edicaoMusicaModal').style.display = 'none'
    musicaEditandoId = null
}

async function deletarMusica(id, nomeMusica) {
    console.log('>>> [RENDERER] Iniciando deleção da música ID:', id);

    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: `Tem certeza que deseja deletar a música "${nomeMusica}"?`
    });

    if (!confirmado) {
        console.log('>>> [RENDERER] Exclusão cancelada pelo usuário');
        return;
    }
    
    mostrarLoading(true);
    
    try {
        const resultado = await window.lojaMusica.musica.deletar(id);
        
        if (resultado && resultado.erro) {
            throw new Error(resultado.erro);
        }
        
        console.log('>>> [RENDERER] Deleção bem-sucedida, recarregando lista...');
        
        await carregarMusicas();
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Música "${nomeMusica}" deletada com sucesso!`
        });
    } catch (erro) {
        console.error('>>> [RENDERER] Erro ao deletar:', erro);
        
        let mensagem = erro.message;
        if (erro.message.includes('discos associados')) {
            mensagem = `Não é possível deletar: a música "${nomeMusica}" está associada a um ou mais discos.`;
        } else if (erro.message.includes('interprete') || erro.message.includes('compositor')) {
            mensagem = `Não é possível deletar: a música "${nomeMusica}" possui intérpretes ou compositores associados.`;
        }
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: mensagem
        });
    } finally {
        mostrarLoading(false);
    }
}

function atualizarBotaoSelecionadas() {
    const btn = document.getElementById('btnDeletarSelecionadas');
    const countSpan = document.getElementById('selectedCount');
    const count = musicasSelecionadas.length;
    
    if (btn) {
        btn.disabled = count === 0;
        countSpan.textContent = count;
    }
}

function selecionarTodas() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.musica-checkbox');
    
    checkboxes.forEach(cb => {
        cb.checked = selectAll.checked;
        const musicaId = parseInt(cb.value);
        
        if (selectAll.checked) {
            if (!musicasSelecionadas.includes(musicaId)) {
                musicasSelecionadas.push(musicaId);
            }
        } else {
            musicasSelecionadas = musicasSelecionadas.filter(id => id !== musicaId);
        }
    });
    
    atualizarBotaoSelecionadas();
}

function toggleSelecionarMusica(checkbox, musicaId) {
    if (checkbox.checked) {
        if (!musicasSelecionadas.includes(musicaId)) {
            musicasSelecionadas.push(musicaId);
        }
    } else {
        musicasSelecionadas = musicasSelecionadas.filter(id => id !== musicaId);
        document.getElementById('selectAll').checked = false;
    }
    
    atualizarBotaoSelecionadas();
}

async function deletarSelecionadas() {
    if (musicasSelecionadas.length === 0) {
        window.dialog.exibirDialogMensagem({
            titulo: 'Nenhuma seleção',
            mensagem: 'Selecione pelo menos uma música para deletar.'
        });
        return;
    }

    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão em massa',
        mensagem: `Tem certeza que deseja deletar ${musicasSelecionadas.length} música(s)?`
    });

    if (!confirmado) return;

    mostrarLoading(true);
    
    try {
        const ids = musicasSelecionadas;
        const resultado = await window.lojaMusica.musica.deletarMultiplas(ids);
        
        if (resultado && resultado.erro) {
            throw new Error(resultado.erro);
        }
        
        musicasSelecionadas = [];
        document.getElementById('selectAll').checked = false;
        
        await carregarMusicas();
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: resultado.mensagem || `${ids.length} música(s) deletada(s) com sucesso!`
        });
        
    } catch (erro) {
        console.error('Erro ao deletar múltiplas músicas:', erro);
        
        let mensagem = erro.message;
        if (erro.message.includes('discos associados')) {
            mensagem = 'Algumas músicas estão associadas a discos e não podem ser deletadas.';
        }
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: mensagem
        });
    } finally {
        mostrarLoading(false);
        atualizarBotaoSelecionadas();
    }
}

// tornar funções globais
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