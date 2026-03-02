const formGravadora = document.getElementById('form-gravadora')
const listaGravadora = document.getElementById('lista-gravadora')
const tbodyGravadora = document.getElementById('tbody-gravadora')

// Variáveis para controle do modal de edição
let gravadoraEditandoId = null;
let gravadoraEditandoResolve = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, buscando gravadoras...');
    carregarGravadoras();
    
    configurarModalEdicao();
});

async function carregarGravadoras() {
    try {
        console.log('Carregando gravadoras...');
        
        const gravadoras = await window.lojaMusica.gravadora.listar();
        
        console.log('Gravadoras:', gravadoras);
        
        if (!gravadoras || gravadoras.length === 0) {
            if (tbodyGravadora) {
                tbodyGravadora.innerHTML = `
                    <tr>
                        <td colspan="3" style="text-align: center; padding: 20px; color: #666;">
                            Nenhuma gravadora cadastrada ainda
                        </td>
                    </tr>
                `;
            }
            return;
        }
        
        let html = '';
        for (const gravadora of gravadoras) {
            // escapa aspas simples no nome para não quebrar o HTML
            const nomeEscapada = gravadora.nome.replace(/'/g, "\\'");
            
            html += `
                <tr>
                    <td>${gravadora.gravadora_id}</td>
                    <td>${gravadora.nome}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="editarGravadora(${gravadora.gravadora_id}, '${nomeEscapada}')">
                            Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deletarGravadora(${gravadora.gravadora_id})">
                            Deletar
                        </button>
                    </td>
                </tr>
            `;
        }
        
        tbodyGravadora.innerHTML = html;
        
    } catch (erro) {
        console.error('Erro ao carregar gravadoras:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar gravadoras: ' + erro.message
        });
    }
}

async function verificarGravadoraExistente(nome, idIgnorar = null) {
    try {
        const gravadoraExistente = await window.lojaMusica.gravadora.buscarPorNome(nome);
        
        if (gravadoraExistente && (!idIgnorar || gravadoraExistente.gravadora_id !== idIgnorar)) {
            return gravadoraExistente; // gravadora já existe
        }
        
        return null;
    } catch (erro) {
        console.error('Erro ao verificar gravadora existente:', erro);
        throw erro;
    }
}

if (formGravadora) {
    formGravadora.addEventListener('submit', async (event) => {
        event.preventDefault()

        const inputNome = formGravadora.querySelector('[name="nome"]')
        const nome = inputNome.value.trim()
        
        if (!nome) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Atenção',
                mensagem: 'Por favor, digite um nome para a gravadora'
            });
            inputNome.focus();
            return;
        }

        try {
            console.log('Verificando se gravadora já existe:', nome);
            const gravadoraExistente = await verificarGravadoraExistente(nome);
            
            if (gravadoraExistente) {
                window.dialog.exibirDialogMensagem({
                    titulo: 'Gravadora já cadastrada',
                    mensagem: `A gravadora "${nome}" já está cadastrada no sistema.`
                });
                inputNome.focus();
                inputNome.select();
                return;
            }
            
            console.log('Cadastrando gravadora:', nome);
            
            const gravadoraCriada = await window.lojaMusica.gravadora.criar(nome)
            
            console.log('Gravadora criada:', gravadoraCriada);
            
            inputNome.value = ''
            await carregarGravadoras()
            
            window.dialog.exibirDialogMensagem({
                titulo: 'Sucesso',
                mensagem: `Gravadora "${nome}" cadastrada com sucesso!`
            });
            
        } catch (erro) {
            console.error('Erro ao cadastrar gravadora:', erro);
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao cadastrar gravadora: ' + erro.message
            });
        }
    })
}

function configurarModalEdicao() {
    const modal = document.getElementById('edicaoGravadoraModal');
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

function abrirModalEdicao(id, nomeAtual) {
    return new Promise((resolve) => {
        gravadoraEditandoId = id;
        gravadoraEditandoResolve = resolve;
        
        document.getElementById('edicaoTitulo').textContent = 'Editar Gravadora';
        document.getElementById('edicaoMensagem').textContent = `Editando gravadora ID: ${id}`;
        document.getElementById('valorAtualTexto').textContent = nomeAtual || '(vazio)';
        
        const input = document.getElementById('edicaoInput');
        input.value = nomeAtual;
        input.placeholder = 'Digite o novo nome da gravadora...';
        
        document.getElementById('edicaoGravadoraModal').style.display = 'flex';
    });
}

function fecharModalEdicao() {
    document.getElementById('edicaoGravadoraModal').style.display = 'none';
    if (gravadoraEditandoResolve) {
        gravadoraEditandoResolve(null);
        gravadoraEditandoResolve = null;
        gravadoraEditandoId = null;
    }
}

function confirmarEdicao() {
    const novoValor = document.getElementById('edicaoInput').value.trim();
    document.getElementById('edicaoGravadoraModal').style.display = 'none';
    
    if (gravadoraEditandoResolve) {
        gravadoraEditandoResolve(novoValor);
        gravadoraEditandoResolve = null;
        gravadoraEditandoId = null;
    }
}

async function editarGravadora(id, nomeAtual) {
    try {
        const novoNome = await abrirModalEdicao(id, nomeAtual);
        
        if (novoNome === null) {
            console.log('Edição cancelada pelo usuário');
            return;
        }
        
        if (!novoNome) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo vazio',
                mensagem: 'O nome da gravadora não pode ficar vazio.'
            });
            return;
        }
        
        if (novoNome === nomeAtual) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Sem alterações',
                mensagem: 'O nome da gravadora não foi alterado.'
            });
            return;
        }
        
        console.log('Verificando se já existe gravadora com nome:', novoNome);
        const gravadoraExistente = await verificarGravadoraExistente(novoNome, id);
        
        if (gravadoraExistente) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Nome já utilizado',
                mensagem: `Já existe uma gravadora chamada "${novoNome}" cadastrada.`
            });
            return
        }
        
        console.log('Atualizando gravadora ID:', id, 'para:', novoNome);
        
        const gravadoraAtualizada = await window.lojaMusica.gravadora.editar(id, novoNome);
        
        carregarGravadoras();
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Gravadora atualizada para: "${gravadoraAtualizada.nome}"`
        });
        
    } catch (erro) {
        console.error('Erro ao editar gravadora:', erro);
        
        let mensagemErro = 'Erro ao editar gravadora.';
        
        if (erro.message.includes('não encontrado')) {
            mensagemErro = 'Gravadora não encontrada.';
        } else if (erro.message.includes('unique') || erro.message.includes('duplicate')) {
            mensagemErro = 'Já existe uma gravadora com este nome.';
        }
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: mensagemErro
        });
    }
}

async function deletarGravadora(id) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: 'Tem certeza que deseja excluir esta gravadora?'
    });

    if (!confirmado) return;
    
    try {
        console.log('Deletando gravadora ID:', id);
        
        await window.lojaMusica.gravadora.deletar(id);
        
        carregarGravadoras();
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: 'Gravadora excluída com sucesso!'
        });
        
    } catch (erro) {
        console.error('Erro ao deletar gravadora:', erro);
        
        if (erro.message.includes('discos associados')) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Não é possível excluir',
                mensagem: 'Esta gravadora possui discos associados e não pode ser excluída.'
            });
        } else {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao deletar gravadora: ' + erro.message
            });
        }
    }
}

// tornar funções globais para os botões HTML
window.editarGravadora = editarGravadora;
window.deletarGravadora = deletarGravadora;
window.fecharModalEdicao = fecharModalEdicao;