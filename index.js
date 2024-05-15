const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000


// midleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://library-management-c939f.web.app'

    ],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// database start


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yl5czei.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// creat midleware
const logger = async (req, res, next) => {
    console.log('called', req.host, req.originalUrl)
    next();
}
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of the token is:', token)
    if (!token) {
        return res.status(401).send({ message: 'not authorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log(err);
            return res.status(401).send({ massage: 'unauthorized' })
        }
        console.log('value in the token', decoded)
        req.user = decoded;
        next();

    })

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        //   const bookCollection=client.db('Library').collection('CategoryBook')
        const categoryBookCollection = client.db('Library').collection('categoryBook')
        const bookCollection = client.db('Library').collection('addBooks')
        const borrowCollection = client.db('Library').collection('borrowBooks')
        // token related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log('user for token', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

            })
                .send({ success: true });
        })

        // logout
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user)
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        // services related api

        app.get('/services', async (req, res) => {
            console.log('cookkie is connect', req.cookies)
            const cursor = categoryBookCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        // add book info to the database
        app.post('/books', async (req, res) => {
            const book = req.body;
            console.log('booking', book)
            const result = await bookCollection.insertOne(book)
            res.send(result)
        })

        //  get all book data
        app.get('/books', async (req, res) => {
            // if (req.query.email !== req.user.email) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }
            const cursor = bookCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        // get data for update
        app.get('/books/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            // console.log('update data for',id)
            const result = await bookCollection.findOne(query);
            res.send(result);
        })

        // update book data to the database
        app.put('/books/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateBook = req.body;
            const update = {
                // updateOne(query, {$inc: {property_name: -1}}, options),
                // $inc: {quantity: -1},
                $set: {
                    image: updateBook.image,
                    bookname: updateBook.bookname,
                    subcategory: updateBook.subcategory,
                    author: updateBook.author,
                    rating: updateBook.rating
                }

            }
            const result = await bookCollection.updateOne(filter, update, options)
            res.send(result)

        })



        // add borrow book information to the database
        app.post('/borrow', async (req, res) => {
            const book = req.body;
            // console.log('booking', book)
            const result = await borrowCollection.insertOne(book)
            res.send(result)
        })

        // personal borrow list find
        app.get('/borrow-user/:email', async (req, res) => {
            const email = req.params.email;
            const cursor = borrowCollection.find({ email: email })
            const result = await cursor.toArray();
            res.send(result)
        })

        // get all the borrow data
        app.get('/borrow', async (req, res) => {
            const cursor = borrowCollection.find();
            const result = await cursor.toArray()
            res.send(result)
        })

        // delete for return borrowed book
        app.delete('/borrow/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await borrowCollection.deleteOne(query)
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// database end


app.get('/', (req, res) => {
    res.send('library is running')
})
app.listen(port, () => {
    console.log(`Library server is running on port ${port} `)
})