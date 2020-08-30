const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const User = require("../models/user")
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const {SECRET} = require("../keys")
const requireLogin = require("../middlewares/requireLogin")
const nodemailer = require('nodemailer')
const sendgridtransport = require('nodemailer-sendgrid-transport')

//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 

const transporter = nodemailer.createTransport(sendgridtransport({
    auth:{
        api_key:'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' 
    }
}))


router.post('/signup',(req,res)=>{
    const {name,email,password} = req.body
    if(!name || !email || !password){
        res.status(422).json({error:'Please fill out all the fields!'})
    }
   User.findOne({email:email})
    .then(user=>{
        if(user){
           return res.status(422).json({error:'User aleready exists!'})
        }

        bcrypt.hash(password,12)
            .then(hashedpassword=>{
                const newuser = new User({
                    name,
                    email,
                    password:hashedpassword
                })
                newuser.save()
                    .then(user=>{
                        transporter.sendMail({
                            to:user.email,
                            from:"kumarutkarsh305@gmail.com",
                            subject:'Singup Success',
                            html:'<h1>Welcome to Instagram!</h1>'
                        })
                        return res.json({message:'Saved successfully!'})
                    })
                    .catch(err=>console.log(err))
            })

    }).catch(err=>console.log(err))
})

router.post('/login',(req,res)=>{
    const {email,password} = req.body
    if(!email || !password){
       return res.status(422).json({error:'Please provide all credentials!'})
    }
    User.findOne({email:email})
        .then(user=>{
            if(!user){
               return res.status(422).json({error:'Invalid email or password!'})
            }
            bcrypt.compare(password,user.password)
                .then(match=>{
                    if(match){
                        //res.json({message:'Logged in Successfully!'})
                        const token = jwt.sign({_id:user._id},SECRET)
                        const {_id,name,email,followers,following} = user
                        return res.json({token,user:{_id,name,email,followers,following}})
                    }else{
                        return res.json({message:'Email and Password does not match!'})
                    }
                }).catch(err=>console.log(err))

        }).catch(err=>console.log(err))
})

router.post('/reset-password',(req,res)=>{
    crypto.randomBytes(32,(err,buffer)=>{
        if(err){
            return console.log(err)
        }
        const token = buffer.toString("hex")
        User.findOne({email:req.body.email})
            .then(user=>{
                if(!user){
                    return res.status(422).json({
                        message:`User with ${req.body.email} does not exists!`
                    })
                }
                    user.resetToken = token
                    user.expireToken = Date.now() + 3600000
                    user.save().then(result=>{
                        transporter.sendMail({
                            to:user.email,
                            from:'kumarutkarsh305@gmail.com',
                            subject:"Instagram - You Requested for Change of Password",
                            html:`
                            <h1>Reset password for ${user.email}</h1>
                            <h4>To reset your password follow this <a href="http://localhost:3000/reset/${token}">link</a></h4>
                            `
                        }).then(res.json({
                            message:'Check your Mail!'
                        }))
                    })
                }).catch(err=>console.log(err))
    })
})

router.post('/new-password',(req,res)=>{
    const newPassword = req.body.password
    const senttoken = req.body.token

    User.findOne({resetToken:senttoken,expireToken:{$gt:Date.now()}})
    .then(user => {
        if(!user){
            return res.status(422).json({
                error:'Session Expired!'
            })
        }
        bcrypt.hash(newPassword,12).then(hashedpassword=>{
            user.password = hashedpassword
            user.resetToken = undefined
            user.expireToken = undefined
            user.save()
                .then(saveduser=>{
                    res.json({
                        message:'Password Updated success!'
                    })
                })
        })
    }).catch(err => console.log(err))
})

module.exports = router