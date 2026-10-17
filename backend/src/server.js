import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config({
    path: ".env"
});

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on port http://localhost:${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Error in connecting to the database", err);
})