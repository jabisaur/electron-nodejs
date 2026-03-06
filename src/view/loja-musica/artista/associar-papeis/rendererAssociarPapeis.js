let artistas = [];
let artistasSelecionados = null
let papelSelecionado = null
let acaoConfirmarCallback = null

const elementos = {
    listaArtistas: document.getElementById('listaArtistas'),
    filtroArtistas: document.getElementById('filtroArtistas'),
    artistaSelecionado: document.getElementById('artistaSelecionado'),
    nenhumArtistaSelecionado: document.getElementById('nenhumArtistaSelecionado'),
    nomeArtistaSelecionado: document.getElementById('nomeArtistaSelecionado'),
    idArtistaSelecionado: document.getElementById('idArtistaSelecionado'),
    papeisAtuais: document.getElementById('papeisAtuais'),
    cardInterprete: document.getElementById('cardInterprete'),
    cardCompositor: document.getElementById('cardCompositor'),
    cardAmbos: document.getElementById('cardAmbos'),
    btnSalvarPapeis: document.getElementById('btnSalvarPapeis'),
    btnLimparSelecao: document.getElementById('btnLimparSelecao'),
    totalArtistas: document.getElementById('totalArtistas'),
    totalInterpretes: document.getElementById('totalInterpretes'),
    totalCompositores: document.getElementById('totalCompositores'),
    totalAmbos: document.getElementById('totalAmbos'),
    confirmacaoModal: document.getElementById('confirmacaoModal'),
    mensagemConfirmacao: document.getElementById('mensagemConfirmacao'),
    detalheConfirmacao: document.getElementById('detalheConfirmacao'),
    btnConfirmarAcao: document.getElementById('btnConfirmarAcao')
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de associar papéis carregada');
    carregarArtistas();
    configurarEventListeners();
});

function configurarEventListeners() {
    console.log('Configurando event listeners...');

    elementos.filtroArtistas.addEventListener('input', filtrarArtistas);

    elementos.cardInterprete.addEventListener('click', () => selecionarPapel('interprete'));
    elementos.cardCompositor.addEventListener('click', () => selecionarPapel('compositor'));
    elementos.cardAmbos.addEventListener('click', () => selecionarPapel('ambos'));

    elementos.btnSalvarPapeis.addEventListener('click', confirmarSalvarPapeis);
    elementos.btnLimparSelecao.addEventListener('click', limparSelecao);

    elementos.btnConfirmarAcao.addEventListener('click', () => {
        if (acaoConfirmarCallback) {
            acaoConfirmarCallback();
        }
        fecharModalConfirmacao();
    });

    const closeBtn = document.querySelector('#confirmacaoModal .close-btn')
    if (closeBtn) {
        closeBtn.addEventListener('click', fecharModalConfirmacao)
    }

    console.log('Todos os event listeners configurados com sucesso!')
}

async function carregarArtistas() {
    try {
        console.log('Carregando artistas...')

        const artistas = await window.lojaMusica.busca.artistasComPapeis()

        console.log('Artistas Carregados:', artistas)

        atualizarEstatisticas()
        renderizarListaArtistas(artistas)


    } catch (erro) {
        console.error('Erro ao carregar artistas:', erro);
        elementos.listaArtistas.innerHTML = `
            <div class="sem-resultados">
                <i class="bi bi-exclamation-triangle"></i>
                <h5>Erro ao carregar artistas</h5>
                <p class="text-muted">${erro.message}</p>
                <button class="btn btn-primary mt-3" onclick="carregarArtistas()">
                    <i class="bi bi-arrow-repeat"></i> Tentar novamente
                </button>
            </div>`
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar artistas: ' + erro.message
        })
    }
};

function mostrarSemArtistas() {
    elementos.listaArtistas.innerHTML = `
        <div class="sem-resultados">
            <i class="bi bi-people"></i>
            <h5>Nenhum artista encontrado</h5>
            <p class="text-muted">Cadastre artistas primeiro.</p>
            <a href="../artista/artista.html" class="btn btn-primary">
                <i class="bi bi-plus-circle"></i> Cadastrar Artista
            </a>
        </div>
    `;
}

function atualizarEstatisticas() {
    if (!artistas || artistas.length === 0) {
        elementos.totalArtistas.textContent = '0';
        elementos.totalInterpretes.textContent = '0';
        elementos.totalCompositores.textContent = '0';
        elementos.totalAmbos.textContent = '0';
        return;
    }
    
    const total = artistas.length;
    const interpretes = artistas.filter(a => a.total_interpretacoes > 0).length;
    const compositores = artistas.filter(a => a.total_composicoes > 0).length;
    const ambos = artistas.filter(a => a.total_interpretacoes > 0 && a.total_composicoes > 0).length;
    
    elementos.totalArtistas.textContent = total;
    elementos.totalInterpretes.textContent = interpretes;
    elementos.totalCompositores.textContent = compositores;
    elementos.totalAmbos.textContent = ambos;
}

