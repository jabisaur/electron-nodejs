const formEstilo = document.getElementById('form-estilo');
const tbodyEstilos = document.getElementById('tbody-estilos');
const loadingOverlay = document.getElementById('loadingOverlay');

let estiloEditandoId = null;
let estiloEditandoResolve = null;

let paginaAtual = 1;
const itensPorPagina = 10;
let totalEstilosNoBanco = 0;
let estilosCarregados = []; 

document.addEventListener('DOMContentLoaded', () => {
    carregarEstilos();
    configurarModalEdicao();
});

async function carregarEstilos() {
    mostrarLoading(true);
    try {
        const estilos = await window.lojaMusica.estilo.listar(paginaAtual, itensPorPagina);
        totalEstilosNoBanco = await window.lojaMusica.estilo.contarTotal();
        estilosCarregados = estilos;
        
        atualizarTabela(estilos);
    } catch (erro) {
        console.error('Erro ao carregar estilos:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar estilos: ' + erro.message
        });
    } finally {
        mostrarLoading(false);
    }
}

function atualizarTabela(estilos) {
    if (!tbodyEstilos) return;

    const totalPaginas = Math.ceil(totalEstilosNoBanco / itensPorPagina);
    const inicioDisplay = (paginaAtual - 1) * itensPorPagina + 1;
    const fimDisplay = Math.min(paginaAtual * itensPorPagina, totalEstilosNoBanco);

    const infoPagina = document.getElementById('paginacaoInfo');
    if (infoPagina) infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas || 1}`;
    
    const resumo = document.getElementById('resumoResultados');
    if (resumo) {
        resumo.textContent = totalEstilosNoBanco === 0 
            ? `Mostrando 0 de 0 estilos`
            : `Mostrando ${inicioDisplay}-${fimDisplay} de ${totalEstilosNoBanco} estilos`;
    }

    const badgeTotal = document.getElementById('totalEstilosCount');
    if (badgeTotal) badgeTotal.textContent = `${totalEstilosNoBanco} estilo(s)`;

    document.getElementById('btnAnterior').disabled = paginaAtual <= 1;
    document.getElementById('btnProxima').disabled = paginaAtual >= totalPaginas;

    if (!estilos || estilos.length === 0) {
        tbodyEstilos.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Nenhum estilo cadastrado</td></tr>';
        return;
    }

    tbodyEstilos.innerHTML = estilos.map(estilo => {
        const descricaoEscapada = estilo.descricao.replace(/'/g, "\\'");
        return `
            <tr>
                <td>${estilo.estilo_id}</td>
                <td>${estilo.descricao}</td>
                <td>
                    <button class="btn btn-primary btn-sm me-1" onclick="editarEstilo(${estilo.estilo_id}, '${descricaoEscapada}')">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deletarEstilo(${estilo.estilo_id})">
                        <i class="bi bi-trash"></i> Deletar
                    </button>
                </td>
            </tr>`;
    }).join('');
}

function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        carregarEstilos();
    }
}

function proximaPagina() {
    const totalPaginas = Math.ceil(totalEstilosNoBanco / itensPorPagina);
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        carregarEstilos();
    }
}

function mostrarLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

async function verificarEstiloExistente(descricao, idIgnorar = null) {
    try {
        const estiloExistente = await window.lojaMusica.estilo.buscarPorDescricao(descricao);
        if (estiloExistente && (!idIgnorar || estiloExistente.estilo_id !== idIgnorar)) {
            return estiloExistente;
        }
        return null;
    } catch (erro) {
        console.error('Erro ao verificar estilo existente:', erro);
        throw erro;
    }
}

if (formEstilo) {
    formEstilo.addEventListener('submit', async (event) => {
        event.preventDefault();
        const inputDescricao = formEstilo.querySelector('[name="descricao"]');
        const descricao = inputDescricao.value.trim();
        
        if (!descricao) return;

        mostrarLoading(true);
        try {
            const estiloExistente = await verificarEstiloExistente(descricao);
            if (estiloExistente) {
                window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: `O estilo "${descricao}" já existe.` });
                return;
            }
            
            await window.lojaMusica.estilo.criar(descricao);
            inputDescricao.value = '';
            paginaAtual = 1;
            await carregarEstilos();
            
            window.dialog.exibirDialogMensagem({ titulo: 'Sucesso', mensagem: 'Estilo cadastrado!' });
        } catch (erro) {
            console.error(erro);
        } finally {
            mostrarLoading(false);
        }
    });
}

function configurarModalEdicao() {
    const btnConfirmar = document.getElementById('edicaoBtnConfirmar');
    if (btnConfirmar) btnConfirmar.onclick = confirmarEdicao;
}

function abrirModalEdicao(id, descricaoAtual) {
    return new Promise((resolve) => {
        estiloEditandoId = id;
        estiloEditandoResolve = resolve;
        
        document.getElementById('valorAtualTexto').textContent = descricaoAtual;
        document.getElementById('edicaoInput').value = descricaoAtual;
        document.getElementById('edicaoEstiloModal').style.display = 'flex';
    });
}

function fecharModalEdicao() {
    document.getElementById('edicaoEstiloModal').style.display = 'none';
    if (estiloEditandoResolve) {
        estiloEditandoResolve(null);
        estiloEditandoResolve = null;
    }
}

function confirmarEdicao() {
    const novoValor = document.getElementById('edicaoInput').value.trim();
    document.getElementById('edicaoEstiloModal').style.display = 'none';
    if (estiloEditandoResolve) {
        estiloEditandoResolve(novoValor);
        estiloEditandoResolve = null;
    }
}

async function editarEstilo(id, descricaoAtual) {
    const novaDescricao = await abrirModalEdicao(id, descricaoAtual);
    if (!novaDescricao || novaDescricao === descricaoAtual) return;

    mostrarLoading(true);
    try {
        const estiloExistente = await verificarEstiloExistente(novaDescricao, id);
        if (estiloExistente) {
            window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: 'Já existe um estilo com este nome.' });
            return;
        }
        
        await window.lojaMusica.estilo.editar(id, novaDescricao);
        await carregarEstilos();
    } catch (erro) {
        console.error(erro);
    } finally {
        mostrarLoading(false);
    }
}

async function deletarEstilo(id) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: 'Tem certeza que deseja excluir este estilo?'
    });

    if (!confirmado) return;
    
    mostrarLoading(true);
    try {
        const resultado = await window.lojaMusica.estilo.deletar(id);
        if (resultado && resultado.erro) throw new Error(resultado.erro);

        if (estilosCarregados.length === 1 && paginaAtual > 1) {
            paginaAtual--;
        }
        
        await carregarEstilos();
    } catch (erro) {
        window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: erro.message });
    } finally {
        mostrarLoading(false);
    }
}

window.editarEstilo = editarEstilo;
window.deletarEstilo = deletarEstilo;
window.fecharModalEdicao = fecharModalEdicao;
window.paginaAnterior = paginaAnterior;
window.proximaPagina = proximaPagina;