let totalCliques = 0;
let cliquesSessao = 0;

(async () => {
    const btnIncrementar = document.getElementById("incrementar");
    const btnZerar = document.getElementById("zerar");
    const contador = document.getElementById("contador");
    const totalCliquesEl = document.getElementById("total-cliques");
    const sessaoCliquesEl = document.getElementById("sessao-cliques");

    const valorInicial = await window.contador.pegarValor();
    contador.innerHTML = valorInicial;
    totalCliques = valorInicial;
    totalCliquesEl.textContent = totalCliques;

    btnIncrementar.addEventListener('click', async () => {
        btnIncrementar.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btnIncrementar.style.transform = '';
        }, 200);

        await window.contador.incrementar();
        const valor = await window.contador.pegarValor();
        
        contador.style.animation = 'glow 0.5s ease';
        setTimeout(() => {
            contador.style.animation = '';
        }, 500);
        
        contador.innerHTML = valor;

        totalCliques = valor;
        cliquesSessao++;
        totalCliquesEl.textContent = totalCliques;
        sessaoCliquesEl.textContent = cliquesSessao;
    });

    btnZerar.addEventListener('click', async() => {
        const confirmado = await window.dialog.exibirDialogConfirmacao({
            titulo: 'Confirmar',
            mensagem: 'Tem certeza que deseja zerar o contador?'
        });

        if (!confirmado) return;

        btnZerar.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btnZerar.style.transform = '';
        }, 200);

        await window.contador.zerar();
        const valor = await window.contador.pegarValor();

        contador.innerHTML = valor;

        totalCliques = valor;
        cliquesSessao = 0;
        totalCliquesEl.textContent = totalCliques;
        sessaoCliquesEl.textContent = cliquesSessao;
    });

})();