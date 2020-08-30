const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Post = mongoose.model('Post')
const requireLogin = require("../middlewares/requireLogin")

router.get('/user/:userId',requireLogin,(req,res)=>{
    User.findById({_id:req.params.userId})
        .select('-password')
        .then(user=>{
            if(!user){
                return res.status(400).json({
                    message:'user not found!'
                })
            }
            Post.find({postedBy:user._id})
                .then(posts=>{
                    res.json({
                        user,
                        posts
                    })
                })
        })
})

router.put('/follow/:userId',requireLogin,(req,res)=>{
    const final = {}
    User.findOne({_id:req.params.userId})
        .then(user=>{
            if(!user){
                return res.status(404).json({
                    error:'User not found!'
                })
            }
            if(user._id.toString()===req.user._id.toString()){
                return res.json({
                    message:'Not Applicable!'
                })
            }

            User.findByIdAndUpdate({_id:req.user._id},{
                $push:{following:user}
            },{new:true}
            ).select("-password")
            .then(result=>{
                if(!result){
                    return res.status(422).json({
                        error:err
                    })
                }
                final.user = result
            }).catch(err=>console.log(err))

            User.findByIdAndUpdate({_id:user._id},{
                $push:{followers:req.user}
            },{new:true}
            ).select("-password")
            .exec((err,result)=>{
                if(err){
                    return res.status(422).json({
                        error:err
                    })
                }
                final.otheruser = result
                res.json(final)
            }).catch(err=>console.log(err))
                
        })
})

router.put('/unfollow/:userId',requireLogin,(req,res)=>{
    const final = {}
    User.findOne({_id:req.params.userId})
        .then(user=>{
            if(!user){
                return res.status(404).json({
                    error:'User not found!'
                })
            }
            if(user._id.toString()===req.user._id.toString()){
                return res.json({
                    message:'Not Applicable!'
                })
            }

            User.findByIdAndUpdate({_id:req.user._id},{
                $pull:{following:user._id}
            },{new:true}
            ).then(result=>{
                if(!result){
                    return res.status(422).json({
                        error:err
                    })
                }
                final.user = result
            }).catch(err=>console.log(err))

            User.findByIdAndUpdate({_id:user._id},{
                $pull:{followers:req.user._id}
            },{new:true}
            ).exec((err,result)=>{
                if(err){
                    return res.status(422).json({
                        error:err
                    })
                }
                final.otheruser = result
                res.json(final)
            }).catch(err=>console.log(err))
                
        }).catch(err=>console.log(err))
})

router.post('/search-user',(req,res)=>{
    const pattern = new RegExp("^"+req.body.query)
    User.find({email:{$regex:pattern}})
        .then(user=>{
            res.json(user)
        })
})

module.exports = router