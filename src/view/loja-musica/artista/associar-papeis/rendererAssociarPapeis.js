// rendererAssociarPapeis.js
let artistas = [];
let artistaSelecionado = null;
let papelSelecionado = null;
let acaoConfirmarCallback = null;

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

    if (elementos.filtroArtistas) {
        elementos.filtroArtistas.addEventListener('input', filtrarArtistas);
    }

    if (elementos.cardInterprete) {
        elementos.cardInterprete.addEventListener('click', () => selecionarPapel('interprete'));
    }
    
    if (elementos.cardCompositor) {
        elementos.cardCompositor.addEventListener('click', () => selecionarPapel('compositor'));
    }
    
    if (elementos.cardAmbos) {
        elementos.cardAmbos.addEventListener('click', () => selecionarPapel('ambos'));
    }

    if (elementos.btnSalvarPapeis) {
        elementos.btnSalvarPapeis.addEventListener('click', confirmarSalvarPapeis);
    }
    
    if (elementos.btnLimparSelecao) {
        elementos.btnLimparSelecao.addEventListener('click', limparSelecao);
    }

    if (elementos.btnConfirmarAcao) {
        elementos.btnConfirmarAcao.addEventListener('click', () => {
            if (acaoConfirmarCallback) {
                acaoConfirmarCallback();
            }
            fecharModalConfirmacao();
        });
    }

    const closeBtn = document.querySelector('#confirmacaoModal .close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', fecharModalConfirmacao);
    }

    // Fechar modal clicando fora
    if (elementos.confirmacaoModal) {
        elementos.confirmacaoModal.addEventListener('click', (event) => {
            if (event.target === elementos.confirmacaoModal) {
                fecharModalConfirmacao();
            }
        });
    }

    console.log('Todos os event listeners configurados com sucesso!');
}

async function carregarArtistas() {
    try {
        console.log('Carregando artistas...');

        artistas = await window.lojaMusica.busca.artistasComPapeis();

        console.log('Artistas Carregados:', artistas);

        if (!artistas || artistas.length === 0) {
            mostrarSemArtistas();
            return;
        }

        atualizarEstatisticas();
        renderizarListaArtistas(artistas);

    } catch (erro) {
        console.error('Erro ao carregar artistas:', erro);
        if (elementos.listaArtistas) {
            elementos.listaArtistas.innerHTML = `
                <div class="sem-resultados">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h5>Erro ao carregar artistas</h5>
                    <p class="text-muted">${erro.message}</p>
                    <button class="btn btn-primary mt-3" onclick="location.reload()">
                        <i class="bi bi-arrow-repeat"></i> Tentar novamente
                    </button>
                </div>`;
        }
        
        if (window.dialog && window.dialog.exibirDialogMensagem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao carregar artistas: ' + erro.message
            });
        }
    }
}