function renderizarListaArtistas (lista) {
    if (!lista || lista.length === 0) {
        elementos.listaArtistas.inner html = `
        <div class="sem-resultados">
                <i class="bi bi-search"></i>
                <h5>Nenhum artista encontrado</h5>
                <p class="text-muted">Tente outros termos de busca.</p>
        </div>`
        return
    }

    let html = '<div class="list-group">'

    lista.forEach(artista => {
        const papelClass = artista.papel_principal === 'interprete' ? 'badge-interprete' :
                          artista.papel_principal === 'compositor' ? 'badge-compositor' :
                          artista.papel_principal === 'ambos' ? 'badge-ambos' : 'bg-secondary'
        
        const papelTexto = artista.papel_principal === 'interprete' ? '🎤 Intérprete' :
                          artista.papel_principal === 'compositor' ? '✍️ Compositor' :
                          artista.papel_principal === 'ambos' ? '⭐ Intérprete e Compositor' : 'Sem papel'
        const selecionado = artistaSelecionado && artistaSelecionado.artista_id === artista.artista_id ? 'selecionado' : '';
        
        html += `
            <div class="artista-item ${selecionado}" data-artista-id="${artista.artista_id}" 
                 onclick="selecionarArtista(${artista.artista_id})">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${artista.nome}</strong>
                        <br>
                        <small class="text-muted">ID: ${artista.artista_id}</small>
                    </div>
                    <span class="badge ${papelClass}">${papelTexto}</span>
                </div>
            </div>`;       
    })

    html += '</div>';
    elementos.listaArtistas.innerHTML = html
}

function filtrarArtistas() {
    const termo = elementos.filtroArtistas.value.toLowerCase().trim()

    if(!termo) {
        renderizarListaArtistas(artistas)
        return
    }

    comst filtrados = artistas.filter(artista => 
        artista.nome.toLowerCase().includes(termo) || 
        artista.artista_id.toString().includes(termo)
    )

    renderizarListaArtistas(filtrados)
}

window.selecionarArtista = async function (id) {
    try {
        console.log('Selecionando artista ID:', id)

        const artista = await window.lojaMusica.artista.buscar(id)

        if (!artista) {
            throw new Error('Artista não encontrado')
        }

        let papeis = []

        try {
            papais = await window.lojaMusica.artista.buscarPapeis(id)
            
        } catch (e) {
            console.log('Artista sem papéis definidos')
            papeis = [] 
        }

        artistaSelecionado = {
            ...artista,
            papeis: papeis
        }

        elementos.artistaSelecionado.style.display = 'block'
        elementos.nenhumArtistaSelecionado.style.display = 'none'
        
        elementos.nomeArtistaSelecionado.textContent = artista.nome;
        elementos.idArtistaSelecionado.textContent = `ID: ${artista.artista_id}`

        atualizarPapeisAtuais(artista, papeis)

        document.querySelectorAll('.artista-item').forEach(item => {
            item.classList.remove('selecionado')
        });

        const itemSelecionado = document.querySelector(`.artista-item[data-artista-id="${id}"]`);
        if (itemSelecionado) {
            itemSelecionado.classList.add('selecionado')
        }

        limparSelecaoPapel()
        
    } catch (erro) {
        console.error('Erro ao selecionar artista:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar detalhes do artista: ' + erro.message
        }) 
    }   
}

function selecionarPapel(papel) {
    papaelSelecionado = papel

    elementos.cardInterprete.classList.remove('selecionado')
    elementos.cardCompositor.classList.remove('selecionado')
    elementos.cardAmbos.classList.remove('selecionado')

    switch (papel) {
        case 'interprete':
            elementos.cardInterprete.classList.add('selecionado')
            break;
        
        case 'compositor':
            elementos.cardCompositor.classList.add('selecionado')
            break;

        case 'ambos':
            elementos.cardAmbos.classList.add('selecionado')
            break;
    }
}

function confirmarSalvarPapeis (){

    if(!artistaSelecionado) {
        window.dialog.exibirDialogMensagem({
            titulo: 'Atenção',
            mensagem: 'Selecione um artista primeiro.'
        })
        return
    }

    if(!papelSelecionado){
        window.dialog.exibirDialogMensagem({
            titulo: 'Atenção',
            mensagem: 'Selecione um papel para o artista.'
        })
        return
    }

    const papelTexto = papelSelecionado === 'interprete' ? 'Intérprete' :
                      papelSelecionado === 'compositor' ? 'Compositor' : 'Intérprete e Compositor';
    
    abrirModalConfirmacao(
        'Confirmar alteração de papéis',
        `Deseja definir "${artistaSelecionado.nome}" como ${papelTexto}?`,
        salvarPapeis
    )
}

async function salvarPapeis() {
    try {
        console.log('Salvando papéis ara artista:', artistaSelecionado.artista_id, 'Papel:', papelSelecionado)
        
    } catch (erro) {
        console.error('Erro ao salvar papéis:', erro);
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao salvar papéis: ' + erro.message
        })
    }

    const interprete = papelSelecionado === 'interprete' || papelSelecionado === 'ambos'
    const compositor = papelSelecionado === 'compositor' || papelSelecionado === 'ambos'

    await window.lojaMusica.artista.associarPapeis (
        artistaSelecionado.artista_id, 
        interprete,
        compositor
    )

    await carregarArtistas()

    if (artistaSelecionado) {
        await window.selecionarArtista(artistaSelecionado.artista_id)
    }

    limparSelecaoPapel()

    window.dialog.exibirDialogMensagem({
        titulo: 'Sucesso',
        mensagem: `Papéis de "${artistaSelecionado.nome}" atualizados com sucesso!`
    })
}

function abrirModalConfirmacao(titulo, mensagem, callback) {
    elementos.mensagemConfirmacao.textContent = mensagem;
    elementos.detalheConfirmacao.textContent = titulo;
    acaoConfirmarCallback = callback;
    elementos.confirmacaoModal.style.display = 'flex';
}

window.fecharModalConfirmacao = function() {
    elementos.confirmacaoModal.style.display = 'none';
    acaoConfirmarCallback = null;
}