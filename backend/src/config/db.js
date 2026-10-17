import mongoose from "mongoose";



const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI.replace(/\/$/, "");
        const connectionInstance = await mongoose.connect(`${uri}/${process.env.DB_NAME}`);
        console.log(`Mongo DB connected at ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGO DB Connection Error", error);
        process.exit(1);
    }
}

export default connectDB;