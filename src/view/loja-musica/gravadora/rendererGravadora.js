const formGravadora = document.getElementById('form-gravadora')
const tbodyGravadora = document.getElementById('tbody-gravadora')

let gravadoraEditandoId = null;
let gravadoraEditandoResolve = null;

let paginaAtual = 1;
const itensPorPagina = 10;
let totalGravadorasNoBanco = 0;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, buscando gravadoras...');
    carregarGravadoras();
    configurarModalEdicao();
});

async function carregarMusicas() {
    await carregarGravadoras();
}

async function carregarGravadoras() {
    try {
        const gravadoras = await window.lojaMusica.gravadora.listar(paginaAtual, itensPorPagina);
        
        totalGravadorasNoBanco = await window.lojaMusica.gravadora.contarTotal();
        
        console.log('Gravadoras carregadas:', gravadoras.length, 'Total no banco:', totalGravadorasNoBanco);
        
        atualizarTabela(gravadoras);
        
    } catch (erro) {
        console.error('Erro ao carregar gravadoras:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar gravadoras: ' + erro.message
        });
    }
}

function atualizarTabela(gravadoras) {
    if (!tbodyGravadora) return;

    const totalPaginas = Math.ceil(totalGravadorasNoBanco / itensPorPagina);
    const inicioDisplay = (paginaAtual - 1) * itensPorPagina + 1;
    const fimDisplay = Math.min(paginaAtual * itensPorPagina, totalGravadorasNoBanco);

    document.getElementById('paginacaoInfo').textContent = `Página ${paginaAtual} de ${totalPaginas || 1}`;
    
    const resumo = document.getElementById('resumoResultados');
    if (resumo) {
        resumo.textContent = totalGravadorasNoBanco === 0 
            ? `Mostrando 0 de 0 gravadoras`
            : `Mostrando ${inicioDisplay}-${fimDisplay} de ${totalGravadorasNoBanco} gravadoras`;
    }


    document.getElementById('btnAnterior').disabled = paginaAtual <= 1;
    document.getElementById('btnProxima').disabled = paginaAtual >= totalPaginas;

    if (!gravadoras || gravadoras.length === 0) {
        tbodyGravadora.innerHTML = '<tr><td colspan="3" class="text-center">Nenhuma gravadora cadastrada</td></tr>';
        return;
    }

    let html = '';
    gravadoras.forEach(gravadora => {
        const nomeEscapada = gravadora.nome.replace(/'/g, "\\'");
        html += `
            <tr>
                <td>${gravadora.gravadora_id}</td>
                <td>${gravadora.nome}</td>
                <td>
                    <button class="btn btn-primary btn-sm me-1" onclick="editarGravadora(${gravadora.gravadora_id}, '${nomeEscapada}')">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deletarGravadora(${gravadora.gravadora_id})">
                        <i class="bi bi-trash"></i> Deletar
                    </button>
                </td>
            </tr>`;
    });
    tbodyGravadora.innerHTML = html;
}

function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        carregarGravadoras();
    }
}

function proximaPagina() {
    const totalPaginas = Math.ceil(totalGravadorasNoBanco / itensPorPagina);
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        carregarGravadoras();
    }
}

async function verificarGravadoraExistente(nome, idIgnorar = null) {
    try {
        const gravadoraExistente = await window.lojaMusica.gravadora.buscarPorNome(nome);
        if (gravadoraExistente && (!idIgnorar || gravadoraExistente.gravadora_id !== idIgnorar)) {
            return gravadoraExistente;
        }
        return null;
    } catch (erro) {
        console.error('Erro ao verificar gravadora:', erro);
        throw erro;
    }
}

if (formGravadora) {
    formGravadora.addEventListener('submit', async (event) => {
        event.preventDefault()
        const inputNome = formGravadora.querySelector('[name="nome"]')
        const nome = inputNome.value.trim()
        
        if (!nome) {
            window.dialog.exibirDialogMensagem({ titulo: 'Atenção', mensagem: 'Digite um nome para a gravadora' });
            return;
        }

        try {
            const gravadoraExistente = await verificarGravadoraExistente(nome);
            if (gravadoraExistente) {
                window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: `A gravadora "${nome}" já existe.` });
                return;
            }
            
            await window.lojaMusica.gravadora.create(nome);
            paginaAtual = 1;
            await carregarGravadoras();
            
            window.dialog.exibirDialogMensagem({ titulo: 'Sucesso', mensagem: 'Gravadora cadastrada!' });
        } catch (erro) {
            console.error(erro);
        }
    })
}

function configurarModalEdicao() {
    const btnCancelar = document.getElementById('edicaoBtnCancelar');
    const btnConfirmar = document.getElementById('edicaoBtnConfirmar');
    btnCancelar.onclick = fecharModalEdicao;
    btnConfirmar.onclick = confirmarEdicao;
}

function abrirModalEdicao(id, nomeAtual) {
    return new Promise((resolve) => {
        gravadoraEditandoId = id;
        gravadoraEditandoResolve = resolve;
        document.getElementById('valorAtualTexto').textContent = nomeAtual;
        document.getElementById('edicaoInput').value = nomeAtual;
        document.getElementById('edicaoGravadoraModal').style.display = 'flex';
    });
}

function fecharModalEdicao() {
    document.getElementById('edicaoGravadoraModal').style.display = 'none';
    if (gravadoraEditandoResolve) gravadoraEditandoResolve(null);
}

function confirmarEdicao() {
    const novoValor = document.getElementById('edicaoInput').value.trim();
    document.getElementById('edicaoGravadoraModal').style.display = 'none';
    if (gravadoraEditandoResolve) gravadoraEditandoResolve(novoValor);
}

async function editarGravadora(id, nomeAtual) {
    const novoNome = await abrirModalEdicao(id, nomeAtual);
    if (!novoNome || novoNome === nomeAtual) return;

    try {
        const existente = await verificarGravadoraExistente(novoNome, id);
        if (existente) {
            window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: 'Este nome já está em uso.' });
            return;
        }
        await window.lojaMusica.gravadora.editar(id, novoNome);
        await carregarGravadoras();
    } catch (erro) {
        console.error(erro);
    }
}

async function deletarGravadora(id) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: 'Deseja realmente excluir esta gravadora?'
    });
    if (!confirmado) return;
    
    try {
        const resultado = await window.lojaMusica.gravadora.deletar(id);
        if (resultado && resultado.erro) throw new Error(resultado.erro);
        
        if (musicasFiltradas.length === 1 && paginaAtual > 1) paginaAtual--;
        
        await carregarGravadoras();
    } catch (erro) {
        window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: erro.message });
    }
}

window.editarGravadora = editarGravadora;
window.deletarGravadora = deletarGravadora;
window.paginaAnterior = paginaAnterior;
window.proximaPagina = proximaPagina;