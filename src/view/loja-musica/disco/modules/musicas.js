import { elements, setDiscoMusicasAbertoId, discoMusicasAbertoId } from './core.js';

export function configurarFormularioMusicas() {
    if (elements.formMusicaDisco) {
        elements.formMusicaDisco.addEventListener('submit', async (event) => {
            event.preventDefault();
            await adicionarMusica();
        });
    }
}

export async function verMusicasDoDisco(discoId) {
    try {
        if (discoMusicasAbertoId === discoId) {
            elements.secaoMusicas.style.display = 'none';
            setDiscoMusicasAbertoId(null);
            return;
        }
        
        elements.secaoMusicas.style.display = 'block';
        setDiscoMusicasAbertoId(discoId);

        const disco = await window.lojaMusica.disco.buscar(discoId);
        document.querySelector('#secao-musicas h2').innerHTML = `🎵 Músicas do Disco: ${disco.nome}`;

        await carregarMusicasDoDisco(discoId);
    } catch (erro) {
        console.error('Erro ao carregar músicas do disco:', erro);
    }
}

async function adicionarMusica() {
    const musicaId = document.getElementById('musica_id').value;
    const ordem = document.getElementById('ordem_musica').value;

    if (!validarCamposMusica(musicaId, ordem)) return;
    if (!discoMusicasAbertoId) {
        window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: 'Nenhum disco selecionado' });
        return;
    }

    try {
        const ordemNum = parseInt(ordem);
        const musicasExistentes = await window.lojaMusica.disco.musicas.listar(discoMusicasAbertoId);
        const ordemExistente = musicasExistentes.find(m => m.ordem === ordemNum);

        if (ordemExistente) {
            window.dialog.exibirDialogMensagem({
                titulo: 'Ordem ocupada',
                mensagem: `Já existe a música "${ordemExistente.nome}" na ordem ${ordemNum}.`
            });
            return;
        }

        await window.lojaMusica.disco.musicas.adicionar(
            discoMusicasAbertoId, 
            parseInt(musicaId),
            ordemNum
        );

        await carregarMusicasDoDisco(discoMusicasAbertoId);
        limparCamposMusica();

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: `Música adicionada ao disco na ordem ${ordemNum}!`
        });
    } catch (erro) {
        console.error('Erro ao adicionar música:', erro);
        let mensagemErro = erro.message;
        if (erro.message.includes('UNIQUE constraint failed')) {
            mensagemErro = 'Esta música já está neste disco ou a ordem já está ocupada.';
        }
        window.dialog.exibirDialogMensagem({ titulo: 'Erro', mensagem: mensagemErro });
    }
}

function validarCamposMusica(musicaId, ordem) {
    if (!musicaId) {
        window.dialog.exibirDialogMensagem({ titulo: 'Campo obrigatório', mensagem: 'Selecione uma música' });
        return false;
    }
    if (!ordem) {
        window.dialog.exibirDialogMensagem({ titulo: 'Campo obrigatório', mensagem: 'Informe a ordem da música' });
        document.getElementById('ordem_musica').focus();
        return false;
    }
    return true;
}

function limparCamposMusica() {
    document.getElementById('musica_id').value = '';
    document.getElementById('ordem_musica').value = '';
}

export async function carregarMusicasDoDisco(discoId) {
    try {
        const musicas = await window.lojaMusica.disco.musicas.listar(discoId);

        if (!musicas || musicas.length === 0) {
            elements.listaMusicasDisco.innerHTML = '<p class="text-muted">Nenhuma música adicionada a este disco ainda.</p>';
            return;
        }

        musicas.sort((a, b) => (a.ordem || 999) - (b.ordem || 999));

        let html = '<ul class="list-group">';
        musicas.forEach(musica => {
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <span class="badge bg-secondary me-2">${musica.ordem || '?'}</span>
                        <strong>${musica.nome}</strong> 
                        ${musica.duracao ? `- ${musica.duracao}` : ''}
                        ${musica.estilo_nome ? `<br><small class="text-muted">${musica.estilo_nome}</small>` : ''}
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="removerMusicaDoDisco(${discoId}, ${musica.musica_id})">
                        Remover
                    </button>
                </li>
            `;
        });
        html += '</ul>';
        
        elements.listaMusicasDisco.innerHTML = html;
    } catch (erro) {
        console.error('Erro ao carregar músicas do disco:', erro);
        elements.listaMusicasDisco.innerHTML = '<p class="text-danger">Erro ao carregar músicas.</p>';
    }
}

export async function removerMusicaDoDisco(discoId, musicaId) {
    const confirmado = await window.dialog.exibirDialogConfirmacao({
        titulo: 'Confirmar remoção',
        mensagem: 'Tem certeza que deseja remover esta música do disco?'
    });

    if (!confirmado) return;

    try {
        await window.lojaMusica.disco.musicas.remover(discoId, musicaId);
        await carregarMusicasDoDisco(discoId);

        window.dialog.exibirDialogMensagem({
            titulo: 'Sucesso',
            mensagem: 'Música removida do disco com sucesso!'
        });
    } catch (erro) {
        console.error('Erro ao remover música:', erro);
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: 'Erro ao remover música: ' + erro.message
        });
    }
}