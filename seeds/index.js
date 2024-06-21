const mongoose=require('mongoose');
const db=mongoose.connection;
const names=require('./names');
const Book =require('../models/book');
mongoose.connect('mongodb://localhost:27017/book-store')
.then(()=>{
    console.log("connection open ");
})
.catch(err=>{
    console.log("got the error");
    console.log(err);
})
const seedDb=async()=>{
    await Book.deleteMany({});
    for(let i=0;i<5;i++){
       const book= new Book({
            title: `${names[i].name}`,
            author:`${names[i].author}`,
            price:`${names[i].price}`,
            description:`${names[i].description}`,
        })
        await book.save();
    }
}
seedDb().then(()=>{
    mongoose.connection.close()
});