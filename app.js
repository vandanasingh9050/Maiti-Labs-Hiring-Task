const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Book = require('./models/book');
const User = require('./models/user');
const bcrypt = require('bcrypt');

// Database connection
mongoose.connect('mongodb://localhost:27017/book-store')
    .then(() => {
        console.log("Connection open");
    })
    .catch(err => {
        console.log("Got the error");
        console.log(err);
    });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use("/", express.static(path.join(__dirname, 'sty')));

// Session configuration
app.use(session({
    secret: 'mysecret', // Replace with a secure secret in production
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/book-store',
        secret: 'mysecret', // Replace with a secure secret in production
        touchAfter: 24 * 3600 // time period in seconds
    }),
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    next();
};

// Routes
app.get('/', (req, res) => {
    res.render('books');
});

app.get('/register', (req, res) => {
    res.render('books/register');
});

app.post('/register', async (req, res) => {
    const { password, username } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const user = new User({
        username,
        password: hash
    });
    await user.save();
    req.session.user_id = user._id; // Log in the user after registration
    res.redirect('/books');
});

app.get('/login', (req, res) => {
    res.render('books/login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return res.send("Invalid username or password");
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (validPassword) {
        req.session.user_id = user._id; // Log in the user
        res.redirect('/books');
    } else {
        res.send("Invalid username or password");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/books', requireLogin, async (req, res) => {
    const books = await Book.find({});
    res.render('books/index', { books });
});

app.get('/books/add', requireLogin, (req, res) => {
    res.render('books/new');
});

app.post('/books', requireLogin, async (req, res) => {
    try {
        const { title, author, price, description } = req.body.book;

        if (!title || !author || !price || !description) {
            return res.status(400).send('Bad Request: All fields are required');
        }

        const newBook = new Book({
            title,
            author,
            price,
            description
        });

        await newBook.save();

        res.redirect(`/books/${newBook._id}`);
    } catch (error) {
        console.error('Error saving book:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/books/:id', requireLogin, async (req, res) => {
    try {
        const bookId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).send('Invalid Book ID');
        }

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).send('Book not found');
        }

        res.render('books/show', { book });
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/books/:id/edit', requireLogin, async (req, res) => {
    const book = await Book.findById(req.params.id);
    res.render('books/edit', { book });
});

app.put('/books/:id', requireLogin, async (req, res) => {
    const { id } = req.params;
    const book = await Book.findByIdAndUpdate(id, { ...req.body.book });
    res.redirect(`/books/${book._id}`);
});

app.delete('/books/:id', requireLogin, async (req, res) => {
    const { id } = req.params;
    await Book.findByIdAndDelete(id);
    res.redirect('/books');
});

app.listen(3000, () => {
    console.log("Serving on port 3000");
});
