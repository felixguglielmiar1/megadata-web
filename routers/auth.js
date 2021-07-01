const express= require('express')
const router= express.Router()
var {buscaPass,TraeEmpresas,traeGrupo}=require('../BaseDeDatos/consultas');
router.post('/signin', async (req,res)=>{
    PassHab= await buscaPass(req.body.usuario)
    if( PassHab==='0'){
        res.render('login', {
            email: req.body.usuario,
            Error: 'Credenciales Invalidas'
        }) 
        return 
    }else{ 
        
        if(PassHab.PASS_MUSU===req.body.pw_user & PassHab.HABILITADO_GRUPO===1 ){
            let clientes= await TraeEmpresas(PassHab.SERVIDOR_MUSU,PassHab.SA_MUSU,PassHab.BASE_MUSU)
            console.log(clientes) 
            res.render('login', {
                email: req.body.usuario,
                passw: req.body.pw_user,
                visible: 'true',
                empresa: clientes
            }) 
            return

        }else{
            res.render('login', {
                email: req.body.usuario,
                Error: 'Credenciales Invalidas'
            }) 
            return
        }
    } 
}) 
router.post('/ingreso',  async (req,res)=>{  
   let grupo= await traeGrupo('1')
   res.json({ingreso: 'selecciono '+req.body.selectEMpresas+" perteneciente al grupo: "+grupo})
}) 
 
module.exports=router   