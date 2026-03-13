let artistas = [];
let musicas = [];
let artistaSelecionado = null;
let papelSelecionado = null;

const elementos = {
    listaArtistas: document.getElementById('listaArtistas'),
    filtroArtistas: document.getElementById('filtroArtistas'),
    artistaSelecionado: document.getElementById('artistaSelecionado'),
    nenhumArtistaSelecionado: document.getElementById('nenhumArtistaSelecionado'),
    nomeArtistaSelecionado: document.getElementById('nomeArtistaSelecionado'),
    idArtistaSelecionado: document.getElementById('idArtistaSelecionado'),
    papeisAtuais: document.getElementById('papeisAtuais'),
    listaMusicas: document.getElementById('listaMusicas'),
    cardInterprete: document.getElementById('cardInterprete'),
    cardCompositor: document.getElementById('cardCompositor'),
    cardAmbos: document.getElementById('cardAmbos'),
    btnLimparSelecao: document.getElementById('btnLimparSelecao'), // Removemos o btnSalvarPapeis daqui
    totalArtistas: document.getElementById('totalArtistas'),
    totalInterpretes: document.getElementById('totalInterpretes'),
    totalCompositores: document.getElementById('totalCompositores'),
    totalAmbos: document.getElementById('totalAmbos')
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de associar papéis carregada');
    carregarArtistas();
    carregarMusicas();
    configurarEventListeners();
});

function configurarEventListeners() {
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
    
    if (elementos.btnLimparSelecao) {
        elementos.btnLimparSelecao.addEventListener('click', limparSelecao);
    }
}

async function carregarArtistas() {
    try {
        artistas = await window.lojaMusica.artista.listarComPapeis();
        
        if (!artistas || artistas.length === 0) {
            mostrarSemArtistas();
            return;
        }

        atualizarEstatisticas();
        renderizarListaArtistas(artistas);

    } catch (erro) {
        console.error('Erro ao carregar artistas:', erro);
        mostrarErro(erro.message);
    }
}

async function carregarMusicas() {
    try {
        musicas = await window.lojaMusica.musica.listar();
    } catch (erro) {
        console.error('Erro ao carregar músicas:', erro);
    }
}

function mostrarSemArtistas() {
    if (elementos.listaArtistas) {
        elementos.listaArtistas.innerHTML = `
            <div class="sem-resultados">
                <i class="bi bi-people"></i>
                <h5>Nenhum artista encontrado</h5>
                <p class="text-muted">Cadastre artistas primeiro.</p>
                <a href="../artista.html" class="btn btn-dark">
                    <i class="bi bi-plus-circle"></i> Cadastrar Artista
                </a>
            </div>
        `;
    }
}

