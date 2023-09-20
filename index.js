require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// middleware
app.use(cors());
app.use(express.json());
const username = process.env.USER_NAME;
const password = process.env.PASSWORD;

// const uri = `mongodb+srv://:@cluster0.klmvqmu.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${username}:${password}@cluster0.klmvqmu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access2" });
    }
    req.decoded = decoded;
    next();
  });
};
// instructor

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection = client.db("Glamorex").collection("users");
    const productCollection = client
      .db("Glamorex")
      .collection("product-collection");
    // Send a ping to confirm a successful connection
    // payment system
    const verifySeller = async (req, res, next) => {
      const email = req.decoded;
      // console.log(email);
      const query = { email: email.email };
      // console.log(query, "email");
      const user = await userCollection.findOne(query);
      // console.log(user);
      if (user?.userRole !== "seller") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded;
      // console.log(email);
      const query = { email: email.email };
      // console.log(query, "email");
      const user = await userCollection.findOne(query);
      // console.log(user);
      if (user?.userRole !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const price = req.body.price;
      if (price) {
        const amount = parseFloat(price) * 100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.send({ clientSecret: paymentIntent.client_secret });
      }
    });
    // create jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // all users
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // All product added by data base
    app.post("/add-product", verifyJWT, verifySeller, async (req, res) => {
      const { product } = req.body;
      const newProduct = {
        ...product,
        rating: 0,
        is_featured: false,
        product_status: "pending",
        status: `${product.quantity > 0 ? "In stock" : "Out of stock"}`,
        overall_sell: 0,
      };

      const result = await productCollection.insertOne(newProduct);
      res.send(result);
    });
    // get seller product by useing query seller email
    app.get("/get-my-products", verifyJWT, verifySeller, async (req, res) => {
      const email = req.query.email;
      const query = { seller_email: email };
      const filter = await productCollection.find(query).toArray();
      res.send(filter);
    });
    // get account page
    app.get("/account/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });
    // get user role
    app.get("/get-user-role", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send({ role: user?.userRole });
    });
    // get all user
    app.get("/all-user", async (req, res) => {
      const user = await userCollection.find().toArray();
      return res.send(user);
    });
    // get user by role

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Glamorex testing server is runing");
});

app.listen(port, () => {
  console.log(`Glamorex is sitting on port ${port}`);
});
