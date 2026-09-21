const express = require("express");
const router = express.Router();

const Session = require("../models/Session");

// Save Session
router.post("/", async(req,res)=>{

    try{

        const session = await Session.create(req.body);

        res.status(201).json(session);

    }catch(err){

        res.status(500).json(err);

    }

});

// Get Sessions
router.get("/:userId", async(req,res)=>{

    const sessions = await Session.find({

        userId:req.params.userId

    }).sort({

        createdAt:-1

    });

    res.json(sessions);

});

module.exports = router;