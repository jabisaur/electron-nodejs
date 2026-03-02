
const versaoChrome = document.getElementById("chrome");
const versaoNode = document.getElementById("node");
const versaoElectron = document.getElementById("electron");


versaoChrome.innerHTML = window.versao.chrome;
versaoNode.innerHTML = window.versao.node;
versaoElectron.innerHTML = window.versao.electron;