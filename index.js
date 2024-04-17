const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const crypto = require('crypto')
const nodemailer = require('nodemailer')


const  app = express();
const port =3000;
const cors= require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({extended:false}));


app.use(bodyParser.json());

mongoose
  .connect("mongodb+srv://gms2024:gms2024@gms.bzonaaj.mongodb.net/gms", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });

  app.listen(port, () => console.log(`Server is running on port ${port}`));

  const User = require("./models/user");
  const Post = require("./models/post");
  app.post("/register", async(req, res)=> {
    try {
      const {name, email, password, profileImage}= req.body;
      const existingUser = await User.findOne({email});
      if(existingUser){
        console.log("Email already registered");
        return res.status(400).json({message:"email already registered"})
      }

      const newUser= new User({
        name,
        email,
        password,
        profileImage
      });

      newUser.verificationToken = crypto.randomBytes(20).toString("hex");
      await newUser.save();

      sendVerificationEmail(newUser.email.verificationToken);

      res.status(202).json({message:"Registration successful. please check  your email to verify"})

    } catch (error) {
      console.log("error registration", error);
      res.status(500).json({message:"Registration failed"});
    }
  });

  const sendVerificationEmail = async(email, verificationToken)=>{
    const transporter = nodemailer.createTransport({
      service:"gmail",
      auth:{
        user:"pmpumuropizzou@gmail.com",
        pass:"rhakvnorsvapbams"
      }
    });

    const mailOption={
      from:"linkedin@gmail.com",
      to:email,
      subject:"Email verification",
      text:`please check the following link to verify your email : http://localhost:3000/verify/${verificationToken}`
    };

    try {
      await transporter.sendMail(mailOption);
      console.Console.log("verification email sent successfully")
    } catch (error) {
      console.log("Error sending verification email")
    }
  };

  app.get("/verify/:token", async(req, res) =>{
    try {
      const token =req.params.token;
      const user = await User.findOne({verificationToken: token});
      if(!user){
        return res.status(404).json({message:"Invalid verification token"})
      }
      user.verified = true;
      user.verificationToken = undefined;
      await user.save();
    } catch (error) {
      res.status(500).json({message:"email verification fail", error})
    }
  })