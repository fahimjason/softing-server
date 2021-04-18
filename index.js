const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;


require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4i8kb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const port = 5500;

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('serviceImg'));
app.use(fileUpload());


// Database Connection
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const servicesCollection = client.db("softing").collection("services");
    const reviewsCollection = client.db("softing").collection("reviews");
    const ordersCollection = client.db("softing").collection("orders");
    const usersCollection = client.db("softing").collection("users");


    // Add service 
    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const price = req.body.price;
        const description = req.body.description;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        }
        servicesCollection.insertOne({ name, price, description, image })
            .then(result => {
                res.send(result.insertedCount > 0)

            })

    })


    // Show services
    app.get('/services', (req, res) => {
        servicesCollection.find({})
            .toArray((err, result) => {
                res.send(result)
            })
    })


    // Single Service Checkout
    app.get('/service/:id', (req, res) => {
        const id = ObjectID(req.params.id);
        servicesCollection.find({ _id: id })
            .toArray((err, service) => {
                res.send(service[0])
            })
    })


    // Add Order 
    app.post('/addOrder', (req, res) => {
        const orderInfo = req.body;
        ordersCollection.insertOne(orderInfo)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })


    // Show Orders
    app.get('/orders', (req, res) => {
        const email = req.query.email;
        usersCollection.find({ email: email })
            .toArray((err, user) => {
                const filter = {}
                if (user.length === 0) {
                    filter.email = email;
                }
                ordersCollection.find(filter)
                    .toArray((err, result) => {
                        res.send(result);
                    })
            })
    })


    // Update order status
    app.patch('/updateStatus/:id', (req, res) => {
        ordersCollection.updateOne({ _id: ObjectID(req.params.id) },
            {
                $set: { status: req.body.status }
            })
            .then(result => {
                res.send(result.modifiedCount > 0);
            })
    })


    // Delete Services
    app.delete('/deleteServices/:id', (req, res) => {
        const id = ObjectID(req.params.id);
        servicesCollection.findOneAndDelete({ _id: id })
            .then(result => {
                res.send(result.deleteCount > 0)
            })
    })


    // Add Review 
    app.post('/addReview', (req, res) => {
        const review = req.body;
        reviewsCollection.insertOne(review)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })


    // Show Reviews
    app.get('/reviews', (req, res) => {
        reviewsCollection.find({})
            .toArray((err, result) => {
                res.send(result)
            })
    })


    // Add new users
    app.post('/addUser', (req, res) => {
        const user = req.body;
        usersCollection.insertOne(user)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })


    // Is Admin 
    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        usersCollection.find({ email: email })
            .toArray((err, result) => {
                res.send(result.length > 0)
            })
    })

});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(process.env.PORT || port)
