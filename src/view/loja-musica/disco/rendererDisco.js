const formDisco = document.getElementById('form-disco')
const tbodyDiscos = document.getElementById('tbody-discos')
const selectGravadora = document.getElementById('gravadora_id')
const selectMusica = document.getElementById('musica_id')
const formMusicaDisco = document.getElementById('form-musica-disco')
const secaoMusicas = document.getElementById('secao-musicas')
const listaMusicasDisco = document.getElementById('lista-musicas-disco')
const selectInterprete = document.getElementById('interprete_id')

// variáveis para o controle do modal de edição
let discoEditandoId = null
let discoEditandoResolve = null
let discoEditandoDados = null
let discoMusicasAbertoId = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, carregando dados...')
    carregarDiscos()
    carregarGravadoras()
    carregarMusicasParaSelect()
    carregarArtistas()
    configurarModalEdicao()
});

async function carregarGravadoras() {
    try {
        const gravadoras = await window.lojaMusica.gravadora.listar()

        if (gravadoras && gravadoras.length > 0) {
            selectGravadora.innerHTML = '<option value="">Selecione uma gravadora...</option>'
            gravadoras.forEach(gravadora => {
                selectGravadora.innerHTML += `<option value="${gravadora.gravadora_id}">${gravadora.nome}</option>`
            });

            const selectEdicao = document.getElementById('edicaoGravadora')
            if (selectEdicao) {
                selectEdicao.innerHTML = '<option value="">Selecione uma gravadora...</option>'
                gravadoras.forEach(gravadora => {
                    selectEdicao.innerHTML += `<option value="${gravadora.gravadora_id}">${gravadora.nome}</option>`
                })
            }

        } else {
            selectGravadora.innerHTML = '<option value="">Nenhuma gravadora cadastrada</option>'
        }

    } catch (erro) {
        console.log('Erro ao carregar gravadoras:', erro)
        selectGravadora.innerHTML = '<option value="">Erro ao carregar gravadoras</option>'
    }
};

async function carregarMusicasParaSelect() {
    try {
        const musicas = await window.lojaMusica.musica.listar()

        if (musicas && musicas.length > 0) {
            selectMusica.innerHTML = '<option value="">Selecione uma música...</option>'
            musicas.forEach(musica => {
                selectMusica.innerHTML += `<option value="${musica.musica_id}">${musica.nome} (${musica.estilo_nome || 'Sem estilo'})</option>`
            })
        } else {
            selectMusica.innerHTML = '<option value="">Nenhuma música cadastrada</option>'
        }

    } catch (erro) {
        console.error('Erro ao carregar músicas:', erro)
        selectMusica.innerHTML = '<option value="">Erro ao carregar músicas</option>'
    }
};

async function carregarArtistas() {
    try {
        const artistas = await window.lojaMusica.artista.listar()

        if (artistas && artistas.length > 0) {
            selectInterprete.innerHTML = '<option value="">Selecione o intérprete principal...</option>'
            artistas.forEach(artista => {
                selectInterprete.innerHTML += `<option value="${artista.artista_id}">${artista.nome}</option>`
            });
        } else {
            selectInterprete.innerHTML = '<option value="">Nenhum artista cadastrado</option>'
        }

    } catch (erro) {
        console.log('Erro ao carregar artistas:', erro)
        selectInterprete.innerHTML = '<option value="">Erro ao carregar artistas</option>'
    }
}

