const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Post = mongoose.model('Post')
const requireLogin = require("../middlewares/requireLogin")

router.get('/getallposts',requireLogin,(req,res)=>{
    Post.find()
        .populate('postedBy',"_id name")
        .populate("comments.postedBy","_id name")
        .then(posts=>{
            if(!posts){
                return res.status(404).json({
                    message:'Posts not found!'
                })
            }
            res.json(posts)
        })
})

router.get('/getsubposts',requireLogin,(req,res)=>{
    Post.find({postedBy:{$in:req.user.following}})
        .populate('postedBy',"_id name")
        .populate("comments.postedBy","_id name")
        .then(posts=>{
            if(!posts){
                return res.status(404).json({
                    message:'Posts not found!'
                })
            }
            res.json(posts)
        })
})

router.post('/createpost',requireLogin,(req,res)=>{
   const {title,description,photo} = req.body
   if(!title || !description || !photo){
       return res.status(404).json({
           error:'Enter required fields'
       })
   }
   const newpost = new Post({
       title,
       description,
       photo,
       postedBy:req.user
   })
   newpost.save()
    .then(post=>{
        return res.json(post)
    }).catch(err=>console.log(err))
})

router.get('/myposts',requireLogin,(req,res)=>{
    Post.find({postedBy:req.user._id})
        .populate("postedBy","_id name")
        .then(posts=>{
            if(!posts){
                return res.json({
                    message:'No posts!'
                })
            }
            return res.json({
                myposts:posts
            })
        })
        .catch(err=>console.log(err))
})

router.delete('/deletepost/:postId',requireLogin,(req,res)=>{
    Post.findOne({_id:req.params.postId})
        .populate("postedBy","_id")
        .then(post=>{
            if(!post){
                return res.status(400).json({
                    error:'Post not found!'
                })
            }
            if(post.postedBy._id.toString() === req.user._id.toString()){
                post.remove()
                    .then(result => {
                        res.json(result)
                    }).catch(err=>console.log(err))
            }else{
                res.json({
                    message:'You are not Authorized!'
                })
            }
        }).catch(err=>console.log(err))
})

router.put('/like',requireLogin,(req,res)=>{
    Post.findByIdAndUpdate({_id:req.body.postId},{
        $push:{likes:req.user._id},
    },
    {new:true}
    ).populate("postedBy","_id name")
    .populate("comments.postedBy","_id name")
    .exec((err,result)=>{
        if(err){
            return res.status(422).json({
                error:err
            })
        }else{
            return res.json(result)
        }
    })
})

router.put('/unlike',requireLogin,(req,res)=>{
    Post.findByIdAndUpdate({_id:req.body.postId},{
        $pull:{likes:req.user._id},
    },
    {new:true}
    ).populate("postedBy","_id name")
    .populate("comments.postedBy","_id name")
    .exec((err,result)=>{
        if(err){
            return res.status(422).json({
                error:err
            })
        }else{
            return res.json(result)
        }
    })
})

router.put('/comment',requireLogin,(req,res)=>{
    const comment = {
        text:req.body.text,
        postedBy:req.user._id
    }
    Post.findByIdAndUpdate({_id:req.body.postId},{
        $push:{comments:comment},
    },
    {new:true}
    ).populate("comments.postedBy","_id name")
    .populate("postedBy","_id name")
    .exec((err,result)=>{
        if(err){
            return res.status(422).json({
                error:err
            })
        }else{
            return res.json(result)
        }
    })
})

router.put('/deletecomment',requireLogin,(req,res)=>{
    Post.findByIdAndUpdate({_id:req.body.postId},{
        $pull:{comments:req.body.comment}
    },
    {new:true}
    ).exec((err,result)=>{
        if(err){
            return res.status(422).json({
                error:err
            })
        }else{
            return res.json(result)
        }
    })
})

module.exports = router