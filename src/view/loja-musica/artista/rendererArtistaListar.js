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
                            <i class="bi bi-exclamation-triangle"></i> Erro ao carregar artistas: ${erro.message}
                        </div>
                    </td>
                </tr>`
        }

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
    if (!artistas || artistas.length === 0) {
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
                        <i class="bi bi-info-circle"></i> Nenhum artista encontrado
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = ''

    artistas.forEach(artista => {
        let badgePapel = '';
        let badgeClass = '';
        let iconePapel = '';

        switch (artista.papel_principal) {
            case 'interprete':
                badgePapel = 'Intérprete';
                badgeClass = 'bg-success';
                iconePapel = '<i class="bi bi-mic"></i>';
                break;
            case 'compositor':
                badgePapel = 'Compositor';
                badgeClass = 'bg-warning text-dark';
                iconePapel = '<i class="bi bi-pencil"></i>';
                break;
            case 'ambos':
                badgePapel = 'Intérprete e Compositor';
                badgeClass = 'bg-info';
                iconePapel = '<i class="bi bi-star-fill"></i>';
                break;
            default:
                badgePapel = 'Sem papéis';
                badgeClass = 'bg-secondary';
                iconePapel = '<i class="bi bi-x-circle"></i>';
        }

        const nomeEscapado = artista.nome.replace(/'/g, "\\'");

        html += `
            <tr>
                <td>${artista.artista_id}</td>
                <td>
                    <strong>${artista.nome}</strong>
                    <br>
                    <small class="text-muted"><i class="bi bi-hash"></i> ID: ${artista.artista_id}</small>
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
                </td>
                <td class="text-center">
                    <span class="badge bg-primary">
                        ${artista.total_composicoes || 0}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-info btn-sm" 
                                onclick="verDetalhesArtista(${artista.artista_id})"
                                title="Ver detalhes">
                            <i class="bi bi-info-circle"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" 
                                onclick="deletarArtista(${artista.artista_id})"
                                title="Excluir">
                            <i class="bi bi-trash"></i> Excluir
                        </button>
                    </div>
                </td>
            </tr>`
    })

    tbody.innerHTML = html

    document.getElementById('mostrandoCount').textContent = artistas.length;
    document.getElementById('totalCount').textContent = todosArtistas.length;
};

function filtrarTabela() {
    console.log('Filtrando tabela...')

    const filtroNome = document.getElementById('filtroNome').value.toLowerCase().trim()
    const filtroPapel = document.getElementById('filtroPapel').value

    const artistasFiltrados = todosArtistas.filter(artista => {
        const nomeMatch = artista.nome.toLowerCase().includes(filtroNome)

        let papelMatch = true

        if (filtroPapel !== 'todos') {
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

function limparFiltros() {
    console.log('Limpando filtros...')

    document.getElementById('filtroNome').value = '';
    document.getElementById('filtroPapel').value = 'todos'

    preencherTabela(todosArtistas)

    document.getElementById('mostrandoCount').textContent = todosArtistas.length;
};

async function verDetalhesArtista(id) {
    console.log('Ver detalhes do artista ID:', id)
    window.location.href = `../artista/artista.html?id=${id}`
};

async function deletarArtista(id) {
    console.log('Deletando artista ID:', id);

    const artista = todosArtistas.find(a => a.artista_id === id);
    const nomeArtista = artista ? artista.nome : 'Artista';
    
    if (artista && (artista.total_interpretacoes > 0 || artista.total_composicoes > 0)) {
        const mensagem = `O artista "${nomeArtista}" possui:\n` +
            (artista.total_interpretacoes > 0 ? `- ${artista.total_interpretacoes} música(s) como intérprete\n` : '') +
            (artista.total_composicoes > 0 ? `- ${artista.total_composicoes} música(s) como compositor\n` : '') +
            '\nPara excluir este artista, primeiro remova todas as associações com músicas.';
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Não é possível excluir',
            mensagem: mensagem
        });
        return;
    }

    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: `Tem certeza que deseja excluir o artista "${nomeArtista}"?\n\nEsta ação não poderá ser desfeita.`
    });

    if (!confirmado) {
        console.log('Exclusão cancelada pelo usuário');
        return;
    }

    try {
        console.log('Chamando API para deletar artista ID:', id);
        const resultado = await window.lojaMusica.artista.deletar(id);
        console.log('Resultado da exclusão:', resultado);

        await carregarArtistasComPapeis();

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Artista "${nomeArtista}" excluído com sucesso!`
        });

    } catch (erro) {
        console.error('Erro ao deletar artista:', erro);
        console.error('Mensagem de erro:', erro.message);
        console.error('Stack trace:', erro.stack);

        if (erro.message.includes('interpretes associados')) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Não é possível excluir',
                mensagem: `O artista "${nomeArtista}" possui músicas como intérprete e não pode ser excluído.`
            });
        } else if (erro.message.includes('compositores associados')) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Não é possível excluir',
                mensagem: `O artista "${nomeArtista}" possui músicas como compositor e não pode ser excluído.`
            });
        } else {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao deletar artista: ' + erro.message
            });
        }
    }
}

window.filtrarTabela = filtrarTabela;
window.limparFiltros = limparFiltros;
window.verDetalhesArtista = verDetalhesArtista;
window.deletarArtista = deletarArtista;