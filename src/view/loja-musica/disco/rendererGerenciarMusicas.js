let discoId = null;
let discoInfo = null;
let musicasDisco = [];
let musicasDisponiveis = [];
let musicaParaRemover = null;
let musicaEditando = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    discoId = urlParams.get('id');
    const discoNome = urlParams.get('nome');

    if (!discoId) {
        mostrarErro('ID do disco não fornecido');
        return;
    }

    document.getElementById('tituloDisco').textContent = `Gerenciar Músicas - ${discoNome || 'Disco'}`;
    
    carregarDados();
    configurarEventListeners();
});

async function carregarDados() {
    mostrarLoading(true);

    try {
        discoInfo = await window.lojaMusica.disco.buscar(parseInt(discoId));

        musicasDisco = await window.lojaMusica.disco.musicas.listar(parseInt(discoId));
        
        const todasMusicas = await window.lojaMusica.musica.listar();
        
        const musicasIdsNoDisco = musicasDisco.map(m => m.musica_id);
        musicasDisponiveis = todasMusicas.filter(m => !musicasIdsNoDisco.includes(m.musica_id));

        preencherInfoDisco();
        preencherSelectMusicas();
        preencherListaMusicas();
        calcularDuracaoTotal();

    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        mostrarErro('Erro ao carregar dados: ' + erro.message);
    } finally {
        mostrarLoading(false);
    }
}

function preencherInfoDisco() {
    document.getElementById('nomeDisco').textContent = discoInfo.nome || 'Nome não disponível';
    
    const capaImg = document.getElementById('capaDisco');
    if (discoInfo.imagem) {
        capaImg.src = discoInfo.imagem;
        capaImg.alt = `Capa do disco ${discoInfo.nome}`;
    } else {
        capaImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e9ecef"/><text x="50" y="50" font-family="Arial" font-size="12" fill="%236c757d" text-anchor="middle" dominant-baseline="middle">📀</text></svg>';
    }
    
    const data = discoInfo.data_lancamento ? new Date(discoInfo.data_lancamento).toLocaleDateString('pt-BR') : 'Data não informada';
    const gravadora = discoInfo.gravadora_nome || 'Gravadora não informada';
    
    document.getElementById('infoDisco').innerHTML = `
        <i class="bi bi-calendar"></i> ${data} | 
        <i class="bi bi-building"></i> ${gravadora}
    `;
}

function preencherSelectMusicas() {
    const select = document.getElementById('selectMusica');
    
    if (musicasDisponiveis.length === 0) {
        select.innerHTML = '<option value="">Todas as músicas já estão no disco</option>';
        return;
    }

    let html = '<option value="">Selecione uma música...</option>';
    musicasDisponiveis.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(musica => {
        html += `<option value="${musica.musica_id}">${musica.nome} (${musica.duracao || '--:--'}) - ${musica.estilo_nome || 'Sem estilo'}</option>`;
    });
    
    select.innerHTML = html;
}

