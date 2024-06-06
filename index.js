const express = require("express");
const path = require("path");
const app = express();
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, cert } = require('firebase-admin/app');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

var serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("hom");
});

app.get("/login", (req, res) => {
  res.render("login1");
});

app.get("/signup", (req, res) => {
  res.render("signup1");
});

app.post("/signUpSubmit", async (req, res) => {
  const { name, pn, em, pw } = req.body;

  try {
    // Check if the email already exists in the database
    const userSnapshot = await db.collection('database').where('em', '==', em).get();

    if (!userSnapshot.empty) {
      return res.status(400).send("Email already exists");
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(pw, 10);

    // Add the new user to the database
    await db.collection('database').add({ name, pn, em, pw: hashedPassword });
    res.send("Signup successful");
  } catch (error) {
    res.status(500).send("Error signing up: " + error.message);
  }
});

app.post("/loginSubmit", async (req, res) => {
  const { em, pw } = req.body;

  try {
    const userSnapshot = await db.collection('database').where('em', '==', em).get();

    if (userSnapshot.empty) {
      return res.status(400).send("Invalid email or password");
    }

    let userFound = false;
    for (const doc of userSnapshot.docs) {
      const user = doc.data();
      const match = await bcrypt.compare(pw, user.pw);
      if (match) {
        userFound = true;
        return res.render(`main`);
      }
    }

    if (!userFound) {
      res.status(400).send("Invalid email or password");
    }
  } catch (error) {
    res.status(500).send("Error logging in: " + error.message);
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
