let todosArtistas = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de listagem de artistas carregada')
    carregarArtistasComPapeis()
});

async function carregarArtistasComPapeis() {
    try {
        const artistas = await window.lojaMusica.busca.artistasComPapeis()

        console.log('Artistas carregados:', artistas);

        todosArtistas = artistas

        atualizarEstatisticas(artistas)

        preencherTabela(artistas)
        
    } catch (erro) {
        console.error('Erro ao carregar artistas:', erro)

        const tbody = document.getElementById('tbody-artistas');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        <div class="alert alert-danger">
                            Erro ao carregar artistas: ${erro.message}
                        </div>
                    </td>
                </tr>`
        }

        // zerando contadores
        document.getElementById('totalArtistas').textContent = '0';
        document.getElementById('totalInterpretes').textContent = '0';
        document.getElementById('totalCompositores').textContent = '0';
        document.getElementById('totalAmbos').textContent = '0';
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar artistas: ' + erro.message
        });
    }
};

function atualizarEstatisticas(artistas) {
    if (!artistas | artistas.length === 0) {
        document.getElementById('totalArtistas').textContent = '0';
        document.getElementById('totalInterpretes').textContent = '0';
        document.getElementById('totalCompositores').textContent = '0';
        document.getElementById('totalAmbos').textContent = '0';
        return
    }

    const total = artistas.length

    const interpretes = artistas.filter(a => a.total_interpretacoes > 0).length
    const compositores = artistas.filter(a => a.total_composicoes > 0).length
    const ambos = artistas.filter(a => a.total_interpretacoes > 0 && a.total_composicoes > 0).length

    document.getElementById('totalArtistas').textContent = total
    document.getElementById('totalInterpretes').textContent = interpretes
    document.getElementById('totalCompositores').textContent = compositores
    document.getElementById('totalAmbos').textContent = ambos
};

function preencherTabela(artistas) {
    const tbody = document.getElementById('tbody-artistas')

    if (!tbody) {
        console.log('Elemento tbody-artistas não encontrado')
        return
    }

    if (!artistas || artistas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="alert alert-info">
                        Nenhum artista encontrado
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = ''

    artistas.forEach(artista => {
        // define selo de papel com a cor apropriada
        let badgePapel = '';
        let badgeClass = '';
        let iconePapel = '';
        
        switch(artista.papel_principal) {
            case 'interprete':
                badgePapel = 'Intérprete';
                badgeClass = 'bg-success';
                iconePapel = '🎤';
                break;
            case 'compositor':
                badgePapel = 'Compositor';
                badgeClass = 'bg-warning text-dark';
                iconePapel = '✍️';
                break;
            case 'ambos':
                badgePapel = 'Intérprete e Compositor';
                badgeClass = 'bg-info';
                iconePapel = '⭐';
                break;
            default:
                badgePapel = 'Sem papéis';
                badgeClass = 'bg-secondary';
                iconePapel = '❌';
        }

        // escapa aspas simples no nome para não quebrar o HTML
        const nomeEscapado = artista.nome.replace(/'/g, "\\'");
        
        html += `
            <tr>
                <td>${artista.artista_id}</td>
                <td>
                    <strong>${artista.nome}</strong>
                    <br>
                    <small class="text-muted">ID: ${artista.artista_id}</small>
                </td>
                <td>
                    <span class="badge ${badgeClass}">
                        ${iconePapel} ${badgePapel}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge bg-primary">
                        ${artista.total_interpretacoes || 0}
                    </span>
                    <br>
                    <small class="text-muted">músicas</small>
                </td>
                <td class="text-center">
                    <span class="badge bg-primary">
                        ${artista.total_composicoes || 0}
                    </span>
                    <br>
                    <small class="text-muted">músicas</small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-info" 
                                onclick="verDetalhesArtista(${artista.artista_id})"
                                title="Ver detalhes">
                            🔍 Detalhes
                        </button>
                        <button class="btn btn-primary" 
                                onclick="editarArtista(${artista.artista_id}, '${nomeEscapado}')"
                                title="Editar">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger" 
                                onclick="deletarArtista(${artista.artista_id})"
                                title="Excluir">
                            🗑️ Excluir
                        </button>
                    </div>
                </td>
            </tr>`
    })

    tbody.innerHTML = html
};

function filtrarTabela() {
    console.log('Filtrando tabela...')

    const filtroNome = document.getElementById('filtroNome').value.toLowerCase().tim()
    const filtroPapel = document.getElementById('filtroPapel').value

    const artistasFiltrados = todosArtistas.filter(artista => {
        const nomeMatch = artista.nome.toLowerCase().includes(filtroNome)

        let papelMatch = true

        if(papelMatch !== 'todos') {
            if (filtroPapel === 'interprete') {
                papelMatch = artista.papel_principal === 'interprete'
            }
            else if (filtroPapel === 'compositor') {
                papelMatch = artista.papel_principal === 'compositor'
            } 
            else if (filtroPapel === 'ambos') {
                papelMatch = artista.papel_principal === 'ambos'     
            } 
            else if (filtroPapel === 'nenhum') {
                papelMatch = artista.papel_principal === 'nenhum'
            }
        }

        return nomeMatch && papelMatch
    })

    console.log(`Filtro aplicado: ${artistasFiltrados.length} artistas encontrados`)

    preencherTabela(artistasFiltrados)

    document.getElementById('mostrandoCount').textContent = artistasFiltrados.length
};

function limparFiltros(){
    console.log('Limpando filtros...')

    document.getElementById('filtroNome').value = '';
    document.getElementById('filtroPapel').value = 'todos'

    preencherTabela(todosArtistas)

    doccument.getElementById('mostrandoCount').textContent = todosArtistas.length
};

async function verDetalhesArtista(id) {
    console.log('Ver detalhes do artis ID:', id)
    window.location.href = `../artista/artista.html?id=${id}`
    
};

async function editarArtista(id, nomeAtual) {
    console.log('Editando artista ID:', id, 'Nome atual:', nomeAtual)

    try {
        const novoNome = await window.dialog.exibirDialogMensagem({
            titulo: 'Editar Artista',
            mensagem: `Editando artista ID: ${id}`,
            valorAtual: nomeAtual,
            campoPlaceholder: 'Digite o novo nome do artista...',
            btnCancelar: 'Cancelar',
            btnConfirmar: 'Salvar'
        })

        if (!novoNome) {
            console.log('Edição cancelada pelo usuário')
            return
        }

        if (novoNome === nomeAtual) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Sem alterações',
                mensagem: 'O nome do artista não foi alterado.'
            });
            return
        }

        const artistaExistente = await window.lojaMusica.artista.buscarPorNome(novoNome)

        if (artistaExistente && artistaExiste.artista_id !== id) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Nome já utilizado',
                mensagem: `Já existe um artista chamado "${novoNome}" cadastrado.`
            });
            return
        }

        console.log('Atualizando artista ID:', id, 'para:', novoNome)

        const artistaAtualizado = await window.lojaMusica.artista.editar(id, novoNome)

        await carregarArtistasComPapeis()

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Artista atualizado para: "${artistaAtualizado.nome}"!`
        })
        
    } catch (erro) {
        console.error('Erro ao editar artista:', erro);
        
        let mensagemErro = 'Erro ao editar artista.';
        
        if (erro.message.includes('não encontrado')) {
            mensagemErro = 'Artista não encontrado.';
        }
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: mensagemErro
        })
    }
}

async function deletarArtista(id) {
    console.log('Deletando artista ID:', id);
    
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: 'Tem certeza que deseja excluir este artista?\n\nEsta ação não poderá ser desfeita.'
    });

    if (!confirmado) return;
    
    try {
        await window.lojaMusica.artista.deletar(id);
        
        await carregarArtistasComPapeis();
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: 'Artista excluído com sucesso!'
        });

    } catch (erro) {
        console.error('Erro ao deletar artista:', erro);

        if (erro.message.includes('interpretes associados')) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Não é possível excluir',
                mensagem: 'Este artista possui músicas como intérprete e não pode ser excluído.'
            });
        } else if (erro.message.includes('compositores associados')) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Não é possível excluir',
                mensagem: 'Este artista possui músicas como compositor e não pode ser excluído.'
            });
        } else {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao deletar artista: ' + erro.message
            });
        }
    }
}

// tornando funções globais para que possam ser chamadas pelo botão HTML
window.filtrarTabela = filtrarTabela;
window.limparFiltros = limparFiltros;
window.verDetalhesArtista = verDetalhesArtista;
window.editarArtista = editarArtista;
window.deletarArtista = deletarArtista;