//devuelve true si el transcurrio el tiempo de espera
function timeSTOP(horaInicial,segundos){
let now=Date.now()
let diferencia=(now-horaInicial)*0.001
if(diferencia>=segundos){
    return true
}else{
    return false
}
}
module.exports={timeSTOP}