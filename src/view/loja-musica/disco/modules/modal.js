import { setDiscoEditandoId, setDiscoEditandoResolve, setDiscoEditandoDados } from './core.js';
import { carregarGravadorasNoSelectEdicao, carregarInterpretesNoSelectEdicao } from './selects.js';
import { formatarData } from './utils.js';

let discoEditandoId = null;
let discoEditandoResolve = null;

export function configurarModalEdicao() {
    const modal = document.getElementById('edicaoDiscoModal');
    const btnCancelar = document.getElementById('edicaoBtnCancelar');
    const btnConfirmar = document.getElementById('edicaoBtnConfirmar');
    const closeBtn = document.querySelector('#edicaoDiscoModal .close-btn');
    
    if (!modal || !btnCancelar || !btnConfirmar) return;
    
    btnCancelar.addEventListener('click', fecharModalEdicao);
    btnConfirmar.addEventListener('click', confirmarEdicao);
    if (closeBtn) closeBtn.addEventListener('click', fecharModalEdicao);
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) fecharModalEdicao();
    });
}

export function abrirModalEdicao(id, dados) {
    return new Promise((resolve) => {
        discoEditandoId = id;
        discoEditandoResolve = resolve;
        setDiscoEditandoDados(dados);

        document.getElementById('edicaoTitulo').textContent = 'Editar Disco';
        document.getElementById('edicaoMensagem').textContent = `Editando disco ID: ${id}`;
        
        document.getElementById('valorAtualTexto').textContent = dados.nome || '(vazio)';
        
        const dataFormatada = dados.data_lancamento ? formatarData(dados.data_lancamento) : '(vazio)';
        document.getElementById('valorAtualData').textContent = dataFormatada;

        const gravadoraNome = dados.gravadora_nome || 'Não informada';
        document.getElementById('valorAtualGravadora').textContent = gravadoraNome;

        carregarInterpreteAtual(id);

        document.getElementById('edicaoNome').value = dados.nome || '';
        document.getElementById('edicaoData').value = dados.data_lancamento ? dados.data_lancamento.split('T')[0] : '';
        document.getElementById('edicaoImagem').value = dados.imagem || '';

        carregarGravadorasNoSelectEdicao(dados.gravadora_id);
        carregarInterpretesNoSelectEdicao(dados.interprete_principal_id);
        
        document.getElementById('edicaoDiscoModal').style.display = 'flex';
    });
}

async function carregarInterpreteAtual(discoId) {
    try {
        const spanInterprete = document.getElementById('valorAtualInterprete');
        if (!spanInterprete) return;
        
        const interprete = await window.lojaMusica.disco.getInterpretePrincipal(discoId);
        spanInterprete.textContent = interprete ? interprete.nome : 'Não informado';
    } catch (erro) {
        console.error('Erro ao carregar intérprete atual:', erro);
    }
}

export function fecharModalEdicao() {
    document.getElementById('edicaoDiscoModal').style.display = 'none';
    if (discoEditandoResolve) {
        discoEditandoResolve(null);
        discoEditandoResolve = null;
        discoEditandoId = null;
        setDiscoEditandoDados(null);
    }
    
    // remove o parâmetro ID da URL
    const url = new URL(window.location);
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url);
}

function confirmarEdicao() {
    const novosDados = {
        nome: document.getElementById('edicaoNome').value.trim(),
        data_lancamento: document.getElementById('edicaoData').value,
        imagem: document.getElementById('edicaoImagem').value.trim() || null,
        gravadora_id: document.getElementById('edicaoGravadora').value,
        interprete_id: document.getElementById('interprete_id_edicao').value
    };

    document.getElementById('edicaoDiscoModal').style.display = 'none';

    if (discoEditandoResolve) {
        discoEditandoResolve({
            ...novosDados,
            gravadora_id: novosDados.gravadora_id ? parseInt(novosDados.gravadora_id) : null,
            interprete_id: novosDados.interprete_id ? parseInt(novosDados.interprete_id) : null
        });
        discoEditandoResolve = null;
        discoEditandoId = null;
        setDiscoEditandoDados(null);
    }
}