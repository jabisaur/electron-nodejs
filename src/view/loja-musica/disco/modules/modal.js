// modal.js
import { setDiscoEditandoDados } from './core.js';
import { carregarGravadorasNoSelectEdicao, carregarInterpretesNoSelectEdicao } from './selects.js';
import { formatarData } from './utils.js';

// Variáveis locais do módulo
let discoEditandoIdLocal = null;
let discoEditandoResolveLocal = null;

export function configurarModalEdicao() {
    console.log('Configurando modal de edição...');
    
    // Tentar encontrar os elementos novamente
    const modal = document.getElementById('edicaoDiscoModal');
    const btnCancelar = document.getElementById('edicaoBtnCancelar');
    const btnConfirmar = document.getElementById('edicaoBtnConfirmar');
    const closeBtn = document.querySelector('#edicaoDiscoModal .close-btn');
    
    console.log('Elementos do modal (segunda tentativa):', { 
        modal: !!modal, 
        btnCancelar: !!btnCancelar, 
        btnConfirmar: !!btnConfirmar, 
        closeBtn: !!closeBtn 
    });
    
    if (!modal) {
        console.error('Modal não encontrado mesmo após esperar!');
        return;
    }
    
    if (!btnCancelar || !btnConfirmar) {
        console.error('Botões do modal não encontrados!');
        console.log('IDs procurados: edicaoBtnCancelar, edicaoBtnConfirmar');
        return;
    }
    
    // Remover event listeners antigos (clonando e substituindo)
    const novoBtnCancelar = btnCancelar.cloneNode(true);
    const novoBtnConfirmar = btnConfirmar.cloneNode(true);
    
    btnCancelar.parentNode.replaceChild(novoBtnCancelar, btnCancelar);
    btnConfirmar.parentNode.replaceChild(novoBtnConfirmar, btnConfirmar);
    
    // Adicionar novos event listeners
    novoBtnCancelar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Botão Cancelar clicado');
        fecharModalEdicao();
    });
    
    novoBtnConfirmar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Botão Confirmar clicado');
        confirmarEdicao();
    });
    
    if (closeBtn) {
        const novoCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(novoCloseBtn, closeBtn);
        
        novoCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão Fechar clicado');
            fecharModalEdicao();
        });
    }
    
    // Evento para fechar clicando fora do modal
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            console.log('Clique fora do modal');
            fecharModalEdicao();
        }
    });
    
    console.log('Modal de edição configurado com sucesso');
}

export function abrirModalEdicao(id, dados) {
    console.log('abrirModalEdicao chamado com:', { id, dados });
    
    return new Promise((resolve) => {
        console.log('Promise do modal criada');
        
        discoEditandoIdLocal = id;
        discoEditandoResolveLocal = resolve;
        setDiscoEditandoDados(dados);

        // Preencher título e mensagem
        const tituloEl = document.getElementById('edicaoTitulo');
        const mensagemEl = document.getElementById('edicaoMensagem');
        
        if (tituloEl) tituloEl.textContent = 'Editar Disco';
        if (mensagemEl) mensagemEl.textContent = `Editando disco ID: ${id}`;
        
        // Mostrar valores atuais
        const valorAtualTexto = document.getElementById('valorAtualTexto');
        if (valorAtualTexto) valorAtualTexto.textContent = dados.nome || '(vazio)';
        
        const dataFormatada = dados.data_lancamento ? formatarData(dados.data_lancamento) : '(vazio)';
        const valorAtualData = document.getElementById('valorAtualData');
        if (valorAtualData) valorAtualData.textContent = dataFormatada;

        const gravadoraNome = dados.gravadora_nome || 'Não informada';
        const valorAtualGravadora = document.getElementById('valorAtualGravadora');
        if (valorAtualGravadora) valorAtualGravadora.textContent = gravadoraNome;

        // Carregar intérprete atual
        carregarInterpreteAtual(id);

        // Preencher campos do formulário
        const edicaoNome = document.getElementById('edicaoNome');
        const edicaoData = document.getElementById('edicaoData');
        const edicaoImagem = document.getElementById('edicaoImagem');
        
        if (edicaoNome) edicaoNome.value = dados.nome || '';
        if (edicaoData) edicaoData.value = dados.data_lancamento ? dados.data_lancamento.split('T')[0] : '';
        if (edicaoImagem) edicaoImagem.value = dados.imagem || '';

        // Carregar selects com valores selecionados
        carregarGravadorasNoSelectEdicao(dados.gravadora_id);
        carregarInterpretesNoSelectEdicao(dados.interprete_principal_id);
        
        // Mostrar modal
        const modal = document.getElementById('edicaoDiscoModal');
        if (modal) {
            modal.style.display = 'flex';
            console.log('Modal exibido');
        } else {
            console.error('Modal não encontrado!');
        }
        
        console.log('Modal aberto para edição do disco ID:', id);
        console.log('Resolve function armazenada:', !!discoEditandoResolveLocal);
    });
}