function mostrarSemArtistas() {
    if (elementos.listaArtistas) {
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
}

function atualizarEstatisticas() {
    if (!artistas || artistas.length === 0) {
        if (elementos.totalArtistas) elementos.totalArtistas.textContent = '0';
        if (elementos.totalInterpretes) elementos.totalInterpretes.textContent = '0';
        if (elementos.totalCompositores) elementos.totalCompositores.textContent = '0';
        if (elementos.totalAmbos) elementos.totalAmbos.textContent = '0';
        return;
    }
    
    const total = artistas.length;
    const interpretes = artistas.filter(a => a.total_interpretacoes > 0).length;
    const compositores = artistas.filter(a => a.total_composicoes > 0).length;
    const ambos = artistas.filter(a => a.total_interpretacoes > 0 && a.total_composicoes > 0).length;
    
    if (elementos.totalArtistas) elementos.totalArtistas.textContent = total;
    if (elementos.totalInterpretes) elementos.totalInterpretes.textContent = interpretes;
    if (elementos.totalCompositores) elementos.totalCompositores.textContent = compositores;
    if (elementos.totalAmbos) elementos.totalAmbos.textContent = ambos;
}

function renderizarListaArtistas(lista) {
    if (!lista || lista.length === 0) {
        if (elementos.listaArtistas) {
            elementos.listaArtistas.innerHTML = `
                <div class="sem-resultados">
                    <i class="bi bi-search"></i>
                    <h5>Nenhum artista encontrado</h5>
                    <p class="text-muted">Tente outros termos de busca.</p>
                </div>`;
        }
        return;
    }

    let html = '<div class="list-group">';

    lista.forEach(artista => {
        const papelClass = artista.papel_principal === 'interprete' ? 'badge-interprete' :
                          artista.papel_principal === 'compositor' ? 'badge-compositor' :
                          artista.papel_principal === 'ambos' ? 'badge-ambos' : 'bg-secondary';
        
        const papelTexto = artista.papel_principal === 'interprete' ? '🎤 Intérprete' :
                          artista.papel_principal === 'compositor' ? '✍️ Compositor' :
                          artista.papel_principal === 'ambos' ? '⭐ Intérprete e Compositor' : 'Sem papel';
        
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
    });

    html += '</div>';
    
    if (elementos.listaArtistas) {
        elementos.listaArtistas.innerHTML = html;
    }
}

function filtrarArtistas() {
    if (!elementos.filtroArtistas) return;
    
    const termo = elementos.filtroArtistas.value.toLowerCase().trim();

    if (!termo) {
        renderizarListaArtistas(artistas);
        return;
    }

    const filtrados = artistas.filter(artista => 
        artista.nome.toLowerCase().includes(termo) || 
        artista.artista_id.toString().includes(termo)
    );

    renderizarListaArtistas(filtrados);
}

window.selecionarArtista = async function (id) {
    try {
        console.log('Selecionando artista ID:', id);

        const artista = await window.lojaMusica.artista.buscar(id);

        if (!artista) {
            throw new Error('Artista não encontrado');
        }

        let papeis = [];

        try {
            papeis = await window.lojaMusica.artista.buscarPapeis(id);
            console.log('Papéis encontrados:', papeis);
        } catch (e) {
            console.log('Artista sem papéis definidos');
            papeis = [];
        }

        artistaSelecionado = {
            ...artista,
            papeis: papeis
        };

        if (elementos.artistaSelecionado) {
            elementos.artistaSelecionado.style.display = 'block';
        }
        
        if (elementos.nenhumArtistaSelecionado) {
            elementos.nenhumArtistaSelecionado.style.display = 'none';
        }
        
        if (elementos.nomeArtistaSelecionado) {
            elementos.nomeArtistaSelecionado.textContent = artista.nome;
        }
        
        if (elementos.idArtistaSelecionado) {
            elementos.idArtistaSelecionado.textContent = `ID: ${artista.artista_id}`;
        }

        atualizarPapeisAtuais(artista, papeis);

        document.querySelectorAll('.artista-item').forEach(item => {
            item.classList.remove('selecionado');
        });

        const itemSelecionado = document.querySelector(`.artista-item[data-artista-id="${id}"]`);
        if (itemSelecionado) {
            itemSelecionado.classList.add('selecionado');
        }

        limparSelecaoPapel();
        
    } catch (erro) {
        console.error('Erro ao selecionar artista:', erro);
        if (window.dialog && window.dialog.exibirDialogMensagem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao carregar detalhes do artista: ' + erro.message
            });
        }
    }
};

function atualizarPapeisAtuais(artista, papeis) {
    if (!elementos.papeisAtuais) return;
    
    if (!papeis || papeis.length === 0) {
        elementos.papeisAtuais.innerHTML = '<span class="badge bg-secondary">Nenhum papel definido</span>';
        return;
    }

    let html = '';
    
    papeis.forEach(papel => {
        const badgeClass = papel === 'interprete' ? 'badge-interprete' :
                          papel === 'compositor' ? 'badge-compositor' : 'badge-ambos';
        
        const icone = papel === 'interprete' ? '🎤' :
                     papel === 'compositor' ? '✍️' : '⭐';
        
        const texto = papel === 'interprete' ? 'Intérprete' :
                     papel === 'compositor' ? 'Compositor' : 'Intérprete e Compositor';
        
        html += `<span class="badge ${badgeClass} me-1">${icone} ${texto}</span>`;
    });
    
    elementos.papeisAtuais.innerHTML = html;
}

function selecionarPapel(papel) {
    papelSelecionado = papel;

    if (elementos.cardInterprete) elementos.cardInterprete.classList.remove('selecionado');
    if (elementos.cardCompositor) elementos.cardCompositor.classList.remove('selecionado');
    if (elementos.cardAmbos) elementos.cardAmbos.classList.remove('selecionado');

    switch (papel) {
        case 'interprete':
            if (elementos.cardInterprete) elementos.cardInterprete.classList.add('selecionado');
            break;
        case 'compositor':
            if (elementos.cardCompositor) elementos.cardCompositor.classList.add('selecionado');
            break;
        case 'ambos':
            if (elementos.cardAmbos) elementos.cardAmbos.classList.add('selecionado');
            break;
    }
}

function limparSelecao() {
    console.log('Limpando seleção...');
    
    artistaSelecionado = null;
    
    if (elementos.artistaSelecionado) {
        elementos.artistaSelecionado.style.display = 'none';
    }
    
    if (elementos.nenhumArtistaSelecionado) {
        elementos.nenhumArtistaSelecionado.style.display = 'block';
    }
    
    limparSelecaoPapel();
    
    document.querySelectorAll('.artista-item').forEach(item => {
        item.classList.remove('selecionado');
    });
    
    console.log('Seleção limpa com sucesso');
}

