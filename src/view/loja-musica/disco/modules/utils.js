export function formatarData(data) {
    if (!data) return '(vazio)';
    
    try {
        const dataObj = new Date(data + 'T12:00:00');
        return dataObj.toLocaleDateString('pt-BR');
    } catch (e) {
        const partes = data.split('T')[0].split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return data;
    }
}

export function escaparAspas(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

export function verDetalhesDisco(discoId) {
    window.location.href = `detalhes/discoDetalhes.html?id=${discoId}`;
}

export function verMusicasDoDisco(discoId, discoNome) {
    const nomeCodificado = encodeURIComponent(discoNome);
    window.location.href = `gerenciarMusicas.html?id=${discoId}&nome=${nomeCodificado}`;
}

// exporta para tornar global
window.verMusicasDoDisco = verMusicasDoDisco;
window.verDetalhesDisco = verDetalhesDisco;