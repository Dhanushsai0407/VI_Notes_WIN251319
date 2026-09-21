const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({

    userId:{
        type:String,
        required:true
    },

    text:{
        type:String,
        required:true
    },

    analysis:{
        type:Object,
        required:true
    }

},{
    timestamps:true
});

module.exports = mongoose.model("Session",SessionSchema);