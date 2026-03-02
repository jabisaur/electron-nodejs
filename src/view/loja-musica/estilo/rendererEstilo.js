const formEstilo = document.getElementById('form-estilo')
const listaEstilos = document.getElementById('lista-estilos')
const tbodyEstilos = document.getElementById('tbody-estilos')

// Variáveis para controle do modal de edição
let estiloEditandoId = null;
let estiloEditandoResolve = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, buscando estilos...');
    carregarEstilos();
    
    configurarModalEdicao();
});

async function carregarEstilos() {
    try {
        console.log('Carregando estilos...');
        
        const estilos = await window.lojaMusica.estilo.listar();
        
        console.log('Estilos:', estilos);
        
        if (!estilos || estilos.length === 0) {
            if (tbodyEstilos) {
                tbodyEstilos.innerHTML = `
                    <tr>
                        <td colspan="3" style="text-align: center; padding: 20px; color: #666;">
                            Nenhum estilo cadastrado ainda
                        </td>
                    </tr>
                `;
            }
            return;
        }
        
        let html = '';
        for (const estilo of estilos) {
            // escapa aspas simples na descrição para não quebrar o HTML
            const descricaoEscapada = estilo.descricao.replace(/'/g, "\\'");
            
            html += `
                <tr>
                    <td>${estilo.estilo_id}</td>
                    <td>${estilo.descricao}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="editarEstilo(${estilo.estilo_id}, '${descricaoEscapada}')">
                            Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deletarEstilo(${estilo.estilo_id})">
                            Deletar
                        </button>
                    </td>
                </tr>
            `;
        }
        
        tbodyEstilos.innerHTML = html;
        
    } catch (erro) {
        console.error('Erro ao carregar estilos:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar estilos: ' + erro.message
        });
    }
}

async function verificarEstiloExistente(descricao, idIgnorar = null) {
    try {
        const estiloExistente = await window.lojaMusica.estilo.buscarPorDescricao(descricao);
        
        if (estiloExistente && (!idIgnorar || estiloExistente.estilo_id !== idIgnorar)) {
            return estiloExistente; // estilo já existe
        }
        
        return null;
    } catch (erro) {
        console.error('Erro ao verificar estilo existente:', erro);
        throw erro;
    }
}

if (formEstilo) {
    formEstilo.addEventListener('submit', async (event) => {
        event.preventDefault()

        const inputDescricao = formEstilo.querySelector('[name="descricao"]')
        const descricao = inputDescricao.value.trim()
        
        if (!descricao) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Atenção',
                mensagem: 'Por favor, digite um nome para o estilo'
            });
            inputDescricao.focus();
            return;
        }

        try {
            console.log('Verificando se estilo já existe:', descricao);
            const estiloExistente = await verificarEstiloExistente(descricao);
            
            if (estiloExistente) {
                window.dialog.exibirDialogMensagem({
                    titulo: 'Estilo já cadastrado',
                    mensagem: `O estilo "${descricao}" já está cadastrado no sistema.`
                });
                inputDescricao.focus();
                inputDescricao.select();
                return;
            }
            
            console.log('Cadastrando estilo:', descricao);
            
            const estiloCriado = await window.lojaMusica.estilo.criar(descricao)
            
            console.log('Estilo criado:', estiloCriado);
            
            inputDescricao.value = ''
            await carregarEstilos()
            
            window.dialog.exibirDialogMensagem({
                titulo: 'Sucesso',
                mensagem: `Estilo "${descricao}" cadastrado com sucesso!`
            });
            
        } catch (erro) {
            console.error('Erro ao cadastrar estilo:', erro);
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao cadastrar estilo: ' + erro.message
            });
        }
    })
}

function configurarModalEdicao() {
    const modal = document.getElementById('edicaoEstiloModal');
    const btnCancelar = document.getElementById('edicaoBtnCancelar');
    const btnConfirmar = document.getElementById('edicaoBtnConfirmar');
    
    if (!modal || !btnCancelar || !btnConfirmar) {
        console.error('Elementos do modal de edição não encontrados!');
        return;
    }
    
    btnCancelar.addEventListener('click', fecharModalEdicao);
    btnConfirmar.addEventListener('click', confirmarEdicao);
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            fecharModalEdicao();
        }
    });
}

