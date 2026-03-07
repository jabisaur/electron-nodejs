
import { 
    configurarEventListeners
} from './core.js';
import { carregarGravadoras, carregarArtistas, carregarMusicasParaSelect } from './selects.js';
import { configurarModalEdicao } from './modal.js';
import { configurarFormularioDisco, carregarDiscos } from './discos.js';
import { configurarFormularioMusicas } from './musicas.js';

// função de inicialização única
export function inicializar() {
    console.log('Inicializando módulos...');
    
    // configura todos os módulos
    configurarEventListeners();
    carregarGravadoras();
    carregarMusicasParaSelect();
    carregarArtistas();
    carregarDiscos();
    configurarFormularioDisco();
    configurarFormularioMusicas();
    configurarModalEdicao();  // Configurar modal diretamente
    
    // verifica se tem ID na URL para edição
    const urlParams = new URLSearchParams(window.location.search);
    const discoId = urlParams.get('id');
    if (discoId) {
        console.log('ID encontrado na URL:', discoId);
        import('./discos.js').then(module => {
            module.carregarDiscoParaEdicao(discoId);
        });
    }
}

// re-exporta as funções que precisam ser globais para botões HTML
export * from './discos.js';
export * from './musicas.js';
export * from './modal.js';