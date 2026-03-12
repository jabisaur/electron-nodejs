let dados = {
    num1: '', 
    num2: '', 
    operacao: null
}, 
expressaoCompleta = '',
num2Display = false,
historico = [],
ultimaOperacao = null

const display = document.getElementById('display')
const historicoDiv = document.getElementById('historico')

function adicionarNumero(numero) {
    if (!dados.operacao) {
        if (dados.num1 === '0' || dados.num1 === '') {
            dados.num1 = numero
        } else {
            dados.num1 += numero
        }
        expressaoCompleta = dados.num1
    } else {
        if (!num2Display) {
            dados.num2 = numero
            num2Display = true
        } else {
            dados.num2 += numero
        }
        expressaoCompleta = dados.num1 + ' ' + getOperadorDisplay(dados.operacao) + ' ' + dados.num2
    }
    
    atualizarDisplay()
}

function definirOperador(operacao) {
    if (dados.operacao && num2Display && dados.num2) {
        calcular()
        if (dados.num1 && dados.num1 !== 'Erro') {
            dados.operacao = operacao
            dados.num2 = ''
            num2Display = false
            expressaoCompleta = dados.num1 + ' ' + getOperadorDisplay(operacao)
            atualizarDisplay()
        }
        return
    }
    
    if (!dados.num1 || dados.num1 === '') {
        dados.num1 = '0'
    }
    
    dados.operacao = operacao
    dados.num2 = ''
    num2Display = false
    expressaoCompleta = dados.num1 + ' ' + getOperadorDisplay(operacao)
    atualizarDisplay()
}

function getOperadorDisplay(operacao) {
    switch (operacao) {
        case '/': return '÷'
        case '*': return '×'
        case '-': return '−'
        case '+': return '+'
        case '%': return '%'
        case 'mod': return 'mod'
        default: return operacao
    }
}

function calcular() {
    if (!dados.num1 || !dados.operacao || !dados.num2) {
        return
    }
    
    const num1 = parseFloat(dados.num1)
    const num2 = parseFloat(dados.num2)
    const expressao = `${dados.num1} ${dados.operacao} ${dados.num2}`
    let resultado
    
    switch(dados.operacao) {
        case '+': 
            resultado = num1 + num2
            break
        case '-': 
            resultado = num1 - num2
            break
        case '*': 
            resultado = num1 * num2
            break
        case '/':
            if (num2 === 0) {
                resultado = 'Erro: Divisão por zero'
            } else {
                resultado = num1 / num2
            }
            break
        case '%':
            if (ultimaOperacao === '+' || ultimaOperacao === '-') {
                const percentual = (num1 * num2) / 100
                resultado = ultimaOperacao === '+' ? num1 + percentual : num1 - percentual
            } else {
                resultado = (num1 * num2) / 100
            }
            break
        case 'mod':
            if (num2 === 0) {
                resultado = 'Erro: Divisão por zero'
            } else {
                resultado = num1 % num2
            }
            break
        default:
            resultado = num1
    }
    
    ultimaOperacao = dados.operacao

    window.calculadora.calcular({
        num1: dados.num1,
        num2: dados.num2,
        operacao: dados.operacao
    }).catch(err => console.error('Erro ao enviar para backend:', err))
    
    adicionarAoHistorico(expressao, resultado)
    
    display.innerText = resultado.toString()
    
    dados.num1 = resultado.toString()
    dados.num2 = ''
    dados.operacao = null
    expressaoCompleta = ''
    num2Display = false
}

function limparDisplay() {
    dados.num1 = ''
    dados.num2 = ''
    dados.operacao = null
    expressaoCompleta = ''
    num2Display = false
    ultimaOperacao = null
    atualizarDisplay()
}

function adicionarDecimal() {
    if (!dados.operacao) {
        if (!dados.num1.includes('.')) {
            if (dados.num1 === '' || dados.num1 === '0') {
                dados.num1 = '0.'
            } else {
                dados.num1 += '.'
            }
            expressaoCompleta = dados.num1
        }
    } else {
        if (!dados.num2.includes('.')) {
            if (dados.num2 === '' || !num2Display) {
                dados.num2 = '0.'
                num2Display = true
            } else {
                dados.num2 += '.'
            }
            expressaoCompleta = dados.num1 + ' ' + getOperadorDisplay(dados.operacao) + ' ' + dados.num2
        }
    }
    
    atualizarDisplay()
}

function atualizarDisplay() {
    display.innerText = expressaoCompleta || '0'
}

function adicionarAoHistorico(expressao, resultado) {
    const itemHistorico = {
        expressao: expressao,
        resultado: resultado,
        data: new Date().toLocaleTimeString()
    }
    
    historico.unshift(itemHistorico)
    if (historico.length > 5) historico.pop()
    
    atualizarHistorico()
}

function atualizarHistorico() {
    if (!historicoDiv) return
    
    if (historico.length === 0) {
        historicoDiv.innerHTML = '<div class="historico-vazio">Nenhum cálculo ainda</div>'
        return
    }
    
    let html = ''
    historico.forEach(item => {
        html += `
            <div class="historico-item">
                <div class="historico-expressao">${item.expressao} =</div>
                <div class="historico-resultado">${item.resultado}</div>
                <div class="historico-hora">${item.data}</div>
            </div>
        `
    })
    
    historicoDiv.innerHTML = html
}

document.addEventListener('keydown', (e) => {
    const key = e.key
    
    if (key >= '0' && key <= '9') {
        adicionarNumero(key)
    } else if (key === '.') {
        adicionarDecimal()
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        definirOperador(key)
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault()
        calcular()
    } else if (key === 'Escape') {
        limparDisplay()
    } else if (key === '%') {
        e.preventDefault()
        definirOperador('%')
    }
})