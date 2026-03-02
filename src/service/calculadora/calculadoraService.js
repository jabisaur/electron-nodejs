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
            resultado = n1 % n2
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