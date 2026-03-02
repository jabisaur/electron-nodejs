let dados = {
    num1: '', 
    num2: '', 
    operacao: null
}, 
expressaoCompleta = '',
num2Display = false

const display = document.getElementById('display')

function adicionarNumero(numero){
    if (!dados.operacao) {
        // Digitando o primeiro número
        if (dados.num1 === '0' || dados.num1 === '') {
            dados.num1 = numero
        } else {
            dados.num1 += numero
        }
        expressaoCompleta = dados.num1
    } else {
        // Digitando o segundo número
        if (!num2Display) {
            dados.num2 = numero
            num2Display = true
        } else {
            dados.num2 += numero
        }
        // Atualiza a expressão completa com o operador
        expressaoCompleta = dados.num1 + ' ' + getOperadorDisplay(dados.operacao) + ' ' + dados.num2
    }
    
    display.innerText = expressaoCompleta || '0'
}

function definirOperador(operacao){
    // Se já tem uma operação e está digitando o segundo número, calcula primeiro
    if (dados.operacao && num2Display && dados.num2) {
        calcular()
        // Se o cálculo foi bem sucedido, usa o resultado como novo num1
        if (dados.num1 && dados.num1 !== 'Erro') {
            dados.operacao = operacao
            dados.num2 = ''
            num2Display = false
            expressaoCompleta = dados.num1 + ' ' + getOperadorDisplay(operacao)
            display.innerText = expressaoCompleta
        }
        return
    }
    
    // Se não tem num1 ainda, define como 0
    if (!dados.num1 || dados.num1 === '') {
        dados.num1 = '0'
    }
    
    // Define a operação
    dados.operacao = operacao
    dados.num2 = ''
    num2Display = false
    
    // Atualiza a expressão
    expressaoCompleta = dados.num1 + ' ' + getOperadorDisplay(operacao)
    display.innerText = expressaoCompleta
}

function getOperadorDisplay(operacao) {
    switch (operacao) {
        case '/': return '÷'
        case '*': return '×'
        case '-': return '-'
        case '+': return '+'
        case '%': return '%'
        default: return operacao
    }
}

function calcular(){
    // Verifica se temos todos os dados necessários
    if (!dados.num1 || !dados.operacao || !dados.num2) {
        return
    }
    
    const num1 = parseFloat(dados.num1)
    const num2 = parseFloat(dados.num2)
    let resultado = 0
    
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
                resultado = 'Erro'
            } else {
                resultado = num1 / num2
            }
            break
        case '%':
            resultado = num1 % num2
            break
        default:
            resultado = num1
    }
    
    // Envia para o backend
    window.calculadora.calcular({
        num1: dados.num1,
        num2: dados.num2,
        operacao: dados.operacao
    }).catch(err => console.error('Erro ao enviar para backend:', err))
    
    // Atualiza display com o resultado
    display.innerText = resultado.toString()
    
    // Reseta os dados, mantendo o resultado como novo num1
    dados.num1 = resultado.toString()
    dados.num2 = ''
    dados.operacao = null
    expressaoCompleta = ''
    num2Display = false
}

function limparDisplay(){
    dados.num1 = ''
    dados.num2 = ''
    dados.operacao = null
    expressaoCompleta = ''
    num2Display = false
    display.innerText = '0'
}

function adicionarDecimal() {
    if (!dados.operacao) {
        // Adicionando decimal ao primeiro número
        if (!dados.num1.includes('.')) {
            if (dados.num1 === '' || dados.num1 === '0') {
                dados.num1 = '0.'
            } else {
                dados.num1 += '.'
            }
            expressaoCompleta = dados.num1
        }
    } else {
        // Adicionando decimal ao segundo número
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
    
    display.innerText = expressaoCompleta || '0'
}

// Ajusta o botão 0 para ocupar 2 colunas
document.addEventListener('DOMContentLoaded', function() {
    const zeroButton = document.querySelector('button[onclick="adicionarNumero(\'0\')"]');
    if (zeroButton) {
        zeroButton.classList.add('btn-zero');
    }
            
    const igualButton = document.querySelector('button[onclick="calcular()"]');
    if (igualButton) {
        igualButton.classList.add('btn-igual');
    }
});