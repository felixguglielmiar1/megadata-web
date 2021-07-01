/*var Connection = require('tedious').Connection
async function  conxionVar(servidor,contrasena,base){
  var config = {  
    server: servidor,  //update me
    authentication: {
        type: 'default',
        options: {
            userName: 'sa', //update me
            password: contrasena  //update me
        }
    },
    options: {
        // If you are on Microsoft Azure, you need encryption:
        encrypt: true,
        database: base  //update me
    }
}
var connection = await  new Connection(config);

return connection
    }


module.exports= {conxionVar}*/
async function  conxionVar(servidor,contrasena,base){
    const rest = await new (require('./entornoConexion'))({
        user: 'sa',
         password: contrasena,
         server: servidor, 
         database: base,
         options: { 
             encrypt: true 
         } 
       })
       return  rest
    }
    module.exports= {conxionVar}