async function carregarDiscos() {
    try {
        console.log('Carregando discos...')

        const discos = await window.lojaMusica.disco.listar()

        console.log('Discos:', discos)

        if (!discos || discos.length === 0) {
            tbodyDiscos.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                        Nenhum disco cadastrado ainda
                    </td>
                </tr>`
            return
        }

        let html = ''

        for (const disco of discos) {
            let interpretesTexto = 'Carregando...'
            try {
                const interpretes = await window.lojaMusica.disco.getInterpretes(disco.disco_id)
                
                if (interpretes && interpretes.length > 0) {
                    interpretesTexto = interpretes.map(i => i.nome).join(', ')
                } else {
                    interpretesTexto = 'Sem intérprete definido'
                }

            } catch (erro) {
                console.error('Erro ao carregar intérpretes:', erro)
                interpretesTexto = 'Erro ao carregar'
            }

            let dataFormatada = 'Data inválida'
            if (disco.data_lancamento) {
                const partes = disco.data_lancamento.split('T')[0].split('-')
                if (partes.length === 3) {
                    dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`
                } else {
                    try {
                        const data = new Date(disco.data_lancamento + 'T12:00:00')
                        dataFormatada = data.toLocaleDateString('pt-BR')
                    } catch (e) {
                        console.error('Erro ao formatar data:', e)
                    }
                }
            }

            // escapa aspas para nao quebrar HTML
            const dadosJSON = JSON.stringify(disco).replace(/'/g, "\\'").replace(/"/g, '&quot;')

            html += `
                <tr>
                    <td>${disco.disco_id}</td>
                    <td>
                        ${disco.imagem ? `<img src="${disco.imagem}" alt="Capa" style="width: 50px; height: 50px; object-fit: cover;">` : '📀'}
                    </td>
                    <td>${disco.nome}<br><small class="text-muted">Intérpretes: ${interpretesTexto}</small></td>
                    <td>${dataFormatada}</td>
                    <td>${disco.gravadora_nome || '-'}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="verMusicasDoDisco(${disco.disco_id})">
                            🎵 Músicas
                        </button>
                        <button class="btn btn-primary btn-sm" 
                                onclick='editarDisco(${disco.disco_id}, ${dadosJSON})'>
                            Editar
                        </button>
                        <button class="btn btn-danger btn-sm" 
                                onclick="deletarDisco(${disco.disco_id})">
                            Deletar
                        </button>
                    </td>
                </tr>`
        }

        tbodyDiscos.innerHTML = html

    } catch (erro) {
        console.error('Erro ao carregar discos:', erro)
        if (window.dialog && window.dialog.exibirDialogMensagem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao carregar discos: ' + erro.message
            })
        }
    }
};

function configurarModalEdicao() {
    const modal = document.getElementById('edicaoDiscoModal');
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
};

