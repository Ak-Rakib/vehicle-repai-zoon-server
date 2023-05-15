const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config();


// middle ware
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fvciqgr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// Function for JWT verify
function verifyJwt(req, res, next) {
    const authJwt = req.headers.authorization;
    if(!authJwt){
      return res.status(401).send({message: 'unAuthorize access'});
    }
        const token = authJwt.split(' ')[1];
        jwt.verify(token, process.env.DB_TOKEN_JWT, function(err, decoded) {
            if(err){
             return res.status(401).send({message: 'unAuthorize access'});
            }
            req.decoded = decoded;
            next();
        })
}

const run = async () => {
    try{
        const serviceCollection = client.db('geniusCar').collection('user');
        const orderCollection = client.db('geniusCar').collection('orders');

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/services/:id', async(req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.findOne(query)
            res.send(result)
        })


        // For order api
        app.get('/orders', verifyJwt, async (req, res) => {
            const decoded = req.decoded;
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'unauthorize access'})
            }
            console.log('inside order api', decoded);
            let query = {}
            if(req.query.email){
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query)
            const order = await cursor.toArray()
            res.send(order)
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id:ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })


        app.post('/jwt', (req, res)=> {
            const user = req.body;
            const token = jwt.sign(user, process.env.DB_TOKEN_JWT, { expiresIn: '1h' });
            res.send({token});
            console.log(user)
        })
    }
    catch{

    }
}
run().catch(error => console.log(error))


app.get('/', (req, res) => {
    res.send('genius car server site')
})

app.listen(port, () => {
    console.log(`genius car server ${port}`)
});