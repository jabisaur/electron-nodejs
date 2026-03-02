const formMusica = document.getElementById('form-musica')
const tbodyMusica = document.getElementById('tbody-musicas')
const selectEstilo = document.getElementById('estilo_id')
const selectInterpretes = document.getElementById('interpretes')
const selectCompositores = document.getElementById('compositores')

// variáveis para controle do modal de edição
let musicaEditandoId = null;
let musicaEditandoResolve = null;
let musicaEditandoDados = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, carregando dados...')
    carregarMusicas()
    carregarEstilos()
    carregarArtistas()
    configurarModalEdicao()
});

async function carregarEstilos() {
    try {
        const estilos = await window.lojaMusica.estilo.listar()

        if (estilos && estilos.length > 0) {
            selectEstilo.innerHTML = '<option value="">Selecione um estilo...</option>'

            estilos.forEach(estilo => {
                selectEstilo.innerHTML += `<option value="${estilo.estilo_id}">${estilo.descricao}</option>`
            });
        } else {
            selectEstilo.innerHTML = '<option value="">Nenhum estilo cadastrado</option>'
        }
        
    } catch (erro) {
        console.error('Erro ao carregar estilos: ', erro)
        selectEstilo.innerHTML = '<option value="">Erro ao carregar estilos</option>'       
    }
};

async function carregarArtistas() {
    try {
        const artistas = await window.lojaMusica.artista.listar()

        if (artistas && artistas.length > 0) {

            selectInterpretes.innerHTML = '<option value="">Selecione os intérpretes...</option>'
            selectCompositores.innerHTML = '<option value="">Selecione os compositores...</option>'
            
            artistas.forEach(artista => {
                selectInterpretes.innerHTML += `<option value="${artista.artista_id}">${artista.nome}</option>`
                selectCompositores.innerHTML += `<option value="${artista.artista_id}">${artista.nome}</option>`
            });
        } else {
            selectInterpretes.innerHTML = '<option value="">Nenhum artista cadastrado</option>'
            selectCompositores.innerHTML = '<option value="">Nenhum artista cadastrado</option>'
        }

    } catch (erro) {
        console.error('Erro ao carregar artistas:', erro)
    }
};

async function carregarMusicas() {
    try {
        console.log('Carregando músicas...')

        const musicas = await window.lojaMusica.musica.listar()

        console.log('Músicas: ', musicas)

        if(!musicas || musicas.length === 0){
            tbodyMusica.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                        Nenhuma música cadastrada ainda
                    </td>
                </tr>
            `;
            return
        }

        let html = ''
        
        musicas.forEach(musica => {
            let dataFormatada = 'Data inválida'
            if (musica.data_lancamento) {
                const partes = musica.data_lancamento.split('T')[0].split('-')
                if (partes.length === 3) {
                    dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`
                } else {
                    // fallback para o formato padrão
                    try {
                        const data = new Date(musica.data_lancamento + 'T12:00:00')
                        dataFormatada = data.toLocaleDateString('pt-BR')
                    } catch (e) {
                        console.error('Erro ao formatar data:', e)
                    }
                }
            }

            // escapar aspas pra não quebrar html
            const nomeEscapado = musica.nome.replace(/'/g, "\\'").replace(/"/g, '&quot;')
            const duracaoEscapada = musica.duracao.replace(/'/g, "\\'").replace(/"/g, '&quot;')

            html += `
                <tr>
                    <td>${musica.musica_id}</td>
                    <td>${musica.nome}</td>
                    <td>${musica.duracao}</td>
                    <td>${dataFormatada}</td>
                    <td>${musica.estilo_nome || 'N/A'}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" 
                                onclick='editarMusica(${musica.musica_id}, "${nomeEscapado}", 
                                "${duracaoEscapada}", "${musica.data_lancamento}", ${musica.estilo_id})'>
                            Editar
                        </button>
                        <button class="btn btn-danger btn-sm" 
                                onclick="deletarMusica(${musica.musica_id})">
                            Deletar
                        </button>
                    </td>
                </tr>
            `
        })

        tbodyMusica.innerHTML = html;

    } catch (erro) {
        console.error('Erro ao carregar músicas: ', erro)
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao carregar músicas: ' + erro.message
        })        
    }
};

