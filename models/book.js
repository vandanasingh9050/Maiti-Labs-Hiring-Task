const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const BookSchema=new Schema({
    title:String,
    author:String,
    price: Number,
    description: String
})
module.exports=mongoose.model('Book',BookSchema);