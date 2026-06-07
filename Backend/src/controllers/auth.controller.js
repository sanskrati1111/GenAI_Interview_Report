const userModel=require('../models/user.model');
const bcrypt= require("bcryptjs")
const jwt=require('jsonwebtoken')
const tokenBlacklistModel=require('../models/blacklist.model')  

/**
 * @name registerUserController 
 * @description register a new user, expects name, email and password in the request body
 * @access Public
*/


async function registerUserController(req,res){
    const {username,email,password}=req.body;

    if(!username || !email || !password){

        return res.status(400).json({message:"All fields are required"});
    }
    const isUserExist=await userModel.findOne({
        $or:[ {username}
        ,{email}]
    });
    if(isUserExist){
        // if useralready exists
        return res.status(400).json({message:"User already exists"});
    }



    // hash the password
    const hash = await bcrypt.hash(password,10);

    // create the user
    const user= await userModel.create({
        username,
        email,
        password:hash
    });


    //crerate token

    const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"1d"});


    //setin cookie

    res.cookie("token",token,)
    res.status(201).json({
        message:"User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
     })

}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */

async function loginUserController(req,res){
 
    const { email, password }= req.body;
    const user= await userModel.findOne({email});

    if(!user){
        return res.status(400).json(
            {message: "Invalid email or password"}
        )
    }
   const isPasswordMatch= await bcrypt.compare(password,user.password); 
    if(!isPasswordMatch){
    return res.status(400).json({
        message: "Invalid email or password"
})}
// if email+password valid

    const token= jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"1d"});
    res.cookie("token",token,)

    res.status(200).json({
        message:"User logged in successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
     })
   

}


async function logoutUserController(req,res){
const token = req.cookies.token;

if(token){
    // add the token to blacklist
    await tokenBlacklistModel.create({token});
    res.clearCookie("token");
    return res.status(200).json({message:"User logged out successfully"});  
}

if(!token){
    return res.status(400).json({message:"No token provided"});
}

}

/**
 * @namne getMeController
 * @description get the details of the logged in user, expects a valid token in the request cookies
 * @access Private  
 */
async function getMeController(req,res){

    const user= await userModel.findById(req.user.id)
    res.status(200).json({
        message:"User details fetched successfully",
        user: req.user
    })
}
module.exports={registerUserController, loginUserController, logoutUserController, getMeController};