// Elementos DOM principais
export const elements = {
    formDisco: document.getElementById('form-disco'),
    tbodyDiscos: document.getElementById('tbody-discos'),
    selectGravadora: document.getElementById('gravadora_id'),
    selectMusica: document.getElementById('musica_id'),
    formMusicaDisco: document.getElementById('form-musica-disco'),
    secaoMusicas: document.getElementById('secao-musicas'),
    listaMusicasDisco: document.getElementById('lista-musicas-disco'),
    selectInterprete: document.getElementById('interprete_id')
};


export let discoEditandoId = null;
export let discoEditandoResolve = null;
export let discoEditandoDados = null;
export let discoMusicasAbertoId = null;


export function setDiscoEditandoId(id) {
    discoEditandoId = id;
}

export function setDiscoEditandoResolve(resolve) {
    discoEditandoResolve = resolve;
}

export function setDiscoEditandoDados(dados) {
    discoEditandoDados = dados;
}

export function setDiscoMusicasAbertoId(id) {
    discoMusicasAbertoId = id;
}

export function configurarEventListeners() {
    window.addEventListener('unload', () => {
    });
}

// exporta os elementos para outros módulos
export default elements;