function abrirModalEdicao(id, dados) {
    return new Promise((resolve) => {
        discoEditandoId = id
        discoEditandoResolve = resolve

        document.getElementById('edicaoTitulo').textContent = 'Editar Disco'
        document.getElementById('edicaoMensagem').textContent = `Editando disco ID: ${id}`
        document.getElementById('valorAtualTexto').textContent = dados.nome || '(vazio)'
        
        let dataFormatada = '(vazio)'
        if (dados.data_lancamento) {
            const partes = dados.data_lancamento.split('T')[0].split('-')
            if (partes.length === 3) {
                dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`
            }
        }
        document.getElementById('valorAtualData').textContent = dataFormatada

        const gravadoraNome = dados.gravadora_nome || 'Não informada'
        document.getElementById('valorAtualGravadora').textContent = gravadoraNome

        document.getElementById('edicaoNome').value = dados.nome || ''
        document.getElementById('edicaoData').value = dados.data_lancamento ? dados.data_lancamento.split('T')[0] : ''
        document.getElementById('edicaoImagem').value = dados.imagem || ''

        const selectGravadora = document.getElementById('edicaoGravadora');
        if (selectGravadora) {
            selectGravadora.value = dados.gravadora_id || '';
        }
        
        document.getElementById('edicaoDiscoModal').style.display = 'flex';
        
    })
};

function fecharModalEdicao() {
    document.getElementById('edicaoDiscoModal').style.display = 'none';
    if (discoEditandoResolve) {
        discoEditandoResolve(null);
        discoEditandoResolve = null;
        discoEditandoId = null;
    }
};

function confirmarEdicao() {
    const novoNome = document.getElementById('edicaoNome').value.trim();
    const novaData = document.getElementById('edicaoData').value;
    const novaImagem = document.getElementById('edicaoImagem').value.trim() || null;
    const novaGravadoraId = document.getElementById('edicaoGravadora').value;
    
    document.getElementById('edicaoDiscoModal').style.display = 'none';
    
    if (discoEditandoResolve) {
        discoEditandoResolve({
            nome: novoNome,
            data_lancamento: novaData,
            imagem: novaImagem,
            gravadora_id: novaGravadoraId ? parseInt(novaGravadoraId) : null
        });
        discoEditandoResolve = null;
        discoEditandoId = null;
    }
};

// verificação de duplicidade com relação nome disco x id interprete
async function verificarDiscoExistente(nome, musicasSelecionadas, idIgnorar = null) {
    try {
        const interpreteId = new Set()

        for (const musicaId of musicasSelecionadas) {
            const interpretes = await window.lojaMusica.musica.buscarInterpretes(musicaId)
            interpretes.forEach(i => interpreteId.add(i.artista_id))
        }

        if (interpreteId.size === 0) {
            return null // caso não haja interprete para verificar
        }

        const interpreteIdsArray = Array.from(interpreteId) // convertendo o set para array

        // busca disco com mesmo nome e interprete
        const discoExistente = await window.lojaMusica.disco.buscarPorNomeEInterpretes(
            nome, 
            interpreteIdsArray
        )

        // se encontra um disco e não é o que o usuário está editando (idIgnorar)
        if (discoExistente && (!idIgnorar || discoExistente.disco_id !== idIgnorar)){
            return discoExistente
        }

    } catch (erro) {
        console.error('Erro ao verificar disco existente:', erro)
        throw erro     
    }   
};

if (formDisco) {
    formDisco.addEventListener('submit', async (event) => {
        event.preventDefault()

        const nome = document.getElementById('nome').value.trim()
        const data_lancamento = document.getElementById('data_lancamento').value
        const imagem = document.getElementById('imagem').value.trim() || null
        const gravadora_id = document.getElementById('gravadora_id').value
        const interprete_id = document.getElementById('interprete_id').value // NOVO

        // validações
        if(!nome) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Por favor, digite o nome do disco'
            })
            document.getElementById('nome').focus()
            return
        }

        if (!data_lancamento) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Por favor, selecione a data de lançamento'
            })
            document.getElementById('data_lancamento').focus()
            return
        }

        if (!gravadora_id) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Por favor, selecione uma gravadora'
            })
            document.getElementById('gravadora_id').focus()
            return
        }

        if (!interprete_id) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Por favor, selecione o intérprete principal'
            })
            document.getElementById('interprete_id').focus()
            return
        }

        try {
            // verifica se já existe disco com mesmo nome e intérprete
            const discoExistente = await window.lojaMusica.disco.buscarPorNomeEInterpretes(
                nome, 
                [parseInt(interprete_id)]
            )

            if(discoExistente){
                window.dialog.exibirDialogMensagem({
                    titulo: 'Disco já cadastrado',
                    mensagem: `Já existe um disco chamado "${nome}" para este intérprete.`
                })
                return
            }

            console.log('Cadastrando disco:', {
                nome,
                data_lancamento,
                imagem,
                gravadora_id: parseInt(gravadora_id),
                interprete_id: parseInt(interprete_id)
            })

            const discoCriado = await window.lojaMusica.disco.criar({
                nome,
                data_lancamento,
                imagem,
                gravadora_id: parseInt(gravadora_id),
                interprete_id: parseInt(interprete_id) // NOVO
            })

            console.log('Disco criado:', discoCriado)

            formDisco.reset()
            carregarDiscos()

            window.dialog.exibirDialogMensagem({
                titulo: 'Sucesso',
                mensagem: `Disco "${discoCriado.nome}" cadastrado com sucesso!`
            })
            
        } catch (erro) {
            console.error('Erro ao cadastrar disco:', erro)
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao cadastrar disco: ' + erro.message
            })
            
        }
    })
};

async function editarDisco(id, dados) {
    try {
        const novosDados = await abrirModalEdicao(id, dados)

        if (novosDados === null) {
            console.log('Edição cancelada pelo usuário');
            return
        }

        // validações

        if(!novosDados.nome){
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo vazio',
                mensagem: 'O nome do disco não pode ficar vazio.'
            })
            return
        }

        if (!novosDados.data_lancamento) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo vazio',
                mensagem: 'A data de lançamento não pode ficar vazia.'
            });
            return;
        }
        
        if(!novosDados.gravadora_id) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo vazio',
                mensagem: 'Selecione uma gravadora.'
            });
            return
        }

        // pega as musicas do disco para verificar seus interpretes
        const musicasDoDisco = await window.lojaMusica.disco.musicas.listar(id)
        const musicasIds = musicasDoDisco.map(m => m.musica_id)

        // verifica se já existe outro disco com mesmo nome e interpretes
        const discoExistente = await verificarDiscoExistente(
            novosDados.nome, 
            musicasIds, 
            id
        );

        if (discoExistente) {
            // busca os interpretes do disco pra mostrar na mensagem
            const interpretes = await window.lojaMusica.disco.getInterpretes(discoExistente.disco_id)
            const nomesInterpretes = interpretes.map(i => i.nome).join(', ') || 'artista desconhecido'

            window.dialog.exibirDialogMensagem({
                titulo: 'Disco já cadastrado',
                mensagem: `Já existe um disco chamado "${novosDados.nome}" para o(s) intérprete(s): ${nomesInterpretes}`
            });
            return
        }

        // verificando se houve alterações
        if (novosDados.nome === dados.nome && novosDados.data_lancamento === dados.data_lancamento &&
            novosDados.imagem === dados.imagem && novosDados.gravadora_id === dados.gravadora_id) {
            window.dialog.exibirDialogMensagem({
            titulo: 'Sem alterações',
            mensagem: 'Nenhuma alteração foi feita no disco.'
            });
            return
        }

        console.log('Atualizando disco ID:', id, novosDados)

        const discoAtualizado = await window.lojaMusica.disco.editar(id, {
            nome: novosDados.nome,
            data_lancamento: novosDados.data_lancamento,
            imagem: novosDados.imagem,
            gravadora_id: novosDados.gravadora_id
        })

        carregarDiscos()

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Disco atualizado para: "${discoAtualizado.nome}"!`
        })
        
    } catch (erro) {
        console.error('Erro ao editar disco:', erro);
        
        let mensagemErro = 'Erro ao editar disco.';
        
        if (erro.message.includes('não encontrado')) {
            mensagemErro = 'Disco não encontrado.';
        }
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: mensagemErro
        })    
    }
    
};