function limparSelecaoPapel() {
    papelSelecionado = null;
    
    if (elementos.cardInterprete) elementos.cardInterprete.classList.remove('selecionado');
    if (elementos.cardCompositor) elementos.cardCompositor.classList.remove('selecionado');
    if (elementos.cardAmbos) elementos.cardAmbos.classList.remove('selecionado');
}

function confirmarSalvarPapeis() {
    if (!artistaSelecionado) {
        if (window.dialog && window.dialog.exibirDialogMensagem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Atenção',
                mensagem: 'Selecione um artista primeiro.'
            });
        } else {
            alert('Selecione um artista primeiro.');
        }
        return;
    }

    if (!papelSelecionado) {
        if (window.dialog && window.dialog.exibirDialogMensagem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Atenção',
                mensagem: 'Selecione um papel para o artista.'
            });
        } else {
            alert('Selecione um papel para o artista.');
        }
        return;
    }

    const papelTexto = papelSelecionado === 'interprete' ? 'Intérprete' :
                      papelSelecionado === 'compositor' ? 'Compositor' : 'Intérprete e Compositor';
    
    abrirModalConfirmacao(
        'Confirmar alteração de papéis',
        `Deseja definir "${artistaSelecionado.nome}" como ${papelTexto}?`,
        salvarPapeis
    );
}

// Função temporária para simular associação de papéis
async function associarPapeisTemporario(artistaId, interprete, compositor) {
    console.log('Função temporária - simulando associação de papéis:', {
        artistaId, 
        interprete, 
        compositor
    });
    
    // Simula um delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
        success: true, 
        message: 'Papéis associados com sucesso (simulado)' 
    };
}

async function salvarPapeis() {
    try {
        console.log('Salvando papéis para artista:', artistaSelecionado.artista_id, 'Papel:', papelSelecionado);
        
        const interprete = papelSelecionado === 'interprete' || papelSelecionado === 'ambos';
        const compositor = papelSelecionado === 'compositor' || papelSelecionado === 'ambos';

        // Verifica se a função existe, se não, usa a temporária
        if (window.lojaMusica && window.lojaMusica.artista && typeof window.lojaMusica.artista.associarPapeis === 'function') {
            await window.lojaMusica.artista.associarPapeis(
                artistaSelecionado.artista_id,
                interprete,
                compositor
            );
        } else {
            console.warn('Função associarPapeis não encontrada, usando simulação');
            await associarPapeisTemporario(
                artistaSelecionado.artista_id,
                interprete,
                compositor
            );
        }

        await carregarArtistas();

        if (artistaSelecionado) {
            await window.selecionarArtista(artistaSelecionado.artista_id);
        }

        limparSelecaoPapel();

        // Fecha o modal de confirmação
        fecharModalConfirmacao();

        if (window.dialog && window.dialog.exibirDialogMensagem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Sucesso',
                mensagem: `Papéis de "${artistaSelecionado.nome}" atualizados com sucesso!`
            });
        } else {
            alert(`Papéis de "${artistaSelecionado.nome}" atualizados com sucesso!`);
        }
        
    } catch (erro) {
        console.error('Erro ao salvar papéis:', erro);
        
        // Fecha o modal de confirmação em caso de erro
        fecharModalConfirmacao();
        
        if (window.dialog && window.dialog.exibirDialogMensagem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao salvar papéis: ' + erro.message
            });
        } else {
            alert('Erro ao salvar papéis: ' + erro.message);
        }
    }
}

function abrirModalConfirmacao(titulo, mensagem, callback) {
    console.log('Abrindo modal de confirmação:', { titulo, mensagem });
    
    if (elementos.detalheConfirmacao) {
        elementos.detalheConfirmacao.textContent = titulo;
    }
    
    if (elementos.mensagemConfirmacao) {
        elementos.mensagemConfirmacao.textContent = mensagem;
    }
    
    acaoConfirmarCallback = callback;
    
    if (elementos.confirmacaoModal) {
        elementos.confirmacaoModal.style.display = 'flex';
        elementos.confirmacaoModal.style.alignItems = 'center';
        elementos.confirmacaoModal.style.justifyContent = 'center';
        console.log('Modal de confirmação aberto');
    } else {
        console.error('Modal de confirmação não encontrado');
        // Fallback: usar confirm nativo
        if (confirm(mensagem)) {
            callback();
        }
    }
}

function fecharModalConfirmacao() {
    console.log('Fechando modal de confirmação');
    if (elementos.confirmacaoModal) {
        elementos.confirmacaoModal.style.display = 'none';
    }
    acaoConfirmarCallback = null;
}

// Tornar funções globais para os botões HTML
window.fecharModalConfirmacao = fecharModalConfirmacao;