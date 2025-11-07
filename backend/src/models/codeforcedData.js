const mongoose = require("moongoose");

const codeforcesProfileSchema = new mongoose.Schema({

    rating: {
        type: Number
    },
    rank: {
        type: String
    },
    maxRating: {
        type: Number
    },
    maxRank: {
        type: String
    }
})

const codeforcesModel = mongoose.model("codeforcesProfile", codeforcesProfileSchema);

module.exports = codeforcesModel;