function preencherListaMusicas() {
    const container = document.getElementById('musicasLista');
    const semMusicas = document.getElementById('semMusicas');
    
    if (!musicasDisco || musicasDisco.length === 0) {
        container.innerHTML = '';
        semMusicas.style.display = 'block';
        document.getElementById('totalMusicas').textContent = '0 músicas';
        document.getElementById('btnSalvarOrdem').style.display = 'none';
        return;
    }

    semMusicas.style.display = 'none';
    document.getElementById('totalMusicas').textContent = `${musicasDisco.length} música(s)`;

    musicasDisco.sort((a, b) => (a.ordem || 999) - (b.ordem || 999));

    let html = '';
    musicasDisco.forEach((musica) => {
        const isEditing = musicaEditando && musicaEditando.musica_id === musica.musica_id;
        
        if (isEditing) {
            html += `
                <div class="list-group-item musica-item modo-edicao-ativo d-flex justify-content-between align-items-center" 
                     data-musica-id="${musica.musica_id}">
                    <div class="d-flex align-items-center flex-grow-1">
                        <div class="me-3">
                            <label for="novaOrdem_${musica.musica_id}" class="form-label mb-0"><i class="bi bi-sort-numeric-up"></i> Nova ordem:</label>
                            <input type="number" class="form-control ordem-input" id="novaOrdem_${musica.musica_id}" 
                                   value="${musica.ordem}" min="1" style="width: 80px;">
                        </div>
                        <div class="flex-grow-1">
                            <strong>${musica.nome}</strong>
                            <br>
                            <small class="text-muted">
                                <i class="bi bi-clock"></i> ${musica.duracao || '--:--'} | 
                                <i class="bi bi-tag"></i> ${musica.estilo_nome || 'Sem estilo'}
                            </small>
                            <div class="participacao-info mt-1">
                                <i class="bi bi-mic"></i> ${musica.interpretes_nomes} 
                                <span class="mx-2">|</span>
                                <i class="bi bi-pencil"></i> ${musica.compositores_nomes}
                            </div>
                        </div>
                    </div>
                    <div class="acao-botoes">
                        <button class="btn btn-sm btn-success" onclick="salvarEdicaoOrdem(${musica.musica_id})" title="Salvar">
                            <i class="bi bi-check-lg"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="cancelarEdicao()" title="Cancelar">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="list-group-item musica-item d-flex justify-content-between align-items-center" 
                     data-musica-id="${musica.musica_id}" 
                     data-ordem="${musica.ordem}">
                    <div class="d-flex align-items-center flex-grow-1">
                        <span class="ordem-badge me-3"><i class="bi bi-hash"></i> ${musica.ordem}</span>
                        <div class="flex-grow-1">
                            <strong>${musica.nome}</strong>
                            <br>
                            <small class="text-muted">
                                <i class="bi bi-clock"></i> ${musica.duracao || '--:--'} | 
                                <i class="bi bi-tag"></i> ${musica.estilo_nome || 'Sem estilo'}
                            </small>
                            <div class="participacao-info mt-1">
                                <i class="bi bi-mic"></i> ${musica.interpretes_nomes} 
                                <span class="mx-2">|</span>
                                <i class="bi bi-pencil"></i> ${musica.compositores_nomes}
                            </div>
                        </div>
                    </div>
                    <div class="acao-botoes">
                        <button class="btn btn-sm btn-warning" onclick="editarOrdem(${musica.musica_id}, ${musica.ordem})" title="Editar ordem">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="confirmarRemoverMusica(${musica.musica_id}, '${musica.nome}')" title="Remover">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

function calcularDuracaoTotal() {
    let totalSegundos = 0;
    
    musicasDisco.forEach(musica => {
        if (musica.duracao) {
            const partes = musica.duracao.split(':');
            if (partes.length === 2) {
                totalSegundos += parseInt(partes[0]) * 60 + parseInt(partes[1]);
            }
        }
    });

    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    const duracaoTotal = `${minutos}:${segundos.toString().padStart(2, '0')}`;
    
    document.getElementById('duracaoTotal').textContent = duracaoTotal;
}

function configurarEventListeners() {
    const form = document.getElementById('formAdicionarMusica');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const musicaId = document.getElementById('selectMusica').value;
        const ordem = document.getElementById('ordemMusica').value;
        
        if (!musicaId || !ordem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campos obrigatórios',
                mensagem: 'Selecione uma música e informe a ordem'
            });
            return;
        }

        await adicionarMusica(parseInt(musicaId), parseInt(ordem));
    });

    document.getElementById('confirmarRemoverBtn').addEventListener('click', async () => {
        if (musicaParaRemover) {
            await removerMusica(musicaParaRemover.id, musicaParaRemover.nome);
        }
    });
}

async function adicionarMusica(musicaId, ordem) {
    mostrarLoading(true);

    try {
        const ordemExistente = musicasDisco.find(m => m.ordem === ordem);
        if (ordemExistente) {
            mostrarLoading(false);
            window.dialog.exibirDialogMensagem({
                titulo: 'Ordem já ocupada',
                mensagem: `Já existe a música "${ordemExistente.nome}" na ordem ${ordem}`
            });
            return;
        }

        await window.lojaMusica.disco.musicas.adicionar(discoId, musicaId, ordem);
        
        await carregarDados();
        
        document.getElementById('selectMusica').value = '';
        document.getElementById('ordemMusica').value = '';

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: 'Música adicionada ao disco com sucesso!'
        });

    } catch (erro) {
        console.error('Erro ao adicionar música:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao adicionar música: ' + erro.message
        });
    } finally {
        mostrarLoading(false);
    }
}

window.editarOrdem = function(musicaId, ordemAtual) {
    const musica = musicasDisco.find(m => m.musica_id === musicaId);
    if (musica) {
        musicaEditando = musica;
        preencherListaMusicas();
    }
};

window.salvarEdicaoOrdem = async function(musicaId) {
    const novaOrdem = document.getElementById(`novaOrdem_${musicaId}`).value;
    
    if (!novaOrdem || parseInt(novaOrdem) < 1) {
        window.dialog.exibirDialogMensagem({
            titulo: 'Ordem inválida',
            mensagem: 'Por favor, informe uma ordem válida (maior que 0)'
        });
        return;
    }

    const ordemNum = parseInt(novaOrdem);
    
    const ordemExistente = musicasDisco.find(m => m.musica_id !== musicaId && m.ordem === ordemNum);
    if (ordemExistente) {
        window.dialog.exibirDialogMensagem({
            titulo: 'Ordem já ocupada',
            mensagem: `Já existe a música "${ordemExistente.nome}" na ordem ${ordemNum}`
        });
        return;
    }

    mostrarLoading(true);

    try {
        await window.lojaMusica.disco.musicas.remover(discoId, musicaId);
        await window.lojaMusica.disco.musicas.adicionar(discoId, musicaId, ordemNum);
        
        musicaEditando = null;
        
        await carregarDados();
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Ordem da música atualizada para ${ordemNum} com sucesso!`
        });

    } catch (erro) {
        console.error('Erro ao atualizar ordem:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao atualizar ordem: ' + erro.message
        });
    } finally {
        mostrarLoading(false);
    }
};