function mostrarErro(mensagem) {
    if (elementos.listaArtistas) {
        elementos.listaArtistas.innerHTML = `
            <div class="sem-resultados">
                <i class="bi bi-exclamation-triangle"></i>
                <h5>Erro ao carregar artistas</h5>
                <p class="text-muted">${mensagem}</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">
                    <i class="bi bi-arrow-repeat"></i> Tentar novamente
                </button>
            </div>
        `;
    }
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

function renderizarListaArtistas(lista) {
    if (!lista || lista.length === 0) {
        elementos.listaArtistas.innerHTML = `
            <div class="sem-resultados">
                <i class="bi bi-search"></i>
                <h5>Nenhum artista encontrado</h5>
                <p class="text-muted">Tente outros termos de busca.</p>
            </div>`;
        return;
    }

    let html = '<div class="list-group">';

    lista.forEach(artista => {
        const papelClass = artista.papel_principal === 'interprete' ? 'badge-interprete' :
                          artista.papel_principal === 'compositor' ? 'badge-compositor' :
                          artista.papel_principal === 'ambos' ? 'badge-ambos' : 'bg-secondary';
        
        const papelTexto = artista.papel_principal === 'interprete' ? '<i class="bi bi-mic"></i> Intérprete' :
                          artista.papel_principal === 'compositor' ? '<i class="bi bi-pencil"></i> Compositor' :
                          artista.papel_principal === 'ambos' ? '<i class="bi bi-star-fill"></i> Ambos' : 
                          '<i class="bi bi-x-circle"></i> Sem papel';
        
        const selecionado = artistaSelecionado && artistaSelecionado.artista_id === artista.artista_id ? 'selecionado' : '';
        
        html += `
            <div class="artista-item ${selecionado}" data-artista-id="${artista.artista_id}" 
                 onclick="selecionarArtista(${artista.artista_id})">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${artista.nome}</strong>
                        <br>
                        <small class="text-muted">ID: ${artista.artista_id}</small>
                        <br>
                        <small>
                            <span class="badge bg-primary me-1" title="Músicas como intérprete">
                                <i class="bi bi-mic"></i> ${artista.total_interpretacoes || 0}
                            </span>
                            <span class="badge bg-warning text-dark" title="Músicas como compositor">
                                <i class="bi bi-pencil"></i> ${artista.total_composicoes || 0}
                            </span>
                        </small>
                    </div>
                    <span class="badge ${papelClass}">${papelTexto}</span>
                </div>
            </div>`;
    });

    html += '</div>';
    
    elementos.listaArtistas.innerHTML = html;
}

function filtrarArtistas() {
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

window.selecionarArtista = async function(id) {
    try {
        console.log('Selecionando artista ID:', id);

        const artista = artistas.find(a => a.artista_id === id);
        
        if (!artista) {
            throw new Error('Artista não encontrado');
        }

        artistaSelecionado = artista;

        elementos.artistaSelecionado.style.display = 'block';
        elementos.nenhumArtistaSelecionado.style.display = 'none';
        
        elementos.nomeArtistaSelecionado.textContent = artista.nome;
        elementos.idArtistaSelecionado.textContent = `ID: ${artista.artista_id}`;

        atualizarPapeisAtuais();
        await carregarMusicasComPapeis(id);

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
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar detalhes do artista: ' + erro.message
        });
    }
};

function atualizarPapeisAtuais() {
    if (!artistaSelecionado) return;
    
    const papeis = [];
    
    if (artistaSelecionado.total_interpretacoes > 0) papeis.push('interprete');
    if (artistaSelecionado.total_composicoes > 0) papeis.push('compositor');
    
    if (papeis.length === 0) {
        elementos.papeisAtuais.innerHTML = '<span class="badge bg-secondary">Nenhum papel definido</span>';
        return;
    }

    let html = '';
    
    papeis.forEach(papel => {
        const badgeClass = papel === 'interprete' ? 'badge-interprete' : 'badge-compositor';
        const icone = papel === 'interprete' ? '<i class="bi bi-mic"></i>' : '<i class="bi bi-pencil"></i>';
        const texto = papel === 'interprete' ? 'Intérprete' : 'Compositor';
        
        html += `<span class="badge ${badgeClass} me-1">${icone} ${texto}</span>`;
    });
    
    if (papeis.length === 2) {
        html += `<span class="badge badge-ambos ms-1"><i class="bi bi-star-fill"></i> Ambos</span>`;
    }
    
    elementos.papeisAtuais.innerHTML = html;
}