async function deletarDisco(id) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: 'Tem certeza que deseja deletar este disco?'
    });
    
    if (!confirmado) return;

    try {
        console.log('Deletando disco ID:', id)
        
        await window.lojaMusica.disco.deletar(id)
        
        carregarDiscos()

        // se o disco que estava sendo visualizado for deletado, esconde a seção de músicas
        if (discoMusicasAbertoId === id || discoEditandoId === id) {
            secaoMusicas.style.display = 'none';
            discoMusicasAbertoId = null;
            discoEditandoId = null;
        }
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: 'Disco deletado com sucesso!'
        })
        
    } catch (erro) {
        console.error('Erro ao deletar disco:', erro);
        
        if (erro.message.includes('músicas associadas')) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Não é possível deletar',
                mensagem: 'Existem músicas associadas a este disco. Remova as músicas primeiro.'
            });
        } else {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao deletar disco: ' + erro.message
            });
        }
        
    }
    
};

// === Funções para músicas do disco === //

async function verMusicasDoDisco(discoId) {
    try {
        // se clicou no mesmo disco que já está aberto, fecha a seção
        if (discoMusicasAbertoId === discoId) {
            secaoMusicas.style.display = 'none';
            discoMusicasAbertoId = null;
            discoEditandoId = null;
            return;
        }
        
        // se é um disco diferente, abre e carrega as músicas
        secaoMusicas.style.display = 'block'
        discoMusicasAbertoId = discoId
        discoEditandoId = discoId

        const disco = await window.lojaMusica.disco.buscar(discoId)
        document.querySelector('#secao-musicas h2').innerHTML = `🎵 Músicas do Disco: ${disco.nome}`

        await carregarMusicasDoDisco(discoId)
        
    } catch (erro) {
        console.error('Erro ao carregar músicas do disco:', erro)
    }
};