window.cancelarEdicao = function() {
    musicaEditando = null;
    preencherListaMusicas();
};

window.confirmarRemoverMusica = function(musicaId, musicaNome) {
    musicaParaRemover = { id: musicaId, nome: musicaNome };
    document.getElementById('musicaRemoverInfo').textContent = `Música: ${musicaNome}`;
    document.getElementById('confirmarRemoverModal').style.display = 'flex';
};

window.fecharModalRemover = function() {
    document.getElementById('confirmarRemoverModal').style.display = 'none';
    musicaParaRemover = null;
};

async function removerMusica(musicaId, musicaNome) {
    mostrarLoading(true);
    fecharModalRemover();

    try {
        await window.lojaMusica.disco.musicas.remover(discoId, musicaId);
        
        if (musicaEditando && musicaEditando.musica_id === musicaId) {
            musicaEditando = null;
        }
        
        await carregarDados();

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Música "${musicaNome}" removida do disco com sucesso!`
        });

    } catch (erro) {
        console.error('Erro ao remover música:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao remover música: ' + erro.message
        });
    } finally {
        mostrarLoading(false);
    }
}

function mostrarLoading(mostrar) {
    const loading = document.getElementById('loading');
    const conteudo = document.getElementById('conteudoPrincipal');
    
    if (mostrar) {
        loading.style.display = 'block';
        conteudo.style.display = 'none';
    } else {
        loading.style.display = 'none';
        conteudo.style.display = 'block';
    }
}

function mostrarErro(mensagem) {
    mostrarLoading(false);
    
    const erroDiv = document.createElement('div');
    erroDiv.className = 'alert alert-danger text-center mt-4';
    erroDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle fs-1 d-block mb-3"></i>
        <h4>Erro</h4>
        <p>${mensagem}</p>
        <a href="disco.html" class="btn btn-primary mt-3">
            <i class="bi bi-arrow-left"></i> Voltar para Discos
        </a>
    `;
    
    document.querySelector('main.container').appendChild(erroDiv);
}