import { elements } from './core.js';

export async function carregarGravadoras() {
    try {
        const gravadoras = await window.lojaMusica.gravadora.listar();

        if (gravadoras && gravadoras.length > 0) {
            elements.selectGravadora.innerHTML = '<option value="">Selecione uma gravadora...</option>';
            gravadoras.forEach(gravadora => {
                elements.selectGravadora.innerHTML += `<option value="${gravadora.gravadora_id}">${gravadora.nome}</option>`;
            });

            const selectEdicao = document.getElementById('edicaoGravadora');
            if (selectEdicao) {
                selectEdicao.innerHTML = '<option value="">Selecione uma gravadora...</option>';
                gravadoras.forEach(gravadora => {
                    selectEdicao.innerHTML += `<option value="${gravadora.gravadora_id}">${gravadora.nome}</option>`;
                });
            }

        } else {
            elements.selectGravadora.innerHTML = '<option value="">Nenhuma gravadora cadastrada</option>';
        }
    } catch (erro) {
        console.error('Erro ao carregar gravadoras:', erro);
        elements.selectGravadora.innerHTML = '<option value="">Erro ao carregar gravadoras</option>';
    }
}

export async function carregarMusicasParaSelect() {
    try {
        const musicas = await window.lojaMusica.musica.listar();

        if (musicas && musicas.length > 0) {
            elements.selectMusica.innerHTML = '<option value="">Selecione uma música...</option>';
            musicas.forEach(musica => {
                elements.selectMusica.innerHTML += `<option value="${musica.musica_id}">${musica.nome} (${musica.estilo_nome || 'Sem estilo'})</option>`;
            });
        } else {
            elements.selectMusica.innerHTML = '<option value="">Nenhuma música cadastrada</option>';
        }
    } catch (erro) {
        console.error('Erro ao carregar músicas:', erro);
        elements.selectMusica.innerHTML = '<option value="">Erro ao carregar músicas</option>';
    }
}

export async function carregarArtistas() {
    try {
        const artistas = await window.lojaMusica.artista.listar();

        if (artistas && artistas.length > 0) {
            // select do formulário principal
            elements.selectInterprete.innerHTML = '<option value="">Selecione o intérprete principal...</option>';
            
            // select do modal de edição
            const selectInterpreteEdicao = document.getElementById('interprete_id_edicao');
            if (selectInterpreteEdicao) {
                selectInterpreteEdicao.innerHTML = '<option value="">Selecione o intérprete principal...</option>';
            }
            
            artistas.sort((a, b) => a.nome.localeCompare(b.nome));
            artistas.forEach(artista => {
                elements.selectInterprete.innerHTML += `<option value="${artista.artista_id}">${artista.nome}</option>`;
                if (selectInterpreteEdicao) {
                    selectInterpreteEdicao.innerHTML += `<option value="${artista.artista_id}">${artista.nome}</option>`;
                }
            });
        } else {
            elements.selectInterprete.innerHTML = '<option value="">Nenhum artista cadastrado</option>';
        }
    } catch (erro) {
        console.error('Erro ao carregar artistas:', erro);
        elements.selectInterprete.innerHTML = '<option value="">Erro ao carregar artistas</option>';
    }
}

// funções para carregar selects específicos do modal
export async function carregarGravadorasNoSelectEdicao(gravadoraIdSelecionada) {
    try {
        const gravadoras = await window.lojaMusica.gravadora.listar();
        const select = document.getElementById('edicaoGravadora');
        
        if (select) {
            select.innerHTML = '<option value="">Selecione uma gravadora...</option>';
            gravadoras.forEach(gravadora => {
                const selected = gravadora.gravadora_id === gravadoraIdSelecionada ? 'selected' : '';
                select.innerHTML += `<option value="${gravadora.gravadora_id}" ${selected}>${gravadora.nome}</option>`;
            });
        }
    } catch (erro) {
        console.error('Erro ao carregar gravadoras para edição:', erro);
    }
}

export async function carregarInterpretesNoSelectEdicao(interpreteIdSelecionado) {
    try {
        const artistas = await window.lojaMusica.artista.listar();
        const select = document.getElementById('interprete_id_edicao');
        
        if (select) {
            select.innerHTML = '<option value="">Selecione o intérprete principal...</option>';
            artistas.sort((a, b) => a.nome.localeCompare(b.nome));
            artistas.forEach(artista => {
                const selected = artista.artista_id === interpreteIdSelecionado ? 'selected' : '';
                select.innerHTML += `<option value="${artista.artista_id}" ${selected}>${artista.nome}</option>`;
            });
        }
    } catch (erro) {
        console.error('Erro ao carregar intérpretes para edição:', erro);
    }
}