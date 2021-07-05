const express = require("express");
require("dotenv").config();
// const bodyParser = require("body-parser");
// const fileupload = require("express-fileupload");
const fileupload = require("express-fileupload");
const fs = require("fs-extra");
const cors = require("cors");
const app = express();

const port = 5000;

app.use(express.json());
app.use(cors());
app.use(express.static("service_img"));
app.use(fileupload());

// console.log(process.env.DB_NAME);

const MongoClient = require("mongodb").MongoClient;
const { ObjectID } = require("mongodb").ObjectID;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sblya.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  // connection to mongodb
  const ordersCollection = client.db("woodpicker").collection("orders");
  const reviewCollection = client.db("woodpicker").collection("reviews");
  const servicesCollection = client.db("woodpicker").collection("services");
  const adminCollection = client.db("woodpicker").collection("admins");

  // post reviews in mongodb

  app.post("/reviews", (req, res) => {
    const reviews = req.body;
    console.log(reviews);
    reviewCollection.insertOne(reviews).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  // admins collection.
  app.post("/addAdmin", (req, res) => {
    const addAdmin = req.body;
    console.log(addAdmin);
    adminCollection.insertOne(addAdmin).then((err, result) => {
      res.send(result.insertedCount > 0);
    });
  });

  // get reviews

  app.get("/getReviews", (req, res) => {
    reviewCollection.find().toArray((err, reviews) => {
      res.send(reviews);
    });
  });

  // post services

  app.post("/services", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const description = req.body.description;
    console.log(name, description, file);
    const filePath = `${__dirname}/service_img/${file.name}`;

    const newImg = file.data;
    const encImg = newImg.toString("base64");
    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };
    servicesCollection
      .insertOne({ name, description, image })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });

  // get services from mongodb

  app.get("/getServices", (req, res) => {
    servicesCollection.find().toArray((err, services) => {
      res.send(services);
    });
  });

  // get service with a id

  app.get("/service/:id", (req, res) => {
    servicesCollection
      .find({ _id: ObjectID(req.params.id) })
      .toArray((err, services) => {
        res.send(services[0]);
      });
  });

  // post orders to mongodb
  app.post("/addOrders", (req, res) => {
    const orders = req.body;
    ordersCollection.insertOne(orders).then((result) => {
      console.log(orders);
      res.send(orders.insertedCount > 0);
    });
  });

  // customer <orders></orders>
  app.post("/customerOrders", (req, res) => {
    const email = req.body;
    console.log(email.email);
    adminCollection.find({ email: email.email }).toArray((err, documents) => {
      if (documents.length === 0) {
        ordersCollection.find({ email: email.email }).toArray((err, orders) => {
          res.send(orders);
        });
      }
    });
  });
  // limited admin panel
  app.post("/isAdmin", (req, res) => {
    const email = req.body;
    console.log(email.email);
    adminCollection.find({ email: email.email }).toArray((err, documents) => {
      res.send(documents.length > 0);
    });
  });

  // get orders from mongodb
  app.get("/orders", (req, res) => {
    ordersCollection.find().toArray((err, order) => {
      res.send(order);
    });
  });
});

// default connection

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