async function carregarInterpreteAtual(discoId) {
    try {
        const spanInterprete = document.getElementById('valorAtualInterprete');
        if (!spanInterprete) return;
        
        const interprete = await window.lojaMusica.disco.getInterpretePrincipal(discoId);
        spanInterprete.textContent = interprete ? interprete.nome : 'Não informado';
        console.log('Intérprete atual carregado:', interprete?.nome);
    } catch (erro) {
        console.error('Erro ao carregar intérprete atual:', erro);
        const spanInterprete = document.getElementById('valorAtualInterprete');
        if (spanInterprete) spanInterprete.textContent = 'Erro ao carregar';
    }
}

export function fecharModalEdicao() {
    console.log('fecharModalEdicao chamado');
    
    const modal = document.getElementById('edicaoDiscoModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal ocultado');
    }
    
    if (discoEditandoResolveLocal) {
        console.log('Resolvendo Promise com null');
        discoEditandoResolveLocal(null);
        discoEditandoResolveLocal = null;
        discoEditandoIdLocal = null;
        setDiscoEditandoDados(null);
    }
    
    // Remove o parâmetro ID da URL
    const url = new URL(window.location);
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url);
    
    console.log('Modal fechado');
}

function confirmarEdicao() {
    console.log('confirmarEdicao chamado');
    console.log('Resolve function existe?', !!discoEditandoResolveLocal);
    
    // Validar campos obrigatórios
    const nome = document.getElementById('edicaoNome')?.value.trim();
    const data = document.getElementById('edicaoData')?.value;
    const gravadora = document.getElementById('edicaoGravadora')?.value;
    const interprete = document.getElementById('interprete_id_edicao')?.value;
    const imagem = document.getElementById('edicaoImagem')?.value.trim();
    
    console.log('Valores do formulário:', { nome, data, gravadora, interprete, imagem });
    
    if (!nome) {
        console.log('Validação falhou: nome vazio');
        if (window.dialog && window.dialog.exibirDialogMensagem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'O nome do disco não pode ficar vazio.'
            });
        } else {
            alert('O nome do disco não pode ficar vazio.');
        }
        return;
    }
    
    if (!data) {
        console.log('Validação falhou: data vazia');
        if (window.dialog && window.dialog.exibirDialogMensagem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'A data de lançamento não pode ficar vazia.'
            });
        } else {
            alert('A data de lançamento não pode ficar vazia.');
        }
        return;
    }
    
    if (!gravadora) {
        console.log('Validação falhou: gravadora vazia');
        if (window.dialog && window.dialog.exibirDialogMensagem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Selecione uma gravadora.'
            });
        } else {
            alert('Selecione uma gravadora.');
        }
        return;
    }
    
    if (!interprete) {
        console.log('Validação falhou: intérprete vazio');
        if (window.dialog && window.dialog.exibirDialogMensagem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Selecione o intérprete principal.'
            });
        } else {
            alert('Selecione o intérprete principal.');
        }
        return;
    }
    
    const novosDados = {
        nome: nome,
        data_lancamento: data,
        imagem: imagem || null,
        gravadora_id: gravadora ? parseInt(gravadora) : null,
        interprete_id: interprete ? parseInt(interprete) : null
    };

    console.log('Dados do formulário processados:', novosDados);
    
    // Fechar modal
    const modal = document.getElementById('edicaoDiscoModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal ocultado');
    }

    // Resolver a Promise com os novos dados
    if (discoEditandoResolveLocal) {
        console.log('Resolvendo Promise com dados:', novosDados);
        discoEditandoResolveLocal(novosDados);
        discoEditandoResolveLocal = null;
        discoEditandoIdLocal = null;
        setDiscoEditandoDados(null);
        console.log('Dados enviados para edição');
    } else {
        console.error('Resolve function não encontrada! discoEditandoResolveLocal =', discoEditandoResolveLocal);
    }
}

// Tornar função disponível globalmente para o botão de fechar no HTML
window.fecharModalEdicao = fecharModalEdicao;
window.confirmarEdicao = confirmarEdicao;