if (formMusica) {
    formMusica.addEventListener('submit', async (event) => {
        event.preventDefault()

        const nome = document.getElementById('nome').value.trim()
        const duracao = document.getElementById('duracao').value.trim()
        const data_lancamento = document.getElementById('data_lancamento').value
        const estilo_id = document.getElementById('estilo_id').value
        
        // Pegar valores selecionados (múltiplos)
        const interpretesSelecionados = Array.from(selectInterpretes.selectedOptions).map(opt => opt.value)
        const compositoresSelecionados = Array.from(selectCompositores.selectedOptions).map(opt => opt.value)

        // validações
        if(!nome) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Por favor, digite o nome da música'
            });
            document.getElementById('nome').focus()
            return
        }
        if(!duracao){
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Por favor, digite a duração da música'
            });
            document.getElementById('duracao').focus()
            return
        }
        if(!data_lancamento) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Por favor, selecione a data de lançamento'
            });
            document.getElementById('data_lancamento').focus()
            return
        }
        if(!estilo_id) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Por favor, selecione um estilo'
            });
            document.getElementById('estilo_id').focus()
            return
        }
        if(interpretesSelecionados.length === 0) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Por favor, selecione pelo menos um intérprete'
            });
            selectInterpretes.focus()
            return
        }

        try {
            console.log('Cadastrando música: ', {
                nome, 
                duracao, 
                data_lancamento, 
                estilo_id,
                interpretes: interpretesSelecionados,
                compositores: compositoresSelecionados
            })

            const musicaCriada = await window.lojaMusica.musica.criar({
                nome,
                duracao,
                data_lancamento,
                estilo_id: parseInt(estilo_id),
                interpretes: interpretesSelecionados.map(id => parseInt(id)),
                compositores: compositoresSelecionados.map(id => parseInt(id))
            })

            console.log('Música criada: ', musicaCriada)

            formMusica.reset()
            await carregarMusicas()

            window.dialog.exibirDialogMensagem({
                titulo: 'Sucesso',
                mensagem: `Música "${musicaCriada.nome}" cadastrada com sucesso!`
            })
            
        } catch (erro) {
            console.error('Erro ao cadastrar música: ', erro)
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao cadastrar música: ' + erro.message
            })  
        }
    })
};

