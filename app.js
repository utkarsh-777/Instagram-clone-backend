const express = require("express")
const app = express()
const mongoose = require('mongoose')
const {MONGOURI} = require('./keys')
const PORT = 5000
const bodyparser = require('body-parser')
const cors = require('cors')

require('./models/post')
require('./models/user')

app.use(bodyparser.json())
app.use(cors())

const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/post')
const userRoutes = require('./routes/user')


mongoose.connect(MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.connection.on('connected',()=>{
    console.log('DB CONNECTED')
})

mongoose.connection.on('error',(err)=>{
    console.log('Error in connection',err)
})

app.use('/',authRoutes)
app.use('/',postRoutes)
app.use('/',userRoutes)

app.listen(PORT,()=>{
    console.log(`App is listening at ${PORT}`)
})