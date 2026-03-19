import { elements, setDiscoEditandoId, setDiscoEditandoDados, discoMusicasAbertoId } from './core.js';
import { carregarGravadorasNoSelectEdicao, carregarInterpretesNoSelectEdicao } from './selects.js';
import { formatarData, escaparAspas } from './utils.js';
import { abrirModalEdicao, fecharModalEdicao } from './modal.js';

let discosDaPagina = [];
let paginaAtual = 1;
const itensPorPagina = 10;
let totalDiscosNoBanco = 0;

let filtroNomeInput, filtroGravadoraSelect, filtroAnoSelect, loadingOverlay;
let totalDiscosSpan, paginacaoInfoSpan, resumoResultadosSpan;
let btnAnterior, btnProxima;

export async function carregarDiscos() {
    inicializarElementosDOM();
    mostrarLoading(true);
    
    try {
        console.log('Carregando discos...');
        
        const filtros = {
            nome: filtroNomeInput ? filtroNomeInput.value.trim() : '',
            gravadora_id: filtroGravadoraSelect ? filtroGravadoraSelect.value : '',
            ano: filtroAnoSelect ? filtroAnoSelect.value : ''
        };

        discosDaPagina = await window.lojaMusica.disco.listar(paginaAtual, itensPorPagina, filtros);

        totalDiscosNoBanco = await window.lojaMusica.disco.contarTotal(filtros);

        for (let disco of discosDaPagina) {
            const interpretes = await window.lojaMusica.disco.getInterpretes(disco.disco_id);
            disco.interpretes = interpretes || [];
            
            const interpretePrincipal = await window.lojaMusica.disco.getInterpretePrincipal(disco.disco_id);
            disco.interprete_principal_nome = interpretePrincipal ? interpretePrincipal.nome : null;
            disco.interprete_principal_id = interpretePrincipal ? interpretePrincipal.artista_id : null;
        }
        
        if (filtroGravadoraSelect && filtroGravadoraSelect.options.length <= 1) preencherFiltroGravadoras();
        if (filtroAnoSelect && filtroAnoSelect.options.length <= 1) preencherFiltroAnos();
        
        atualizarTabela();

    } catch (erro) {
        console.error('Erro ao carregar discos:', erro);
        if (elements.tbodyDiscos) {
            elements.tbodyDiscos.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: red;">
                        Erro ao carregar discos: ${erro.message}
                    </td>
                </tr>`;
        }
        window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: 'Erro ao carregar discos: ' + erro.message });
    } finally {
        mostrarLoading(false);
    }
}

function inicializarElementosDOM() {
    if (!filtroNomeInput) {
        filtroNomeInput = document.getElementById('filtroNome');
        filtroGravadoraSelect = document.getElementById('filtroGravadora');
        filtroAnoSelect = document.getElementById('filtroAno');
        loadingOverlay = document.getElementById('loadingOverlay');
        totalDiscosSpan = document.getElementById('totalDiscosCount');
        paginacaoInfoSpan = document.getElementById('paginacaoInfo');
        resumoResultadosSpan = document.getElementById('resumoResultados');
        btnAnterior = document.getElementById('btnAnterior');
        btnProxima = document.getElementById('btnProxima');
    }
}

async function preencherFiltroGravadoras() {
    try {
        const gravadoras = await window.lojaMusica.gravadora.listar();
        if (filtroGravadoraSelect) {
            filtroGravadoraSelect.innerHTML = '<option value="">Todas as gravadoras</option>';
            gravadoras.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(gravadora => {
                filtroGravadoraSelect.innerHTML += `<option value="${gravadora.gravadora_id}">${gravadora.nome}</option>`;
            });
        }
    } catch (erro) {
        console.error('Erro ao carregar gravadoras para filtro:', erro);
    }
}

async function preencherFiltroAnos() {
    try {
        if (!filtroAnoSelect) return;
        const anos = await window.lojaMusica.disco.listarAnos();
        filtroAnoSelect.innerHTML = '<option value="">Todos os anos</option>';
        anos.forEach(ano => {
            if (ano) filtroAnoSelect.innerHTML += `<option value="${ano}">${ano}</option>`;
        });
    } catch (erro) {
        console.error('Erro ao carregar anos para filtro:', erro);
    }
}

export function aplicarFiltros() {
    paginaAtual = 1;
    carregarDiscos();
}

export function limparFiltros() {
    if (filtroNomeInput) filtroNomeInput.value = '';
    if (filtroGravadoraSelect) filtroGravadoraSelect.value = '';
    if (filtroAnoSelect) filtroAnoSelect.value = '';
    aplicarFiltros();
}

export function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        carregarDiscos();
    }
}

export function proximaPagina() {
    const totalPaginas = Math.ceil(totalDiscosNoBanco / itensPorPagina);
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        carregarDiscos();
    }
}

function atualizarTabela() {
    const totalPaginas = Math.ceil(totalDiscosNoBanco / itensPorPagina);
    const inicioDisplay = (paginaAtual - 1) * itensPorPagina + 1;
    const fimDisplay = Math.min(paginaAtual * itensPorPagina, totalDiscosNoBanco);

    if (totalDiscosSpan) totalDiscosSpan.textContent = `${totalDiscosNoBanco} disco(s)`;
    if (paginacaoInfoSpan) paginacaoInfoSpan.textContent = `Página ${paginaAtual} de ${totalPaginas || 1}`;
    
    if (resumoResultadosSpan) {
        resumoResultadosSpan.textContent = totalDiscosNoBanco === 0 
            ? `Mostrando 0 de 0 discos` 
            : `Mostrando ${inicioDisplay}-${fimDisplay} de ${totalDiscosNoBanco} discos`;
    }
    
    if (btnAnterior) btnAnterior.disabled = paginaAtual <= 1;
    if (btnProxima) btnProxima.disabled = paginaAtual >= totalPaginas;
    
    if (discosDaPagina.length === 0) {
        elements.tbodyDiscos.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                    Nenhum disco encontrado
                </td>
            </tr>`;
        return;
    }
    
    let html = '';
    discosDaPagina.forEach(disco => {
        const dataFormatada = formatarData(disco.data_lancamento);
        const interpretesInfo = buscarInterpretesInfo(disco);
        const dadosJSON = escaparAspas(JSON.stringify(disco));
        
        html += montarLinhaTabela(disco, dataFormatada, interpretesInfo, dadosJSON);
    });
    
    elements.tbodyDiscos.innerHTML = html;
}

function buscarInterpretesInfo(disco) {
    let interpretesTexto = 'Nenhuma música com intérprete';
    let interpretePrincipalTexto = '';
    
    try {
        if (disco.interprete_principal_nome) {
            interpretePrincipalTexto = `<strong class="text-primary">${disco.interprete_principal_nome}</strong>`;
        }
        
        if (disco.interpretes && disco.interpretes.length > 0) {
            const outrosInterpretes = disco.interprete_principal_id 
                ? disco.interpretes.filter(i => i.artista_id !== disco.interprete_principal_id)
                : disco.interpretes;
            
            if (outrosInterpretes.length > 0) {
                interpretesTexto = outrosInterpretes.map(i => i.nome).join(', ');
            } else {
                interpretesTexto = 'Apenas o artista principal';
            }
        }
    } catch (erro) {
        console.error('Erro ao processar intérpretes:', erro);
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
                    ? `<img src="${disco.imagem}" alt="Capa" class="capa-mini" style="max-width:50px; border-radius:4px;">` 
                    : '<i class="bi bi-disc fs-2 text-secondary"></i>'}
            </td>
            <td>
                <strong>${disco.nome}</strong>
                ${interpretesInfo.interpretePrincipalTexto 
                    ? `<br><small class="artista-info"><i class="bi bi-mic"></i> Principal: ${interpretesInfo.interpretePrincipalTexto}</small>` 
                    : ''}
                
                ${interpretesInfo.interpretesTexto === 'Apenas o artista principal' 
                    ? '<br><small class="participacao-info"><i class="bi bi-people"></i> Apenas o artista principal</small>'
                    : interpretesInfo.interpretesTexto !== 'Nenhuma música com intérprete' && interpretesInfo.interpretesTexto !== 'Erro ao carregar'
                        ? `<br><small class="participacao-info" title="${interpretesInfo.interpretesTexto}"><i class="bi bi-people"></i> Part.: ${interpretesInfo.interpretesTexto.substring(0, 30)}${interpretesInfo.interpretesTexto.length > 30 ? '...' : ''}</small>`
                        : `<br><small class="participacao-info"><i class="bi bi-people"></i> ${interpretesInfo.interpretesTexto}</small>`}
            </td>
            <td>${dataFormatada}</td>
            <td>${disco.gravadora_nome || '-'}</td>
            <td>
                <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" 
                            onclick="verDetalhesDisco(${disco.disco_id})" 
                            title="Ver detalhes">
                        <i class="bi bi-info-circle"></i>
                    </button>
                    <button class="btn btn-success btn-sm" 
                            onclick="verMusicasDoDisco(${disco.disco_id}, '${disco.nome.replace(/'/g, "\\'")}')"
                            title="Gerenciar músicas">
                        <i class="bi bi-music-note"></i>
                    </button>
                    <button class="btn btn-warning btn-sm" 
                            onclick='editarDisco(${disco.disco_id}, ${dadosJSON})'
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" 
                            onclick="deletarDisco(${disco.disco_id})"
                            title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
}