async function carregarMusicasComPapeis(artistaId) {
    try {
        const musicasComPapeis = await window.lojaMusica.papel.listarMusicas(artistaId);
        
        if (!elementos.listaMusicas) return;
        
        if (!musicasComPapeis || musicasComPapeis.length === 0) {
            elementos.listaMusicas.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> Nenhuma música cadastrada.
                </div>`;
            return;
        }

        let html = '<div class="list-group">';
        
        musicasComPapeis.forEach(musica => {
            const isInterprete = musica.is_interprete !== null;
            const isCompositor = musica.is_compositor !== null;
            
            let badgeHtml = '';
            if (isInterprete && isCompositor) {
                badgeHtml = '<span class="badge badge-ambos"><i class="bi bi-star-fill"></i> Intérprete e Compositor</span>';
            } else if (isInterprete) {
                badgeHtml = '<span class="badge badge-interprete"><i class="bi bi-mic"></i> Intérprete</span>';
            } else if (isCompositor) {
                badgeHtml = '<span class="badge badge-compositor"><i class="bi bi-pencil"></i> Compositor</span>';
            } else {
                badgeHtml = '<span class="badge bg-secondary"><i class="bi bi-x-circle"></i> Sem papel</span>';
            }
            
            html += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${musica.musica_nome}</strong>
                            <br>
                            <small class="text-muted">
                                <i class="bi bi-clock"></i> ${musica.duracao || '--:--'}
                            </small>
                            <div class="mt-2">
                                ${badgeHtml}
                            </div>
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn ${isInterprete ? 'btn-success' : 'btn-outline-success'}" 
                                    onclick="togglePapel(${artistaId}, ${musica.musica_id}, 'interprete')"
                                    title="${isInterprete ? 'Remover como intérprete' : 'Adicionar como intérprete'}">
                                <i class="bi bi-mic"></i>
                            </button>
                            <button class="btn ${isCompositor ? 'btn-warning' : 'btn-outline-warning'}" 
                                    onclick="togglePapel(${artistaId}, ${musica.musica_id}, 'compositor')"
                                    title="${isCompositor ? 'Remover como compositor' : 'Adicionar como compositor'}">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        elementos.listaMusicas.innerHTML = html;
        
    } catch (erro) {
        console.error('Erro ao carregar músicas com papéis:', erro);
        elementos.listaMusicas.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Erro ao carregar músicas: ${erro.message}
            </div>`;
    }
}

window.togglePapel = async function(artistaId, musicaId, papel) {
    try {
        console.log(`Toggle papel: Artista ${artistaId}, Música ${musicaId}, Papel ${papel}`);
        
        const musica = await window.lojaMusica.papel.listarMusicas(artistaId);
        const musicaAtual = musica.find(m => m.musica_id === musicaId);
        
        const isAtivo = papel === 'interprete' ? musicaAtual?.is_interprete : musicaAtual?.is_compositor;
        
        let resultado;
        if (isAtivo) {
            resultado = await window.lojaMusica.papel.desassociar(artistaId, musicaId, papel);
        } else {
            resultado = await window.lojaMusica.papel.associar(artistaId, musicaId, papel);
        }
        
        if (resultado.erro) {
            throw new Error(resultado.erro);
        }
        
        await carregarMusicasComPapeis(artistaId);
        
        artistas = await window.lojaMusica.artista.listarComPapeis();
        atualizarEstatisticas();
        
        artistaSelecionado = artistas.find(a => a.artista_id === artistaId);
        atualizarPapeisAtuais();
        
    } catch (erro) {
        console.error('Erro ao toggle papel:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: erro.message
        });
    }
};

function selecionarPapel(papel) {
    papelSelecionado = papel;

    elementos.cardInterprete.classList.remove('selecionado');
    elementos.cardCompositor.classList.remove('selecionado');
    elementos.cardAmbos.classList.remove('selecionado');

    switch (papel) {
        case 'interprete':
            elementos.cardInterprete.classList.add('selecionado');
            break;
        case 'compositor':
            elementos.cardCompositor.classList.add('selecionado');
            break;
        case 'ambos':
            elementos.cardAmbos.classList.add('selecionado');
            break;
    }
}

function limparSelecao() {
    artistaSelecionado = null;
    
    elementos.artistaSelecionado.style.display = 'none';
    elementos.nenhumArtistaSelecionado.style.display = 'block';
    
    limparSelecaoPapel();
    
    document.querySelectorAll('.artista-item').forEach(item => {
        item.classList.remove('selecionado');
    });
}

function limparSelecaoPapel() {
    papelSelecionado = null;
    
    elementos.cardInterprete.classList.remove('selecionado');
    elementos.cardCompositor.classList.remove('selecionado');
    elementos.cardAmbos.classList.remove('selecionado');
}