const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000


// midleware
app.use(cors())
app.use(express.json())

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

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        //   const bookCollection=client.db('Library').collection('CategoryBook')
        const categoryBookCollection= client.db('Library').collection('categoryBook')
        const bookCollection = client.db('carDoctor').collection('addBooks')

        // const bookCollection= client.db('Library').collection('addBooks')
        //   get all manual data
        app.get('/services', async (req, res) => {
            const cursor = categoryBookCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        // add book info to the database
        app.post('/books',async(req,res)=>{
            const book=req.body;
            console.log('booking',book)
            const result=await bookCollection.insertOne(book)
            res.send(result)
        })

    //  get all book data
    app.get('/books',async(req,res)=>{
        const cursor=bookCollection.find();
        const result= await cursor.toArray();
        res.send(result)
    })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
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