function configurarModalEdicao() {
    const modal = document.getElementById('edicaoMusicaModal')
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

function criarCamposEdicao(dados) {
    const modalBody = document.querySelector('#edicaoMusicaModal .modal-body')
    
    // limpa o conteúdo atual, mantendo apenas o título
    modalBody.innerHTML = `
        <p id="edicaoMensagem"></p>
        <div id="camposEdicao"></div>
    `
    
    const camposContainer = document.getElementById('camposEdicao')
    
    // compos do formulário de edição
    camposContainer.innerHTML = `
        <div class="form-group mb-3">
            <label for="edicaoNome" class="form-label">Nome da Música:</label>
            <input type="text" id="edicaoNome" class="form-control" value="${dados.nome || ''}" placeholder="Digite o nome da música...">
        </div>
        
        <div class="form-group mb-3">
            <label for="edicaoDuracao" class="form-label">Duração (MM:SS):</label>
            <input type="text" id="edicaoDuracao" class="form-control" value="${dados.duracao || ''}" placeholder="Ex: 3:45">
        </div>
        
        <div class="form-group mb-3">
            <label for="edicaoData" class="form-label">Data de Lançamento:</label>
            <input type="date" id="edicaoData" class="form-control" value="${dados.data_lancamento || ''}">
        </div>
        
        <div class="form-group mb-3">
            <label for="edicaoEstilo" class="form-label">Estilo:</label>
            <select id="edicaoEstilo" class="form-control">
                <option value="">Selecione um estilo...</option>
            </select>
        </div>
    `
    
    // carregando estilos no select de edição
    carregarEstilosNoSelect('edicaoEstilo', dados.estilo_id)
}

async function carregarEstilosNoSelect(selectId, estiloSelecionadoId) {
    try {
        const estilos = await window.lojaMusica.estilo.listar()
        const select = document.getElementById(selectId)
        
        if (select) {
            select.innerHTML = '<option value="">Selecione um estilo...</option>'
            
            estilos.forEach(estilo => {
                const selected = estilo.estilo_id === estiloSelecionadoId ? 'selected' : ''
                select.innerHTML += `<option value="${estilo.estilo_id}" ${selected}>${estilo.descricao}</option>`
            })
        }
    } catch (erro) {
        console.error('Erro ao carregar estilos:', erro)
    }
}

function abrirModalEdicao(id, dados) {
    return new Promise((resolve) => {
        musicaEditandoId = id
        musicaEditandoResolve = resolve
        musicaEditandoDados = dados
        
        document.getElementById('edicaoTitulo').textContent = 'Editar Música'
        document.getElementById('edicaoMensagem').textContent = `Editando música ID: ${id}`
        
        criarCamposEdicao(dados)
        
        document.getElementById('edicaoMusicaModal').style.display = 'flex'
        
    })
}

function fecharModalEdicao() {
    document.getElementById('edicaoMusicaModal').style.display = 'none'
    if (musicaEditandoResolve) {
        musicaEditandoResolve(null)
        musicaEditandoResolve = null
        musicaEditandoId = null
        musicaEditandoDados = null
    }
}

function confirmarEdicao() {
    const novoNome = document.getElementById('edicaoNome')?.value.trim()
    const novaDuracao = document.getElementById('edicaoDuracao')?.value.trim()
    const novaData = document.getElementById('edicaoData')?.value
    const novoEstiloId = document.getElementById('edicaoEstilo')?.value
    
    document.getElementById('edicaoMusicaModal').style.display = 'none'
    
    if (musicaEditandoResolve) {
        musicaEditandoResolve({
            nome: novoNome,
            duracao: novaDuracao,
            data_lancamento: novaData,
            estilo_id: novoEstiloId ? parseInt(novoEstiloId) : null
        })
        musicaEditandoResolve = null
        musicaEditandoId = null
        musicaEditandoDados = null
    }
}

async function editarMusica(id, nomeAtual, duracaoAtual, dataAtual, estiloIdAtual) {
    try {
        const novosDados = await abrirModalEdicao(id, {
            nome: nomeAtual,
            duracao: duracaoAtual,
            data_lancamento: dataAtual,
            estilo_id: estiloIdAtual
        })
        
        if (novosDados === null) {
            console.log('Edição cancelada pelo usuário')
            return
        }
        
        // validações
        if (!novosDados.nome) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo vazio',
                mensagem: 'O nome da música não pode ficar vazio.'
            })
            return
        }
        
        if (!novosDados.duracao) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo vazio',
                mensagem: 'A duração não pode ficar vazia.'
            })
            return
        }
        
        if (!novosDados.data_lancamento) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo vazio',
                mensagem: 'A data de lançamento não pode ficar vazia.'
            })
            return
        }
        
        if (!novosDados.estilo_id) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo vazio',
                mensagem: 'Selecione um estilo para a música.'
            })
            return
        }
        
        // verifica se houve alterações
        if (novosDados.nome === nomeAtual && 
            novosDados.duracao === duracaoAtual && 
            novosDados.data_lancamento === dataAtual && 
            novosDados.estilo_id === estiloIdAtual) {
            
            window.dialog.exibirDialogMensagem({
                titulo: 'Sem alterações',
                mensagem: 'Nenhuma alteração foi feita na música.'
            })
            return
        }

        console.log('Atualizando música ID', id, novosDados)

        const musicaAtualizada = await window.lojaMusica.musica.editar(id, novosDados)

        await carregarMusicas()
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Música atualizada para: "${musicaAtualizada.nome}"!`
        })
        
    } catch (erro) {
        console.error('Erro ao editar música: ', erro)
        
        let mensagemErro = 'Erro ao editar música.'
        
        if (erro.message.includes('não encontrada')) {
            mensagemErro = 'Música não encontrada.'
        }
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: mensagemErro
        })
    }
};

async function deletarMusica(id) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: 'Tem certeza que deseja deletar esta música?'
    });

    if (!confirmado) return;

    try {
        console.log('Deletando música ID:', id)
        
        await window.lojaMusica.musica.deletar(id)
        
        await carregarMusicas()
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: 'Música deletada com sucesso!'
        })
        
    } catch (erro) {
        console.error('Erro ao deletar música: ', erro)

        if (erro.message.includes('intérpretes, compositores ou discos associados')) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Não é possível deletar',
                mensagem: 'Existem intérpretes, compositores ou discos associados a esta música.'
            })
        } else {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao deletar música: ' + erro.message
            })
        }
    }
};

// tornar funções globais para os botões HTML
window.carregarMusicas = carregarMusicas;
window.editarMusica = editarMusica;
window.deletarMusica = deletarMusica;
window.fecharModalEdicao = fecharModalEdicao;