//Este arquivo configura as rotas das requisições
const express = require('express');
const router = express.Router();
const Mensuration = require('./models/Mensuration')



router.get('/mensuration/list', async function(request, response, next){
  const list = await Mensuration.find()
  response.send(list)
    
})

router.get('/mensuration/:id', async function(request, response, next){
  try{
    const id = request.params.id
    
    const objeto = await Mensuration.findById(id)
    if(!objeto){
      response.status(404).send({
        error:`O id: ${id} não foi encontrado no banco de dados` 
      })
      return;
    }
    else {
      response.send(objeto)
    }
    
  } catch(error){
    response.status(400).send({error: error.message})
  }
})

router.post('/mensuration', async function(request, response, next){
  try{
    const responseBody = await Mensuration.create(request.body)
    
    response.status(201).send(responseBody)
  } catch(error){
    response.status(400).send({mensagem: error})
  }
})

router.delete('/mensuration/:id',async function(request, response, next){
  try{
    const id = request.params.id

    const objeto = await Mensuration.findByIdAndDelete(id)
    if(objeto){
     response.send({mensagem:`A medição de id :"${id}"foi apagada com sucesso`})
    }
    else{
     response.status(404).send({mensagem:`O id: "${id}" não existe`})
    } 
   }catch(error){
    response.status(404).send({mensagem: error.message})
   }
})

router.delete('/list/mensuration',async function(request, response, next){
  try{
    const mongoResponse =  await Mensuration.deleteMany(
      {
      _id: {
        $in: request.body
      }
    })   
    
    if(mongoResponse.deletedCount === 0)response.status(404).send({message:`Nenhuma medição foi encontrada`})
    else if(mongoResponse.deletedCount >0 && mongoResponse.deletedCount < request.body.length)response.status(200).send({message:`As medições foram parcialmente deletadas.`})
    else if(mongoResponse.deletedCount === request.body.length)response.status(200).send({message:`Todas as medições foram apagadas com sucesso`})
  }catch(error){
    response.status(400).send({message:error.message})
  } 
});

module.exports = router;