function mostrarLoading(mostrar) {
    if (loadingOverlay) {
        loadingOverlay.style.display = mostrar ? 'flex' : 'none';
    }
}

export async function carregarDiscoParaEdicao(id) {
    try {
        console.log('Carregando disco para edição ID:', id);
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
        console.log('Iniciando edição do disco ID:', id, dados);
        const novosDados = await abrirModalEdicao(id, dados);
        
        if (novosDados === null) {
            console.log('Edição cancelada pelo usuário');
            return;
        }

        if (!validarDadosEdicao(novosDados)) return;

        if (!verificarAlteracoes(dados, novosDados)) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Sem alterações',
                mensagem: 'Nenhuma alteração foi feita no disco.'
            });
            return;
        }

        mostrarLoading(true);
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

        fecharModalEdicao();
        
    } catch (erro) {
        console.error('Erro detalhado ao editar disco:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: erro.message || 'Erro ao editar disco.'
        });
    } finally {
        mostrarLoading(false);
    }
}

function validarDadosEdicao(dados) {
    if (!dados.nome) {
        window.dialog.exibirDialogMensagem({ titulo: 'Campo vazio', mensagem: 'O nome do disco não pode ficar vazio.' });
        return false;
    }
    if (!dados.data_lancamento) {
        window.dialog.exibirDialogMensagem({ titulo: 'Campo vazio', mensagem: 'A data de lançamento não pode ficar vazia.' });
        return false;
    }
    if (!dados.gravadora_id) {
        window.dialog.exibirDialogMensagem({ titulo: 'Campo vazio', mensagem: 'Selecione uma gravadora.' });
        return false;
    }
    if (!dados.interprete_id) {
        window.dialog.exibirDialogMensagem({ titulo: 'Campo vazio', mensagem: 'Selecione o intérprete principal.' });
        return false;
    }
    return true;
}

