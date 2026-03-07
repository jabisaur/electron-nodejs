import { inicializar } from './modules/index.js';
import { editarDisco, deletarDisco } from './modules/discos.js';
import { verMusicasDoDisco, removerMusicaDoDisco } from './modules/musicas.js';
import { verDetalhesDisco } from './modules/utils.js';
import { fecharModalEdicao } from './modules/modal.js';

// tornar funções disponíveis globalmente para os botões onclick no HTML
window.editarDisco = editarDisco;
window.deletarDisco = deletarDisco;
window.verMusicasDoDisco = verMusicasDoDisco;
window.removerMusicaDoDisco = removerMusicaDoDisco;
window.verDetalhesDisco = verDetalhesDisco;
window.fecharModalEdicao = fecharModalEdicao;
// Não exponha configurarModalEdicao aqui

// também expor a função de confirmação se ela existir
if (window.dialog && window.dialog.exibirDialogConfirmacao) {
    console.log('Dialog disponível');
} else {
    console.warn('Dialog não encontrado, algumas funções podem não funcionar');
}

// inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, inicializando módulos...');
    inicializar();
});

// tratamento de erros global para funções não definidas
window.addEventListener('error', (event) => {
    if (event.message.includes('is not defined')) {
        console.error('Função não definida:', event.filename, event.lineno);
    }
});

console.log('Renderizador de Discos carregado com sucesso!');