function abrirModalEdicao(id, descricaoAtual) {
    return new Promise((resolve) => {
        estiloEditandoId = id;
        estiloEditandoResolve = resolve;
        
        document.getElementById('edicaoTitulo').textContent = 'Editar Estilo Musical';
        document.getElementById('edicaoMensagem').textContent = `Editando estilo ID: ${id}`;
        document.getElementById('valorAtualTexto').textContent = descricaoAtual || '(vazio)';
        
        const input = document.getElementById('edicaoInput');
        input.value = descricaoAtual;
        input.placeholder = 'Digite o novo nome do estilo...';
        
        document.getElementById('edicaoEstiloModal').style.display = 'flex';
    });
}

function fecharModalEdicao() {
    document.getElementById('edicaoEstiloModal').style.display = 'none';
    if (estiloEditandoResolve) {
        estiloEditandoResolve(null);
        estiloEditandoResolve = null;
        estiloEditandoId = null;
    }
}

function confirmarEdicao() {
    const novoValor = document.getElementById('edicaoInput').value.trim();
    document.getElementById('edicaoEstiloModal').style.display = 'none';
    
    if (estiloEditandoResolve) {
        estiloEditandoResolve(novoValor);
        estiloEditandoResolve = null;
        estiloEditandoId = null;
    }
}

async function editarEstilo(id, descricaoAtual) {
    try {
        const novaDescricao = await abrirModalEdicao(id, descricaoAtual);
        
        if (novaDescricao === null) {
            console.log('Edição cancelada pelo usuário');
            return;
        }
        
        if (!novaDescricao) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo vazio',
                mensagem: 'O nome do estilo não pode ficar vazio.'
            });
            return;
        }
        
        if (novaDescricao === descricaoAtual) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Sem alterações',
                mensagem: 'O nome do estilo não foi alterado.'
            });
            return;
        }
        
        console.log('Verificando se já existe estilo com nome:', novaDescricao);
        const estiloExistente = await verificarEstiloExistente(novaDescricao, id);
        
        if (estiloExistente) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Nome já utilizado',
                mensagem: `Já existe um estilo chamado "${novaDescricao}" cadastrado.`
            });
            return
        }
        
        console.log('Atualizando estilo ID:', id, 'para:', novaDescricao);
        
        const estiloAtualizado = await window.lojaMusica.estilo.editar(id, novaDescricao);
        
        carregarEstilos();
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Estilo atualizado para: "${estiloAtualizado.descricao}"`
        });
        
    } catch (erro) {
        console.error('Erro ao editar estilo:', erro);
        
        let mensagemErro = 'Erro ao editar estilo.';
        
        if (erro.message.includes('não encontrado')) {
            mensagemErro = 'Estilo não encontrado.';
        } else if (erro.message.includes('unique') || erro.message.includes('duplicate')) {
            mensagemErro = 'Já existe um estilo com este nome.';
        }
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: mensagemErro
        });
    }
}

async function deletarEstilo(id) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: 'Tem certeza que deseja excluir este estilo?'
    });

    if (!confirmado) return;
    
    try {
        console.log('Deletando estilo ID:', id);
        
        await window.lojaMusica.estilo.deletar(id);
        
        carregarEstilos();
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: 'Estilo excluído com sucesso!'
        });
        
    } catch (erro) {
        console.error('Erro ao deletar estilo:', erro);
        
        if (erro.message.includes('músicas associadas')) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Não é possível excluir',
                mensagem: 'Este estilo possui músicas associadas e não pode ser excluído.'
            });
        } else {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao deletar estilo: ' + erro.message
            });
        }
    }
}

// tornar funções globais para os botões HTML
window.editarEstilo = editarEstilo;
window.deletarEstilo = deletarEstilo;
window.fecharModalEdicao = fecharModalEdicao;