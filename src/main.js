const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const calculadoraService = require('./service/calculadora/calculadoraService')
const contadorService = require('./service/contador/contadorService')
const estiloService = require('./service/loja-musica/estiloService')
const gravadoraService = require('./service/loja-musica/gravadoraService')
const artistaService = require('./service/loja-musica/artistaService')
const musicaService = require('./service/loja-musica/musicaService')
const discoService = require('./service/loja-musica/discoService')
const buscaService = require('./service/loja-musica/buscaService')

console.log('Estou executando no node!');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  })

  win.loadFile(path.resolve('src/view/index.html'))

  win.maximize()
  win.show()
}

const createIpcMain = () => {

  ipcMain.on('dialog:mensagem:exibir', (event, { titulo, mensagem }) => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (!focusedWindow) return

    dialog.showMessageBox(focusedWindow, {
      type: 'info',
      title: titulo || '',
      message: mensagem || '',
      buttons: ['Ok']
    })
  });
  ipcMain.handle('dialog:confirmar:exibir', async (event, { titulo, mensagem, btnCancelar, btnConfirmar }) => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (!focusedWindow) return

    const { response } = await dialog.showMessageBox(focusedWindow, {
      type: 'question',
      title: titulo || '',
      message: mensagem || '',
      buttons: [
        btnCancelar || 'Cancelar',
        btnConfirmar || 'Confirmar'
      ]
    })

    return response === 1
  });
  ipcMain.handle('dialog:editar:exibir', async (event, { titulo, mensagem, valorAtual, campoPlaceholder, btnCancelar, btnConfirmar }) => {
    return {
      titulo: titulo || 'Editar',
      mensagem: mensagem || '',
      valorAtual: valorAtual || '',
      campoPlaceholder: campoPlaceholder || 'Digite o novo valor...',
      btnCancelar: btnCancelar || 'Cancelar',
      btnConfirmar: btnConfirmar || 'Salvar'
    };
  });

  ipcMain.handle("contador:incrementar", () => {
    try {
      return contadorService.incrementar();
    } catch (erro) {
      return { erro: erro.message };
    }
  });
  ipcMain.handle("contador:pegarValor", () => {
    try {
      return contadorService.pegarValor();
    } catch (erro) {
      return { erro: erro.message };
    }
  });
  ipcMain.handle("contador:zerar", () => {
    try {
      return contadorService.zerar();

    } catch (erro) {
      return { erro: erro.message };
    }
  });

  ipcMain.handle("calculadora:calcular", (event, { num1, num2, operacao }) => {
    try {
      return calculadoraService.calcular(num1, num2, operacao);
    } catch (erro) {
      return { erro: erro.message };
    }
  });

  // Estilo
  ipcMain.handle('lojaMusica:estilo:listar', async () => {
    try {
      return await estiloService.listar();
    } catch (erro) {
      return { erro: erro.message };
    }
  });
  ipcMain.handle("lojaMusica:estilo:criar", async (event, descricao) => {
    try {
      return await estiloService.criar(descricao);
    } catch (erro) {
      return { erro: erro.message };
    }
  });
  ipcMain.handle("lojaMusica:estilo:deletar", async (event, id) => {
    try {
      return await estiloService.deletar(id);
    } catch (erro) {
      return { erro: erro.message };
    }
  });
  ipcMain.handle("lojaMusica:estilo:editar", async (event, id, descricao) => {
    try {
      return await estiloService.editar(id, descricao)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:estilo:buscar", async (event, id) => {
    try {
      return await estiloService.buscar(id)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:estilo:buscarPorDescricao", async (event, descricao) => {
    try {
      return await estiloService.buscarPorDescricao(descricao)
    } catch (erro) {
      return { erro: erro.message }
    }
  });

  // Gravadora
  ipcMain.handle("lojaMusica:gravadora:criar", async (event, nome) => {
    try {
      return await gravadoraService.criar(nome);
    } catch (erro) {
      return { erro: erro.message };
    }
  });
  ipcMain.handle("lojaMusica:gravadora:listar", async () => {
    try {
      return await gravadoraService.listar();
    } catch (erro) {
      return { erro: erro.message };
    }
  });
  ipcMain.handle("lojaMusica:gravadora:deletar", async (event, id) => {
    try {
      return await gravadoraService.deletar(id);
    } catch (erro) {
      return { erro: erro.message };
    }
  });
  ipcMain.handle("lojaMusica:gravadora:editar", async (event, id, nome) => {
    try {
      return await gravadoraService.editar(id, nome);
    } catch (erro) {
      return { erro: erro.message };
    }
  });
  ipcMain.handle("lojaMusica:gravadora:buscar", async (event, id) => {
    try {
      return await gravadoraService.buscar(id);
    } catch (erro) {
      return { erro: erro.message };
    }
  });
  ipcMain.handle("lojaMusica:gravadora:buscarPorNome", async (event, nome) => {
    try {
      return await gravadoraService.buscarPorNome(nome)
    } catch (erro) {
      return { erro: erro.message }
    }
  });

  // Artista
  ipcMain.handle("lojaMusica:artista:criar", async (event, nome) => {
    try {
      return await artistaService.criar(nome)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:artista:listar", async () => {
    try {
      return await artistaService.listar()
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:artista:deletar", async (event, id) => {
    try {
      return await artistaService.deletar(id)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:artista:editar", async (event, id, nome) => {
    try {
      return await artistaService.editar(id, nome)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:artista:buscar", async (event, id) => {
    try {
      return await artistaService.buscar(id)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:artista:buscarPorNome", async (event, nome) => {
    try {
      return await artistaService.buscarPorNome(nome)
    } catch (erro) {
      return { erro: erro.message }
    }
  });

  // Música
  ipcMain.handle("lojaMusica:musica:criar", async (event, dados) => {
    try {
      return await musicaService.criar(dados)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:musica:listar", async () => {
    try {
      return await musicaService.listar()
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:musica:deletar", async (event, id) => {
    try {
      return await musicaService.deletar(id)
    } catch (erro) {
      return { erro: message }
    }
  });
  ipcMain.handle("lojaMusica:musica:editar", async (event, id, dados) => {
    try {
      return await musicaService.editar(id, dados)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:musica:buscar", async (event, id) => {
    try {
      return await musicaService.buscar(id)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:musica:buscarInterpretes", async (event, musicaId) => {
    try {
      return await musicaService.buscarInterpretes(musicaId)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:musica:buscarCompositores", async (event, musicaId) => {
    try {
      return await musicaService.buscarCompositores(musicaId)
    } catch (erro) {
      return { erro: erro.message }
    }
  });

  // Disco
  ipcMain.handle("lojaMusica:disco:criar", async (event, dados) => {
    try {
      return await discoService.criar(dados)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:disco:listar", async () => {
    try {
      return await discoService.listar()
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:disco:deletar", async (event, id) => {
    try {
      return await discoService.deletar(id)
    } catch (erro) {
      return { erro: message }
    }
  });
  ipcMain.handle("lojaMusica:disco:editar", async (event, id, dados) => {
    try {
      return await discoService.editar(id, dados)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:disco:buscar", async (event, id) => {
    try {
      return await discoService.buscar(id)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:disco:buscarPorNome", async (event, nome) => {
    try {
      return await discoService.buscarPorNome(nome)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:disco:buscarPorNomeEInterpretes", async (event, nome, interpreteIds) => {
    try {
      return await discoService.buscarPorNomeEInterpretes(nome, interpreteIds)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:disco:getInterpretes", async (event, discoId) => {
    try {
      return await discoService.getInterpretesDoDisco(discoId)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle("lojaMusica:disco:getInterpretePrincipal", async (event, discoId) => {
    try {
      return await discoService.getInterpretePrincipal(discoId)
    } catch (erro) {
      return { erro: erro.message }
    }
  });

  // Disco-Musicas
  ipcMain.handle('lojaMusica:disco:musicas:listar', async (event, disco_id) => {
    try {
      return await discoService.musicas.listar(disco_id)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle('lojaMusica:disco:musicas:adicionar', async (event, disco_id, musica_id, ordem) => {
    try {
      return await discoService.musicas.adicionar(disco_id, musica_id, ordem)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle('lojaMusica:disco:musicas:remover', async (event, disco_id, musica_id) => {
    try {
      return await discoService.musicas.remover(disco_id, musica_id)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle('lojaMusica:disco:musicas:verificar', async (event, disco_id, musica_id) => {
    try {
      return await discoService.musicas.verificar(disco_id, musica_id)
    } catch (erro) {
      return { erro: erro.message }
    }
  });

  // Busca
  ipcMain.handle('lojaMusica:busca:global', async (event, termo) => {
    try {
      return await buscaService.buscaGlobal(termo)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle('lojaMusica:busca:artistasComPapeis', async () => {
    try {
      return await buscaService.artistasComPapeis()
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle('lojaMusica:busca:artistasFiltrados', async (event, filtros) => {
    try {
      return await buscaService.artistasFiltrados(filtros)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle('lojaMusica:busca:discosCompletos', async (event, filtros) => {
    try {
      return await buscaService.discosCompletos(filtros)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
  ipcMain.handle('lojaMusica:busca:musicasComDetalhes', async (event, filtros) => {
    try {
      return await buscaService.musicasComDetalhes(filtros)
    } catch (erro) {
      return { erro: erro.message }
    }
  });
}

app.whenReady().then(() => {
  createIpcMain()
  createWindow()
})