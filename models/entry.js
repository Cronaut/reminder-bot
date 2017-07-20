const mongoose = require('mongoose');

// Entry Schema

const EntrySchema = mongoose.Schema({
    userid:{
        type: String,
        required: true
    },
    todos:{
        type: Array,
        "default" : [],
        required: true
    }
});

const Entry = module.exports = mongoose.model('Entry', EntrySchema);