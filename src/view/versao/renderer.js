document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de versões carregada');
    
    // mostrando versões com animação
    if (window.versao) {
        setTimeout(() => {
            document.getElementById('chrome').textContent = window.versao.chrome || 'N/A';
        }, 100);
        
        setTimeout(() => {
            document.getElementById('node').textContent = window.versao.node || 'N/A';
        }, 200);
        
        setTimeout(() => {
            document.getElementById('electron').textContent = window.versao.electron || 'N/A';
        }, 300);
    }
});