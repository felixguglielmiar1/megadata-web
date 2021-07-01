const config=require('../Configuracion/config').config
const rest = new (require('rest-mssql-nodejs'))({
 user: config.user,
  password: config.password,
  server: config.server, 
  database: config.database,
  port: 14331,
  options: { 
      encrypt: true 
  } 
})
 
module.exports={rest}
