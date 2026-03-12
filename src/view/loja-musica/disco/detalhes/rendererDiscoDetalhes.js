document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search)
    const discoId = urlParams.get('id')
    
    if (discoId) {
        carregarDetalhesDisco(discoId)
    } else {
        mostrarErro('ID do disco não fornecido')
    }
})

async function carregarDetalhesDisco(discoId) {
    try {
        // Mostrar loading, esconder conteúdo
        document.getElementById('loading').style.display = 'block'
        document.getElementById('conteudoDisco').style.display = 'none'

        const detalhes = await window.lojaMusica.disco.buscarDetalhesCompletos(parseInt(discoId))

        if (!detalhes || detalhes.erro) {
            throw new Error(detalhes?.erro || 'Erro ao carregar detalhes')
        }

        preencherInformacoesBasicas(detalhes.disco)
        
        preencherEstatisticas(detalhes.estatisticas)
        
        preencherInterpretes(detalhes.interpretes)
        
        preencherCompositores(detalhes.compositores)
        
        preencherFaixas(detalhes.musicas)
        
        // Esconder loading, mostrar conteúdo
        document.getElementById('loading').style.display = 'none'
        document.getElementById('conteudoDisco').style.display = 'block'

    } catch (erro) {
        console.error('Erro ao carregar detalhes:', erro)
        mostrarErro(erro.message)
    }
}

function preencherInformacoesBasicas(disco) {
    document.getElementById('nomeDisco').textContent = disco.nome || 'Nome não disponível'
    
    const capaImg = document.getElementById('capaDisco')
    if (disco.imagem) {
        capaImg.src = disco.imagem
        capaImg.alt = `Capa do disco ${disco.nome}`
    } else {
        capaImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 250 250"><rect width="250" height="250" fill="%23e9ecef"/><text x="125" y="125" font-family="Arial" font-size="14" fill="%236c757d" text-anchor="middle" dominant-baseline="middle">📀 Sem Capa</text></svg>'
    }
    
    const data = disco.data_lancamento ? new Date(disco.data_lancamento).toLocaleDateString('pt-BR') : 'Não informada'
    document.getElementById('dataLancamento').textContent = data
    
    document.getElementById('gravadora').textContent = disco.gravadora_nome || 'Não informada'
    
    document.getElementById('artistaPrincipal').textContent = disco.interprete_principal_nome || 'Não informado'
}

function preencherEstatisticas(estatisticas) {
    document.getElementById('estatisticas').innerHTML = `
        <span class="badge bg-primary me-2">${estatisticas.totalMusicas} faixas</span>
        <span class="badge bg-success">${estatisticas.duracaoTotal}</span>
    `
    document.getElementById('totalFaixas').textContent = estatisticas.totalMusicas
    document.getElementById('duracaoTotal').textContent = estatisticas.duracaoTotal
}

function preencherInterpretes(interpretes) {
    const container = document.getElementById('interpretesLista')
    
    if (!interpretes || interpretes.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-muted">Nenhum intérprete encontrado</p></div>'
        return
    }
    
    let html = ''
    interpretes.forEach(interprete => {
        html += `
            <div class="col-md-6 mb-2">
                <div class="card bg-light">
                    <div class="card-body p-2">
                        <strong>${interprete.nome}</strong>
                        <br>
                        <small class="text-muted">${interprete.musicas_interpretadas} música(s)</small>
                    </div>
                </div>
            </div>
        `
    })
    
    container.innerHTML = html
}

function preencherCompositores(compositores) {
    const container = document.getElementById('compositoresLista')
    
    if (!compositores || compositores.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-muted">Nenhum compositor encontrado</p></div>'
        return
    }
    
    let html = ''
    compositores.forEach(compositor => {
        html += `
            <div class="col-md-6 mb-2">
                <div class="card bg-light">
                    <div class="card-body p-2">
                        <strong>${compositor.nome}</strong>
                        <br>
                        <small class="text-muted">${compositor.musicas_compostas} música(s)</small>
                    </div>
                </div>
            </div>
        `
    })
    
    container.innerHTML = html
}

function preencherFaixas(musicas) {
    const tbody = document.getElementById('faixasLista')
    
    if (!musicas || musicas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma faixa encontrada</td></tr>'
        return
    }
    
    let html = ''
    musicas.forEach(musica => {
        html += `
            <tr class="faixa-item">
                <td><span class="ordem-badge">${musica.ordem}</span></td>
                <td>
                    <strong class="musica-titulo">${musica.musica_nome}</strong>
                </td>
                <td><span class="musica-duracao">${musica.duracao || '--:--'}</span></td>
                <td><span class="estilo-badge">${musica.estilo_nome || 'N/A'}</span></td>
                <td>
                    ${musica.interpretes_nomes 
                        ? `<small class="text-primary">${musica.interpretes_nomes}</small>` 
                        : '<small class="text-muted">Nenhum</small>'}
                </td>
                <td>
                    ${musica.compositores_nomes 
                        ? `<small class="text-warning">${musica.compositores_nomes}</small>` 
                        : '<small class="text-muted">Nenhum</small>'}
                </td>
            </tr>
        `
    })
    
    tbody.innerHTML = html
}

function mostrarErro(mensagem) {
    document.getElementById('loading').style.display = 'none'
    document.getElementById('conteudoDisco').style.display = 'none'
    
    if (window.dialog && window.dialog.exibirDialogMensagem) {
        window.dialog.exibirDialogMensagem({
            titulo: 'Erro',
            mensagem: mensagem
        });
    }
    
}