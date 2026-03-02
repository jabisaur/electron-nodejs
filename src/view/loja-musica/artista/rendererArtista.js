const formArtista = document.getElementById('form-artista')
const listaArtistas = document.getElementById('lista-artistas')
const tbodyArtistas = document.getElementById('tbody-artistas')

// variáveis para controle do modal de edição
let artistaEditandoId = null;
let artistaEditandoResolve = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, buscando artistas...')
    carregarArtistas()
    configurarModalEdicao()
});

async function carregarArtistas() {
    try {
        console.log('Carregando artistas...')

        const artistas = await window.lojaMusica.artista.listar()

        console.log('Artistas: ', artistas)

        if (!artistas || artistas.length === 0) {
            if (tbodyArtistas) {
                tbodyArtistas.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 20px; color: #666;">
                        Nenhum artista cadastrado ainda.
                    </td>
                </tr>
                `
            }
            return
        }

        let html = ''
        for (const artista of artistas) {
            const nomeEscapada = artista.nome.replace(/'/g, "\\'")

            html += `
                <tr>
                    <td>${artista.artista_id}</td>
                    <td>${artista.nome}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="editarArtista(${artista.artista_id}, '${nomeEscapada}')">
                            Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deletarArtista(${artista.artista_id})">
                            Deletar
                        </button>
                    </td>
                </tr>
            `
        }

        tbodyArtistas.innerHTML = html
        
    } catch (erro) {
        console.error('Erro ao carregar artistas: ', erro)
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar artistas: ' + erro.message
        })
    }
}

async function verificarArtistaExistente(nome, idIgnorar = null) {
    try {
        const artistaExistente = await window.lojaMusica.artista.buscarPorNome(nome)
        
        if (artistaExistente && (!idIgnorar || artistaExistente.artista_id !== idIgnorar)) {
            return artistaExistente
        }
        
        return null
    } catch (erro) {
        console.error('Erro ao verificar artista existente:', erro)
        throw erro
    }
}

if (formArtista) {
    formArtista.addEventListener('submit', async (event) => {
        event.preventDefault()

        const inputNome = formArtista.querySelector('[name="nome"]')
        const nome = inputNome.value.trim()

        if (!nome) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Atenção',
                mensagem: 'Por favor, digite um nome para o artista'
            })
            inputNome.focus()
            return
        }

        try {
            console.log('Verificando se artista já existe:', nome)
            const artistaExistente = await verificarArtistaExistente(nome)
            
            if (artistaExistente) {
                window.dialog.exibirDialogMensagem({
                    titulo: 'Artista já cadastrado',
                    mensagem: `O artista "${nome}" já está cadastrado no sistema.`
                })
                inputNome.focus()
                inputNome.select()
                return
            }

            console.log('Cadastrando artista...', nome)

            const artistaCriado = await window.lojaMusica.artista.criar(nome)

            console.log('Artista criado: ', artistaCriado)

            inputNome.value = ''
            await carregarArtistas()

            window.dialog.exibirDialogMensagem({
                titulo: 'Sucesso',
                mensagem: `Artista "${artistaCriado.nome}" criado com sucesso!`
            })
            
        } catch (erro) {
            console.error('Erro ao cadastrar artista: ', erro)
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao cadastrar artista: ' + erro.message
            })
        }
    })
}

function configurarModalEdicao() {
    const modal = document.getElementById('edicaoArtistaModal')
    const btnCancelar = document.getElementById('edicaoBtnCancelar')
    const btnConfirmar = document.getElementById('edicaoBtnConfirmar')
    
    if (!modal || !btnCancelar || !btnConfirmar) {
        console.error('Elementos do modal de edição não encontrados!')
        return
    }
    
    btnCancelar.addEventListener('click', fecharModalEdicao)
    btnConfirmar.addEventListener('click', confirmarEdicao)
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            fecharModalEdicao()
        }
    })
}

function abrirModalEdicao(id, nomeAtual) {
    return new Promise((resolve) => {
        artistaEditandoId = id
        artistaEditandoResolve = resolve
        
        document.getElementById('edicaoTitulo').textContent = 'Editar Artista'
        document.getElementById('edicaoMensagem').textContent = `Editando artista ID: ${id}`
        document.getElementById('valorAtualTexto').textContent = nomeAtual || '(vazio)'
        
        const input = document.getElementById('edicaoInput')
        input.value = nomeAtual || ''
        input.placeholder = 'Digite o novo nome do artista...'
        
        document.getElementById('edicaoArtistaModal').style.display = 'flex'
        
    })
}

function fecharModalEdicao() {
    document.getElementById('edicaoArtistaModal').style.display = 'none'
    if (artistaEditandoResolve) {
        artistaEditandoResolve(null)
        artistaEditandoResolve = null
        artistaEditandoId = null
    }
}

function confirmarEdicao() {
    const novoValor = document.getElementById('edicaoInput').value.trim()
    document.getElementById('edicaoArtistaModal').style.display = 'none'
    
    if (artistaEditandoResolve) {
        artistaEditandoResolve(novoValor)
        artistaEditandoResolve = null
        artistaEditandoId = null
    }
}

async function editarArtista(id, nomeAtual) {
    try {
        const novoNome = await abrirModalEdicao(id, nomeAtual)
        
        if (novoNome === null) {
            console.log('Edição cancelada pelo usuário')
            return
        }
        
        if (!novoNome) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo vazio',
                mensagem: 'O nome do artista não pode ficar vazio.'
            })
            return
        }
        
        if (novoNome === nomeAtual) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Sem alterações',
                mensagem: 'O nome do artista não foi alterado.'
            })
            return
        }

        console.log('Verificando se já existe artista com nome:', novoNome)
        const artistaExistente = await verificarArtistaExistente(novoNome, id)
        
        if (artistaExistente) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Nome já utilizado',
                mensagem: `Já existe um artista chamado "${novoNome}" cadastrado.`
            })
            return
        }

        console.log('Atualizando artista ID:', id, 'para:', novoNome)

        const artistaAtualizado = await window.lojaMusica.artista.editar(id, novoNome)

        await carregarArtistas()

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Artista atualizado para: "${artistaAtualizado.nome}"!`
        })
        
    } catch (erro) {
        console.error('Erro ao editar artista: ', erro)
        
        let mensagemErro = 'Erro ao editar artista.'
        
        if (erro.message.includes('não encontrado')) {
            mensagemErro = 'Artista não encontrado.'
        } else if (erro.message.includes('unique') || erro.message.includes('duplicate')) {
            mensagemErro = 'Já existe um artista com este nome.'
        }
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: mensagemErro
        })
    }
}

async function deletarArtista(id) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: 'Tem certeza que deseja excluir este artista?'
    })

    if (!confirmado) return

    try {
        console.log('Deletando artista ID: ', id)

        await window.lojaMusica.artista.deletar(id)

        await carregarArtistas()

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: 'Artista excluído com sucesso!'
        })

    } catch (erro) {
        console.error('Erro ao deletar artista: ', erro)

        if (erro.message.includes('interpretes associados')) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Não é possível excluir',
                mensagem: 'Este artista possui intérpretes associados e não pode ser excluído.'
            })
        } else if (erro.message.includes('compositores associados')) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Não é possível excluir',
                mensagem: 'Este artista possui compositores associados e não pode ser excluído.'
            })
        } else {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao deletar artista: ' + erro.message
            })
        }
    }
}

// tornar as funções globais para os botões HTML
window.editarArtista = editarArtista
window.deletarArtista = deletarArtista
window.fecharModalEdicao = fecharModalEdicao