function verificarAlteracoes(dadosAntigos, novosDados) {
    return !(novosDados.nome === dadosAntigos.nome && 
             novosDados.data_lancamento === dadosAntigos.data_lancamento &&
             novosDados.imagem === dadosAntigos.imagem && 
             novosDados.gravadora_id === dadosAntigos.gravadora_id &&
             novosDados.interprete_id === dadosAntigos.interprete_principal_id);
}

export async function deletarDisco(id) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar exclusão',
        mensagem: 'Tem certeza que deseja deletar este disco?'
    });
    
    if (!confirmado) return;

    mostrarLoading(true);
    try {
        const resultado = await window.lojaMusica.disco.deletar(id, false);
        
        if (resultado && resultado.erro) throw new Error(resultado.erro);
        
        if (discosDaPagina.length === 1 && paginaAtual > 1) paginaAtual--;

        await carregarDiscos();
        window.dialog.exibirDialogMensagem({ titulo: 'Sucesso', mensagem: 'Disco deletado com sucesso!' });
        
    } catch (erro) {
        if (erro.message && erro.message.includes('músicas associadas')) {
            mostrarLoading(false);
            const deletarComMusicas = await window.dialog.exibirDialogConfirmacao({
                titulo: 'Disco com músicas',
                mensagem: 'Este disco possui músicas associadas. Deseja deletar mesmo assim? Todas as músicas serão removidas do disco.'
            });
            
            if (deletarComMusicas) {
                mostrarLoading(true);
                try {
                    const resultadoForce = await window.lojaMusica.disco.deletar(id, true);
                    if (resultadoForce && resultadoForce.erro) throw new Error(resultadoForce.erro);
                    
                    if (discosDaPagina.length === 1 && paginaAtual > 1) paginaAtual--;
                    await carregarDiscos();
                    
                    window.dialog.exibirDialogMensagem({ titulo: 'Sucesso', mensagem: 'Disco e suas associações deletados com sucesso!' });
                } catch (erro2) {
                    window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: erro2.message || 'Erro ao deletar disco' });
                }
            }
        } else {
            window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: erro.message || 'Erro ao deletar disco' });
        }
    } finally {
        mostrarLoading(false);
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

    mostrarLoading(true);
    try {
        const discoCriado = await window.lojaMusica.disco.criar({
            nome,
            data_lancamento,
            imagem,
            gravadora_id: parseInt(gravadora_id),
            interprete_id: parseInt(interprete_id)
        });

        elements.formDisco.reset();
        paginaAtual = 1;
        await carregarDiscos();

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Disco "${discoCriado.nome || nome}" cadastrado com sucesso!`
        });
    } catch (erro) {
        console.error('Erro ao cadastrar disco:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao cadastrar disco: ' + erro.message
        });
    } finally {
        mostrarLoading(false);
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

window.editarDisco = editarDisco;
window.deletarDisco = deletarDisco;