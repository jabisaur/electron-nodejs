// importa e inicializa os módulos
import { inicializar } from './modules/index.js';

// inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, inicializando módulos...');
    inicializar();
});