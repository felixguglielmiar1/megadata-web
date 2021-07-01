const login = document.querySelector(".login")
const nombreUsuario = document.getElementById("usuario")
const passUsuario = document.getElementById("pw-user")
const btnIngreso = document.getElementById("btn-login");
const selectorEmpresas = document.querySelector(".selector-empresa")

btnIngreso.onclick = () => {
    if (nombreUsuario.value === "Jose" && passUsuario.value === "123") {
        selectorEmpresas.setAttribute("id", "visible")
    } else {
        alert("usuario no eiste")
    }
}