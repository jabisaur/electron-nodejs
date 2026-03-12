let contadorValor = 0

const incrementar = () => {
    console.log("contador:incrementar")
    contadorValor = contadorValor + 1
}

const pegarValor = () => {
    console.log("contador:pegarValor")
    return contadorValor
}

const zerar = () => {
    console.log("contador:zerar")
    return contadorValor = 0
}

module.exports = {
    incrementar, 
    pegarValor,
    zerar
}