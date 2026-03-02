const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("versao", {
    chrome: process.versions.chrome,
    node: process.versions.node,
    electron: process.versions.electron
});

contextBridge.exposeInMainWorld("contador", {
    incrementar: () => {
        return ipcRenderer.invoke("contador:incrementar")
    },
    zerar: () => {
        return ipcRenderer.invoke("contador:zerar")
    },
    pegarValor: () => {
        return ipcRenderer.invoke("contador:pegarValor")
    }
});

contextBridge.exposeInMainWorld("calculadora", {
    calcular: ({ num1, num2, operacao }) => {
        return ipcRenderer.invoke("calculadora:calcular", {
            num1,
            num2,
            operacao
        })
    }
});

contextBridge.exposeInMainWorld("dialog", {
    exibirDialogMensagem: (dados) => ipcRenderer.send('dialog:mensagem:exibir', dados),
    exibirDialogConfirmacao: (dados) => ipcRenderer.invoke('dialog:confirmar:exibir', dados),
    exibirDialogEdicao: async (options) => {
        const config = await ipcRenderer.invoke('dialog:editar:exibir', options);
    
        return new Promise((resolve) => {
        const edicaoEvent = new CustomEvent('show-edicao-dialog', {
            detail: {
            ...config,
            resolve
            }
        });
        window.dispatchEvent(edicaoEvent);
        });
    }
});

contextBridge.exposeInMainWorld("lojaMusica", {
    estilo: {
        criar: (descricao) => ipcRenderer.invoke("lojaMusica:estilo:criar", descricao),
        listar: () => ipcRenderer.invoke("lojaMusica:estilo:listar"),
        deletar: (id) => ipcRenderer.invoke("lojaMusica:estilo:deletar", id),
        editar: (id, descricao) => ipcRenderer.invoke("lojaMusica:estilo:editar", id, descricao),
        buscar: (id) => ipcRenderer.invoke("lojaMusica:estilo:buscar", id),
        buscarPorDescricao: (descricao) => ipcRenderer.invoke("lojaMusica:estilo:buscarPorDescricao", descricao)
    },
    gravadora: {
        criar: (nome) => ipcRenderer.invoke("lojaMusica:gravadora:criar", nome),
        listar: () => ipcRenderer.invoke("lojaMusica:gravadora:listar"),
        deletar: (id) => ipcRenderer.invoke("lojaMusica:gravadora:deletar", id),
        editar: (id, nome) => ipcRenderer.invoke("lojaMusica:gravadora:editar", id, nome),
        buscar: (id) => ipcRenderer.invoke("lojaMusica:gravadora:buscar", id),
        buscarPorNome: (nome) => ipcRenderer.invoke("lojaMusica:gravadora:buscarPorNome", nome)
    }, 
    artista: {
        criar: (nome) => ipcRenderer.invoke("lojaMusica:artista:criar", nome),
        listar: () => ipcRenderer.invoke("lojaMusica:artista:listar"),
        deletar: (id) => ipcRenderer.invoke("lojaMusica:artista:deletar", id),
        editar: (id, nome) => ipcRenderer.invoke("lojaMusica:artista:editar", id, nome),
        buscar: (id) => ipcRenderer.invoke("lojaMusica:artista:buscar", id),
        buscarPorNome: (nome) => ipcRenderer.invoke("lojaMusica:artista:buscarPorNome", nome)
    },
    musica: {
        criar: (dados) => ipcRenderer.invoke("lojaMusica:musica:criar", dados),
        listar: () => ipcRenderer.invoke("lojaMusica:musica:listar"),
        deletar: (id) => ipcRenderer.invoke("lojaMusica:musica:deletar", id),
        editar: (id, dados) => ipcRenderer.invoke("lojaMusica:musica:editar", id, dados),
        buscar: (id) => ipcRenderer.invoke("lojaMusica:musica:buscar", id),
        buscarInterpretes: (musicaId) => ipcRenderer.invoke("lojaMusica:musica:buscarInterpretes", musicaId),
        buscarCompositores: (musicaId) => ipcRenderer.invoke("lojaMusica:musica:buscarCompositores", musicaId)
        
    },
    disco: {
        criar: (dados) => ipcRenderer.invoke("lojaMusica:disco:criar", dados),
        listar: () => ipcRenderer.invoke("lojaMusica:disco:listar"),
        deletar: (id) => ipcRenderer.invoke("lojaMusica:disco:deletar", id),
        editar: (id, dados) => ipcRenderer.invoke("lojaMusica:disco:editar", id, dados),
        buscar: (id) => ipcRenderer.invoke("lojaMusica:disco:buscar", id),
        buscarPorNome: (nome) => ipcRenderer.invoke("lojaMusica:disco:buscarPorNome", nome),
        buscarPorNomeEInterpretes: (nome, interpreteIds) => ipcRenderer.invoke("lojaMusica:disco:buscarPorNomeEInterpretes", nome, interpreteIds),
        getInterpretes: (discoId) => ipcRenderer.invoke("lojaMusica:disco:getInterpretes", discoId),
        musicas: {
            listar: (disco_id) => ipcRenderer.invoke("lojaMusica:disco:musicas:listar", disco_id),
            adicionar: (disco_id, musica_id) => ipcRenderer.invoke("lojaMusica:disco:musicas:adicionar", disco_id, musica_id),
            remover: (disco_id, musica_id) => ipcRenderer.invoke("lojaMusica:disco:musicas:remover", disco_id, musica_id),
            verificar: (disco_id, musica_id) => ipcRenderer.invoke("lojaMusica:disco:musicas:verificar", disco_id, musica_id)
        }
    }
});