if (formMusicaDisco) {
    formMusicaDisco.addEventListener('submit', async (event) => {
        event.preventDefault()

        const musicaId = document.getElementById('musica_id').value
        const ordem = document.getElementById('ordem_musica').value

        if (!musicaId) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Selecione uma música para adicionar'
            })
            return
        }
        
        if (!ordem) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Campo obrigatório',
                mensagem: 'Informe a ordem da música no disco'
            })
            return
        }
        
        if (!discoEditandoId) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Nenhum disco selecionado'
            })
            return
        }

        try {
            // verifica se já existe música nesta ordem
            const musicasExistentes = await window.lojaMusica.disco.musicas.listar(discoEditandoId)
            const ordemExistente = musicasExistentes.find(m => m.ordem === parseInt(ordem))
            
            if (ordemExistente) {
                window.dialog.exibirDialogMensagem({
                    titulo: 'Ordem ocupada',
                    mensagem: `Já existe uma música na ordem ${ordem}. Remova ou altere a ordem.`
                })
                return
            }

            // verifica se a música já esta no disco
            const existe = await window.lojaMusica.disco.musicas.verificar(discoEditandoId, parseInt(musicaId))

            if (existe) {
                window.dialog.exibirDialogMensagem({
                    titulo: 'Música já adicionada',
                    mensagem: 'Esta música já está neste disco'
                })
                return
            }

            await window.lojaMusica.disco.musicas.adicionar(
                discoEditandoId, 
                parseInt(musicaId),
                parseInt(ordem)
            )
            
            await carregarMusicasDoDisco(discoEditandoId)

            // limpar campos
            document.getElementById('musica_id').value = ''
            document.getElementById('ordem_musica').value = ''

            window.dialog.exibirDialogMensagem({
                titulo: 'Sucesso',
                mensagem: 'Música adicionada ao disco com sucesso!'
            })
            
        } catch (erro) {
            console.error('Erro ao adicionar música:', erro)
            window.dialog.exibirDialogMensagem({
                titulo: 'Erro',
                mensagem: 'Erro ao adicionar música: ' + erro.message
            })
            
        }
    })
};

async function carregarMusicasDoDisco(discoId) {
    try {
        const musicas = await window.lojaMusica.disco.musicas.listar(discoId)

        if (!musicas || musicas.length === 0) {
            listaMusicasDisco.innerHTML = '<p class="text-muted">Nenhuma música adicionada a este disco ainda.</p>'
            return
        }

        // coloca as musicas do disco em ordem
        musicas.sort((a, b) => (a.ordem || 999) - (b.ordem || 999))

        let html = '<ul class="list-group">'
        musicas.forEach(musica => {
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <span class="badge bg-secondary me-2">${musica.ordem || '?'}</span>
                        ${musica.nome} - ${musica.duracao} <!-- Removido o estilo entre parênteses -->
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="removerMusicaDoDisco(${discoId}, ${musica.musica_id})">
                        Remover
                    </button>
                </li>
            `
        })
        html += '</ul>'
        
        listaMusicasDisco.innerHTML = html
        
    } catch (erro) {
        console.error('Erro ao carregar músicas do disco:', erro)
        listaMusicasDisco.innerHTML = '<p class="text-danger">Erro ao carregar músicas.</p>'   
    }
};

async function removerMusicaDoDisco(discoId, musicaId) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar remoção',
        mensagem: 'Tem certeza que deseja remover esta música do disco?'
    })

    if (!confirmado) return

    try {
        await window.lojaMusica.disco.musicas.remover(discoId, musicaId)

        await carregarMusicasDoDisco(discoId)

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: 'Música removida do disco com sucesso!'
        })
        
    } catch (erro) {
        console.error('Erro ao remover música:', erro)
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao remover música: ' + erro.message
        })   
    }
};

// tornar funções globais para os botões HTML
window.editarDisco = editarDisco;
window.deletarDisco = deletarDisco;
window.verMusicasDoDisco = verMusicasDoDisco;
window.removerMusicaDoDisco = removerMusicaDoDisco;
window.fecharModalEdicao = fecharModalEdicao;