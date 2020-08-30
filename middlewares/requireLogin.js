const jwt = require("jsonwebtoken")
const {SECRET} = require("../keys")
const User = require("../models/user")

module.exports = (req,res,next) => {
    const {authorization} = req.headers
    if(!authorization){
        return res.status(401).json({
            message:'User must be logged in!'
        })
    }
    const token = authorization.replace("Bearer ","")
    jwt.verify(token,SECRET,(err,payload)=>{
        if(err){
            return res.status(401).json({
                message:'Not Authorized!'
            })
        }
        const {_id} = payload
        User.findById(_id).then(userdata=>{
            req.user = userdata
            next()
        })
    })
}