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
  try {
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
  } catch (error) {
    console.log(error);
  }
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
    const ourTeamCollection = client.db("Glamorex").collection("our-team");
    const developerCollection = client.db("Glamorex").collection("developer");
    const blogsCollection = client.db("Glamorex").collection("blogs");
    const subscribeCollection = client.db("Glamorex").collection("subscriber");
    const wishListCollection = client.db("Glamorex").collection("wishList");

    // Send a ping to confirm a successful connection
    // verify Seller
    const verifyCustomer = async (req, res, next) => {
      try {
        const email = req.decoded;
        // console.log(email);
        const query = { email: email.email };
        // console.log(query, "email");
        const user = await userCollection.findOne(query);
        // console.log(user);
        if (user?.userRole !== "customer") {
          return res
            .status(403)
            .send({ error: true, message: "forbidden message" });
        }
        next();
      } catch (error) {
        console.log(error);
      }
    };
    const verifySeller = async (req, res, next) => {
      try {
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
      } catch (error) {
        console.log(error);
      }
    };
    // verify Admin
    const verifyAdmin = async (req, res, next) => {
      try {
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
      } catch (error) {
        console.log(error);
      }
    };
    // payment system
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      try {
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
      } catch (error) {
        console.log(error);
      }
    });
    // create jwt
    app.post("/jwt", (req, res) => {
      try {
        const user = req.body;
        // console.log(user);
        const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
          expiresIn: "1h",
        });
        res.send({ token });
      } catch (error) {
        console.log(error);
      }
    });
    // get user role
    app.get("/get-user-role", verifyJWT, async (req, res) => {
      try {
        const email = req.query.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        res.send({ role: user?.userRole });
      } catch (error) {
        console.log(error);
      }
    });
    // get account page
    app.get("/account/:email", verifyJWT, verifyCustomer, async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        res.send(user);
      } catch (error) {
        console.log(error);
      }
    });
    // get current-user
    app.get("/current-user/:email", verifyJWT, async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        res.send(user);
      } catch (error) {
        console.log(error);
      }
    });
    // all customer get on the database
    app.get("/only-customer", verifyJWT, async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        const customer = users.filter((user) => user?.userRole === "customer");
        res.send(customer);
      } catch (error) {
        console.log(error);
      }
    });
    app.get("/only-seller", verifyJWT, verifyAdmin, async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        const customer = users.filter((user) => user?.userRole === "seller");
        res.send(customer);
      } catch (error) {
        console.log(error);
      }
    });
    // all users {User}
    app.get("/developer", async (req, res) => {
      try {
        const developer = await developerCollection.find().toArray();
        res.send(developer);
      } catch (error) {
        console.log(error);
      }
    });
    // blog api
    app.get("/blogs", async (req, res) => {
      try {
        const blogs = await blogsCollection.find().toArray();
        res.send(blogs);
      } catch (error) {
        console.log(error);
      }
    });
    // get developer team
    app.get("/our_team", async (req, res) => {
      try {
        const blogs = await ourTeamCollection.find().toArray();
        res.send(blogs);
      } catch (error) {
        console.log(error);
      }
    });
    // post all user
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: "user already exists" });
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    // get all product by product status true
    app.get("/products", async (req, res) => {
      try {
        const query = { product_status: "approved" };
        const approvedProduct = await productCollection.find(query).toArray();
        res.send(approvedProduct);
      } catch (error) {
        console.log(error);
      }
    });
    // get featured api
    app.get("/featured-products", async (req, res) => {
      try {
        const query = { is_featured: true };
        const result = await productCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    // get trending products in the data base
    app.get("/trending-products", async (req, res) => {
      try {
        const heistSell = await productCollection
          .find()
          .sort({ overall_sell: -1 })
          .limit(8)
          .toArray();
        res.send(heistSell);
      } catch (error) {
        console.log(error);
      }
    });
    // get Top rated products in the data base
    app.get("/top-rated-products", async (req, res) => {
      try {
        const topRatedProducts = await productCollection
          .find()
          .sort({ rating: -1 })
          .limit(8)
          .toArray();
        res.send(topRatedProducts);
      } catch (error) {
        console.log(error);
      }
    });
    // get Latest products in the data base
    app.get("/latest-products", async (req, res) => {
      try {
        const topRatedProducts = await productCollection
          .find()
          .sort({ publishDate: -1 })
          .limit(8)
          .toArray();
        res.send(topRatedProducts);
      } catch (error) {
        console.log(error);
      }
    });
    // get discount product
    app.get("/discount-products", async (req, res) => {
      try {
        const allProduct = await productCollection.find().toArray();
        const discountProduct = allProduct.filter(
          (product) => parseFloat(product.discount.split("%")[0]) > 0
        );
        const inStuckProduct = discountProduct.filter(
          (product) => product.status === "In stock"
        );
        res.send(inStuckProduct);
      } catch (error) {
        console.log(error);
      }
    });
    // get single product details
    app.get("/product/:id", async (req, res) => {
      try {
        const query = req.params.id;
        const result = await productCollection.findOne({
          _id: new ObjectId(query),
        });
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    // get single product details
    app.get("/related-products", async (req, res) => {
      try {
        const category = req.query.category;
        const id = req.query.id;
        const query = await productCollection
          .find({ category: category })
          .limit(4)
          .toArray();
        const result = query.filter((p) => p._id != id);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    // user profile picture update api {User}
    app.patch("/update-photo", verifyJWT, verifyCustomer, async (req, res) => {
      try {
        const body = req.body;
        const query = { email: body?.email };
        const options = { upsert: true };
        const updatePhoto = {
          $set: {
            photo_url: body?.photo_url,
          },
        };
        const result = await userCollection.updateOne(
          query,
          updatePhoto,
          options
        );
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    // user profile update api {User}
    app.patch(
      "/update-profile",
      verifyJWT,
      verifyCustomer,
      async (req, res) => {
        try {
          const body = req.body;
          const query = { email: body?.email };
          const options = { upsert: true };
          const updatePhoto = {
            $set: {
              name: body?.name,
              email: body?.email,
              mobile: body?.mobile,
              gender: body?.gender,
              birthday: body?.birthday,
            },
          };
          const result = await userCollection.updateOne(
            query,
            updatePhoto,
            options
          );
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );
    // post the subscriber list {user}
    app.post("/subscribe", verifyJWT, async (req, res) => {
      try {
        const body = req.body;
        const query = { login_email: body.login_email };
        const existingSubscriber = await subscribeCollection.findOne(query);
        if (existingSubscriber) {
          return res.send({ message: "User already subscribed" });
        }
        const result = await subscribeCollection.insertOne(body);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    // add-to-wishlist {user}
    app.post(
      "/add-to-wishlist",
      verifyJWT,
      verifyCustomer,
      async (req, res) => {
        try {
          const body = req.body;
          const id = body.product_id;
          const products = await wishListCollection.find().toArray();
          const alreadyAddedProduct = products.find(
            (product) => product?.product_id == id
          );
          if (alreadyAddedProduct) {
            return res.send({
              message: "Already you add to wish list this product",
            });
          } else {
            const result = await wishListCollection.insertOne(body);
            res.send(result);
          }
        } catch (error) {
          console.log(error);
        }
      }
    );
    // get user wish list
    app.get(
      "/wishlists/:email",
      verifyJWT,
      verifyCustomer,
      async (req, res) => {
        try {
          const email = req.params.email;
          const result = await wishListCollection
            .find({ customer_email: email })
            .toArray();
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );
    app.delete(
      "/delete-wish-list/:id",
      verifyJWT,
      verifyCustomer,
      async (req, res) => {
        try {
          const id = req.params.id;
          const result = await wishListCollection.deleteOne({
            _id: new ObjectId(id),
          });
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );
    // get the all subscriber
    app.get("/subscribe-length", async (req, res) => {
      try {
        const subscriber = await subscribeCollection.find().toArray();
        res.send(subscriber);
      } catch (error) {
        console.log(error);
      }
    });
    // All product added by data base {seller}
    app.post("/add-product", verifyJWT, verifySeller, async (req, res) => {
      try {
        const { product } = req.body;
        const newProduct = {
          ...product,
          rating: 0,
          reviews: 0,
          is_featured: false,
          product_status: "pending",
          status: `${product.quantity > 0 ? "In stock" : "Out of stock"}`,
          overall_sell: 0,
        };
        console.log(newProduct);
        const result = await productCollection.insertOne(newProduct);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    // get seller product by useing query seller email  {seller}
    app.get("/get-my-products", verifyJWT, verifySeller, async (req, res) => {
      try {
        const email = req.query.email;
        const query = { seller_email: email };
        const filter = await productCollection.find(query).toArray();
        res.send(filter);
      } catch (error) {
        console.log(error);
      }
    });
    // update user role {admin}
    app.patch(
      "/admin/update-user-role",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        try {
          const { userId, role } = req.body;
          const filter = { _id: new ObjectId(userId) };
          const options = { upsert: true };
          const updateUserROle = {
            $set: {
              userRole: role,
            },
          };
          const result = await userCollection.updateOne(
            filter,
            updateUserROle,
            options
          );
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );
    // search user {admin}
    app.get(
      "/admin/search-user/:search",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        try {
          const searchProduct = req.params.search;
          const result = await userCollection
            .find({ name: { $regex: searchProduct, $options: "i" } })
            .toArray();
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );

    // get all user {Admin}
    app.get("/all-user", verifyJWT, verifyAdmin, async (req, res) => {
      try {
        const user = await userCollection.find().toArray();
        return res.send(user);
      } catch (error) {
        console.log(error);
      }
    });
    // get all product {Admin}
    app.get("/all-products", verifyJWT, verifyAdmin, async (req, res) => {
      try {
        const getAllProduct = await productCollection.find().toArray();
        res.send(getAllProduct);
      } catch (error) {
        console.log(error);
      }
    });
    // update product status {admin}
    app.patch(
      "/admin/update-product-status",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        try {
          const body = req.body;
          const id = body.productId;
          const filter = { _id: new ObjectId(id) };
          const options = { upsert: true };
          console.log(body);
          const update_product_states = {
            $set: {
              product_status: body.status,
            },
          };
          const result = await productCollection.updateOne(
            filter,
            update_product_states,
            options
          );
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );
    // add featured by true {admin}
    app.patch(
      "/admin/make-featured",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        try {
          const body = req.body;
          const id = body.productId;
          const filter = { _id: new ObjectId(id) };
          const options = { upsert: true };

          const allProducts = await productCollection.find().toArray();
          const featured = allProducts.filter(
            (product) => product.is_featured === true
          );
          console.log(featured?.length);
          if (featured.length >= 6) {
            return res.send({ message: "Already six product featured" });
          }
          const update_product_states = {
            $set: {
              is_featured: true,
            },
          };
          const result = await productCollection.updateOne(
            filter,
            update_product_states,
            options
          );
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );
    // remove featured {admin}
    app.patch(
      "/admin/remove-featured",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        try {
          const id = req.query.id;
          const filter = { _id: new ObjectId(id) };
          const options = { upsert: true };
          const update_product_states = {
            $set: {
              is_featured: false,
            },
          };
          const result = await productCollection.updateOne(
            filter,
            update_product_states,
            options
          );
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );
    // delete product {admin}
    app.delete(
      "/admin/delete-product",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        try {
          const id = req.query.id;
          const filter = { _id: new ObjectId(id) };
          const result = await productCollection.deleteOne(filter);
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );
    // search product {admin}
    app.get(
      "/admin/search-products/:search",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        try {
          const searchProduct = req.params.search;
          const result = await productCollection
            .find({ name: { $regex: searchProduct, $options: "i" } })
            .toArray();
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );

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
