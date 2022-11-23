const mongoose = require('mongoose')
/**
 *  Medição recebe 4 valores aceleração x, y, z e o tempo
 */

const Mensuration = mongoose.model('Mensuration', {
    name: String,
    date : Date,
    data : [
        {   
            accelX : Number,
            accelY : Number,
            accelZ : Number,
            time : String         
        }
    ]
})
module.exports = Mensuration
