import { inicializar } from './modules/index.js';
import { editarDisco, deletarDisco, carregarDiscos } from './modules/discos.js';
import { removerMusicaDoDisco } from './modules/musicas.js';  
import { verDetalhesDisco, verMusicasDoDisco } from './modules/utils.js';  
import { fecharModalEdicao } from './modules/modal.js';

window.editarDisco = editarDisco;
window.deletarDisco = deletarDisco;
window.verMusicasDoDisco = verMusicasDoDisco; 
window.removerMusicaDoDisco = removerMusicaDoDisco;
window.verDetalhesDisco = verDetalhesDisco;
window.fecharModalEdicao = fecharModalEdicao;

window.aplicarFiltros = () => import('./modules/discos.js').then(module => module.aplicarFiltros());
window.limparFiltros = () => import('./modules/discos.js').then(module => module.limparFiltros());
window.paginaAnterior = () => import('./modules/discos.js').then(module => module.paginaAnterior());
window.proximaPagina = () => import('./modules/discos.js').then(module => module.proximaPagina());

if (window.dialog && window.dialog.exibirDialogConfirmacao) {
    console.log('Dialog disponível');
} else {
    console.warn('Dialog não encontrado, algumas funções podem não funcionar');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, inicializando módulos...');
    inicializar();
});

window.addEventListener('error', (event) => {
    if (event.message.includes('is not defined')) {
        console.error('Função não definida:', event.filename, event.lineno);
    }
});

console.log('Renderizador de Discos carregado com sucesso!');