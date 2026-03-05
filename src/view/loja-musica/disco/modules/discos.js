import { elements, setDiscoEditandoId, setDiscoEditandoResolve, setDiscoEditandoDados, discoMusicasAbertoId } from './core.js';
import { carregarGravadorasNoSelectEdicao, carregarInterpretesNoSelectEdicao } from './selects.js';
import { formatarData, escaparAspas } from './utils.js';
import { abrirModalEdicao, fecharModalEdicao } from './modal.js';

export async function carregarDiscos() {
    try {
        console.log('Carregando discos...');
        const discos = await window.lojaMusica.disco.listar();

        if (!discos || discos.length === 0) {
            elements.tbodyDiscos.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                        Nenhum disco cadastrado ainda
                    </td>
                </tr>`;
            return;
        }

        let html = '';
        for (const disco of discos) {
            const dataFormatada = formatarData(disco.data_lancamento);
            
            const interpretesInfo = await buscarInterpretesDisco(disco);
            
            // escapar aspas para não quebrar HTML
            const dadosJSON = escaparAspas(JSON.stringify(disco));

            html += montarLinhaTabela(disco, dataFormatada, interpretesInfo, dadosJSON);
        }

        elements.tbodyDiscos.innerHTML = html;
    } catch (erro) {
        console.error('Erro ao carregar discos:', erro);
        elements.tbodyDiscos.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: red;">
                    Erro ao carregar discos: ${erro.message}
                </td>
            </tr>`;
    }
}

async function buscarInterpretesDisco(disco) {
    let interpretesTexto = 'Nenhuma música com intérprete';
    let interpretePrincipalTexto = '';

    try {
        if (disco.interprete_principal_nome) {
            interpretePrincipalTexto = `<strong class="text-primary">${disco.interprete_principal_nome}</strong>`;
        }
        
        const interpretes = await window.lojaMusica.disco.getInterpretes(disco.disco_id);
        
        if (interpretes && interpretes.length > 0) {
            const outrosInterpretes = disco.interprete_principal_id 
                ? interpretes.filter(i => i.artista_id !== disco.interprete_principal_id)
                : interpretes;
            
            if (outrosInterpretes.length > 0) {
                interpretesTexto = outrosInterpretes.map(i => i.nome).join(', ');
            } else {
                interpretesTexto = 'Apenas o artista principal';
            }
        }
    } catch (erro) {
        console.error('Erro ao carregar intérpretes:', erro);
        interpretesTexto = 'Erro ao carregar';
    }

    return { interpretePrincipalTexto, interpretesTexto };
}

function montarLinhaTabela(disco, dataFormatada, interpretesInfo, dadosJSON) {
    return `
        <tr>
            <td>${disco.disco_id}</td>
            <td>
                ${disco.imagem 
                    ? `<img src="${disco.imagem}" alt="Capa" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` 
                    : '<span style="font-size: 2rem;">📀</span>'}
            </td>
            <td>
                <strong>${disco.nome}</strong>
                ${interpretesInfo.interpretePrincipalTexto 
                    ? `<br><small>🎤 Artista principal: ${interpretesInfo.interpretePrincipalTexto}</small>` 
                    : ''}
                
                ${interpretesInfo.interpretesTexto === 'Apenas o artista principal' 
                    ? '<br><small>🎸 Apenas o artista principal</small>'
                    : interpretesInfo.interpretesTexto !== 'Nenhuma música com intérprete' && interpretesInfo.interpretesTexto !== 'Erro ao carregar'
                        ? `<br><small>🎸 Participações: ${interpretesInfo.interpretesTexto}</small>`
                        : `<br><small>🎸 ${interpretesInfo.interpretesTexto}</small>`}
            </td>
            <td>${dataFormatada}</td>
            <td>${disco.gravadora_nome || '-'}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-info btn-sm" 
                            onclick="verDetalhesDisco(${disco.disco_id})" 
                            title="Ver detalhes">
                        🔍 Detalhes
                    </button>
                    <button class="btn btn-primary btn-sm" 
                            onclick='editarDisco(${disco.disco_id}, ${dadosJSON})'
                            title="Editar">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-danger btn-sm" 
                            onclick="deletarDisco(${disco.disco_id})"
                            title="Excluir">
                        🗑️ Deletar
                    </button>
                </div>
            </td>
        </tr>`;
}

export async function carregarDiscoParaEdicao(id) {
    try {
        const disco = await window.lojaMusica.disco.buscar(id);
        if (disco) {
            const interpretePrincipal = await window.lojaMusica.disco.getInterpretePrincipal(id);
            disco.interprete_principal_nome = interpretePrincipal ? interpretePrincipal.nome : null;
            disco.interprete_principal_id = interpretePrincipal ? interpretePrincipal.artista_id : null;
            
            await editarDisco(disco.disco_id, disco);
        }
    } catch (erro) {
        console.error('Erro ao carregar disco para edição:', erro);
    }
}

export async function editarDisco(id, dados) {
    try {
        const novosDados = await abrirModalEdicao(id, dados);

        if (novosDados === null) {
            console.log('Edição cancelada pelo usuário');
            return;
        }

        // validações
        if (!validarDadosEdicao(novosDados)) return;

        const duplicado = await verificarDiscoDuplicado(id, novosDados);
        if (duplicado) return;

        if (!verificarAlteracoes(dados, novosDados)) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Sem alterações',
                mensagem: 'Nenhuma alteração foi feita no disco.'
            });
            return;
        }

        console.log('Atualizando disco ID:', id, novosDados);
        const discoAtualizado = await window.lojaMusica.disco.editar(id, {
            nome: novosDados.nome,
            data_lancamento: novosDados.data_lancamento,
            imagem: novosDados.imagem,
            gravadora_id: novosDados.gravadora_id,
            interprete_id: novosDados.interprete_id
        });

        await carregarDiscos();

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Disco atualizado para: "${discoAtualizado.nome}"!`
        });
    } catch (erro) {
        console.error('Erro ao editar disco:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: erro.message.includes('não encontrado') ? 'Disco não encontrado.' : 'Erro ao editar disco.'
        });
    }
}

function validarDadosEdicao(dados) {
    if (!dados.nome) {
        window.dialog.exibirDialogMensagem({
            titulo: 'Campo vazio',
            mensagem: 'O nome do disco não pode ficar vazio.'
        });
        return false;
    }
    if (!dados.data_lancamento) {
        window.dialog.exibirDialogMensagem({
            titulo: 'Campo vazio',
            mensagem: 'A data de lançamento não pode ficar vazia.'
        });
        return false;
    }
    if (!dados.gravadora_id) {
        window.dialog.exibirDialogMensagem({
            titulo: 'Campo vazio',
            mensagem: 'Selecione uma gravadora.'
        });
        return false;
    }
    if (!dados.interprete_id) {
        window.dialog.exibirDialogMensagem({
            titulo: 'Campo vazio',
            mensagem: 'Selecione o intérprete principal.'
        });
        return false;
    }
    return true;
}

async function verificarDiscoDuplicado(id, novosDados) {
    const musicasDoDisco = await window.lojaMusica.disco.musicas.listar(id);
    const musicasIds = musicasDoDisco.map(m => m.musica_id);
    
    const discoExistente = await verificarDiscoExistente(
        novosDados.nome, 
        musicasIds, 
        id
    );

    if (discoExistente) {
        const interpretes = await window.lojaMusica.disco.getInterpretes(discoExistente.disco_id);
        const nomesInterpretes = interpretes.map(i => i.nome).join(', ') || 'artista desconhecido';

        window.dialog.exibirDialogMensagem({
            titulo: 'Disco já cadastrado',
            mensagem: `Já existe um disco chamado "${novosDados.nome}" para o(s) intérprete(s): ${nomesInterpretes}`
        });
        return true;
    }
    return false;
}

function verificarAlteracoes(dadosAntigos, novosDados) {
    return !(novosDados.nome === dadosAntigos.nome && 
             novosDados.data_lancamento === dadosAntigos.data_lancamento &&
             novosDados.imagem === dadosAntigos.imagem && 
             novosDados.gravadora_id === dadosAntigos.gravadora_id &&
             novosDados.interprete_id === dadosAntigos.interprete_principal_id);
}

async function verificarDiscoExistente(nome, musicasSelecionadas, idIgnorar = null) {
    try {
        const interpreteId = new Set();
        for (const musicaId of musicasSelecionadas) {
            const interpretes = await window.lojaMusica.musica.buscarInterpretes(musicaId);
            interpretes.forEach(i => interpreteId.add(i.artista_id));
        }

        if (interpreteId.size === 0) return null;

        const discoExistente = await window.lojaMusica.disco.buscarPorNomeEInterpretes(
            nome, 
            Array.from(interpreteId)
        );

        if (discoExistente && (!idIgnorar || discoExistente.disco_id !== idIgnorar)) {
            return discoExistente;
        }
        return null;
    } catch (erro) {
        console.error('Erro ao verificar disco existente:', erro);
        throw erro;
    }
}

export async function deletarDisco(id) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: 'Tem certeza que deseja deletar este disco?'
    });
    
    if (!confirmado) return;

    try {
        console.log('Deletando disco ID:', id);
        await window.lojaMusica.disco.deletar(id);
        await carregarDiscos();

        // fecha a seção de músicas se estiver aberta
        const secaoMusicas = document.getElementById('secao-musicas');
        if (secaoMusicas && (discoMusicasAbertoId === id)) {
            secaoMusicas.style.display = 'none';
        }

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: 'Disco deletado com sucesso!'
        });
    } catch (erro) {
        console.error('Erro ao deletar disco:', erro);
        
        let mensagem = erro.message;
        if (erro.message.includes('músicas associadas')) {
            mensagem = 'Existem músicas associadas a este disco. Remova as músicas primeiro.';
        }
        
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: mensagem
        });
    }
}

export function configurarFormularioDisco() {
    if (elements.formDisco) {
        elements.formDisco.addEventListener('submit', async (event) => {
            event.preventDefault();
            await criarDisco();
        });
    }
}

async function criarDisco() {
    const nome = document.getElementById('nome').value.trim();
    const data_lancamento = document.getElementById('data_lancamento').value;
    const imagem = document.getElementById('imagem').value.trim() || null;
    const gravadora_id = document.getElementById('gravadora_id').value;
    const interprete_id = document.getElementById('interprete_id').value;

    if (!validarCamposCriacao(nome, data_lancamento, gravadora_id, interprete_id)) return;

    try {
        const discoExistente = await window.lojaMusica.disco.buscarPorNomeEInterpretes(
            nome, 
            [parseInt(interprete_id)]
        );

        if (discoExistente) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Disco já cadastrado',
                mensagem: `Já existe um disco chamado "${nome}" para este intérprete.`
            });
            return;
        }

        const discoCriado = await window.lojaMusica.disco.criar({
            nome,
            data_lancamento,
            imagem,
            gravadora_id: parseInt(gravadora_id),
            interprete_id: parseInt(interprete_id)
        });

        elements.formDisco.reset();
        await carregarDiscos();

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Disco "${discoCriado.nome}" cadastrado com sucesso!`
        });
    } catch (erro) {
        console.error('Erro ao cadastrar disco:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao cadastrar disco: ' + erro.message
        });
    }
}

function validarCamposCriacao(nome, data, gravadora, interprete) {
    if (!nome) {
        window.dialog.exibirDialogMensagem({ titulo: 'Campo obrigatório', mensagem: 'Digite o nome do disco' });
        document.getElementById('nome').focus();
        return false;
    }
    if (!data) {
        window.dialog.exibirDialogMensagem({ titulo: 'Campo obrigatório', mensagem: 'Selecione a data de lançamento' });
        document.getElementById('data_lancamento').focus();
        return false;
    }
    if (!gravadora) {
        window.dialog.exibirDialogMensagem({ titulo: 'Campo obrigatório', mensagem: 'Selecione uma gravadora' });
        document.getElementById('gravadora_id').focus();
        return false;
    }
    if (!interprete) {
        window.dialog.exibirDialogMensagem({ titulo: 'Campo obrigatório', mensagem: 'Selecione o intérprete principal' });
        document.getElementById('interprete_id').focus();
        return false;
    }
    return true;
}