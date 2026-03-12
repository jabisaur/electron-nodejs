const calcular = (num1, num2, operacao) => {

    console.log("calculadora", { num1, num2, operacao })
    
    const n1 = parseFloat(num1)
    const n2 = parseFloat(num2)
    let resultado = 0
        
    switch(operacao) {
        case '+':
            resultado = n1 + n2
            break
        case '-':
            resultado = n1 - n2
            break
        case '*':
            resultado = n1 * n2
            break
        case '/':
            resultado = n2 !== 0 ? n1 / n2 : 'Erro: Divisão por zero'
            break
        case '%':
            if (ultimaOperacao === '+' || ultimaOperacao === '-') {
                const percentual = (n1 * n2) / 100
                resultado = ultimaOperacao === '+' ? n1 + percentual : n1 - percentual
            } else {
                resultado = (n1 * n2) / 100
            }
            break
        case 'mod':
            if (n2 === 0) {
                resultado = 'Erro: Divisão por zero'
            } else {
                resultado = n1 % n2
            }
            break
        default:
            resultado = n1
    }
        
    console.log(`Resultado: ${resultado}`)
    return resultado
}

module.exports = {
    calcular
}