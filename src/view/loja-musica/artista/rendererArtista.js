const formArtista = document.getElementById('form-artista');
const tbodyArtistas = document.getElementById('tbody-artistas');
const loadingOverlay = document.getElementById('loadingOverlay');

let artistaEditandoId = null;
let artistaEditandoResolve = null;

let paginaAtual = 1;
const itensPorPagina = 10;
let totalArtistasNoBanco = 0;

document.addEventListener('DOMContentLoaded', () => {
    carregarArtistas();
    configurarModalEdicao();
});

async function carregarArtistas() {
    mostrarLoading(true);
    try {
        const artistas = await window.lojaMusica.artista.listar(paginaAtual, itensPorPagina);

        totalArtistasNoBanco = await window.lojaMusica.artista.contarTotal();
        
        atualizarTabela(artistas);
    } catch (erro) {
        console.error('Erro ao carregar artistas:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar a lista de artistas.'
        });
    } finally {
        mostrarLoading(false);
    }
}

function atualizarTabela(artistas) {
    if (!tbodyArtistas) return;

    const totalPaginas = Math.ceil(totalArtistasNoBanco / itensPorPagina);
    const inicioDisplay = (paginaAtual - 1) * itensPorPagina + 1;
    const fimDisplay = Math.min(paginaAtual * itensPorPagina, totalArtistasNoBanco);

    const infoPagina = document.getElementById('paginacaoInfo');
    if (infoPagina) infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas || 1}`;
    
    const resumo = document.getElementById('resumoResultados');
    if (resumo) {
        resumo.textContent = totalArtistasNoBanco === 0 
            ? "Nenhum artista encontrado" 
            : `Mostrando ${inicioDisplay}-${fimDisplay} de ${totalArtistasNoBanco} artistas`;
    }

    const badgeTotal = document.getElementById('totalArtistasCount');
    if (badgeTotal) badgeTotal.textContent = `${totalArtistasNoBanco} artista(s)`;

    document.getElementById('btnAnterior').disabled = paginaAtual <= 1;
    document.getElementById('btnProxima').disabled = paginaAtual >= totalPaginas;

    if (!artistas || artistas.length === 0) {
        tbodyArtistas.innerHTML = '<tr><td colspan="3" class="text-center">Nenhum artista cadastrado ainda.</td></tr>';
        return;
    }

    tbodyArtistas.innerHTML = artistas.map(artista => {
    const nomeEscapada = artista.nome.replace(/'/g, "\\'");
    return `
        <tr>
            <td>${artista.artista_id}</td>
            <td>${artista.nome}</td>
            <td>
                <div class="d-flex gap-1">
                    <button class="btn btn-warning btn-sm" onclick="editarArtista(${artista.artista_id}, '${nomeEscapada}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deletarArtista(${artista.artista_id})" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        carregarArtistas();
    }
}

function proximaPagina() {
    const totalPaginas = Math.ceil(totalArtistasNoBanco / itensPorPagina);
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        carregarArtistas();
    }
}

if (formArtista) {
    formArtista.addEventListener('submit', async (event) => {
        event.preventDefault();
        const inputNome = formArtista.querySelector('[name="nome"]');
        const nome = inputNome.value.trim();

        if (!nome) return;

        try {
            const existe = await window.lojaMusica.artista.buscarPorNome(nome);
            if (existe) {
                window.dialog.exibirDialogMensagem({ titulo: 'Atenção', mensagem: 'Este artista já está cadastrado.' });
                return;
            }
            
            await window.lojaMusica.artista.criar(nome);
            inputNome.value = '';
            paginaAtual = 1;
            await carregarArtistas();
            
            window.dialog.exibirDialogMensagem({ titulo: 'Sucesso', mensagem: 'Artista cadastrado com sucesso!' });
        } catch (erro) {
            console.error(erro);
        }
    });
}

function configurarModalEdicao() {
    const btnConfirmar = document.getElementById('edicaoBtnConfirmar');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarEdicao);
    }
}

function abrirModalEdicao(id, nomeAtual) {
    return new Promise((resolve) => {
        artistaEditandoId = id;
        artistaEditandoResolve = resolve;
        
        document.getElementById('valorAtualTexto').textContent = nomeAtual;
        document.getElementById('edicaoInput').value = nomeAtual;
        document.getElementById('edicaoArtistaModal').style.display = 'flex';
    });
}

function fecharModalEdicao() {
    document.getElementById('edicaoArtistaModal').style.display = 'none';
    if (artistaEditandoResolve) {
        artistaEditandoResolve(null);
        artistaEditandoResolve = null;
    }
}

function confirmarEdicao() {
    const novoValor = document.getElementById('edicaoInput').value.trim();
    document.getElementById('edicaoArtistaModal').style.display = 'none';
    if (artistaEditandoResolve) {
        artistaEditandoResolve(novoValor);
        artistaEditandoResolve = null;
    }
}

async function editarArtista(id, nomeAtual) {
    const novoNome = await abrirModalEdicao(id, nomeAtual);
    
    if (!novoNome || novoNome === nomeAtual) return;

    try {
        const existe = await window.lojaMusica.artista.buscarPorNome(novoNome);
        if (existe && existe.artista_id !== id) {
            window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: 'Já existe um artista com este nome.' });
            return;
        }
        
        await window.lojaMusica.artista.editar(id, novoNome);
        await carregarArtistas();
    } catch (erro) {
        console.error(erro);
    }
}

async function deletarArtista(id) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: 'Tem certeza que deseja excluir este artista?'
    });

    if (!confirmado) return;
    
    try {
        const resultado = await window.lojaMusica.artista.deletar(id);
        if (resultado && resultado.erro) throw new Error(resultado.erro);

        if (paginaAtual > 1 && document.querySelectorAll('#tbody-artistas tr').length === 1) {
            paginaAtual--;
        }
        
        await carregarArtistas();
    } catch (erro) {
        window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: erro.message });
    }
}

function mostrarLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

window.editarArtista = editarArtista;
window.deletarArtista = deletarArtista;
window.fecharModalEdicao = fecharModalEdicao;
window.paginaAnterior = paginaAnterior;
window.proximaPagina = proximaPagina;