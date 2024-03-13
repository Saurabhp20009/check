const mongoose = require("mongoose");

const dbConnection = async () => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/Saurabh");
        console.log("Database connected successfully");
        // Call the function to check collection after database connection is established
    } catch (error) {
        console.log("Can't connect with database", error);
    }
}

// Call the function to establish database connection
dbConnection()

const checkCollectionInDB = async (sheetName) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray(); 
        const check= collections.some(collection => collection.name === sheetName)
        return check
      } catch (error) {
        console.error("Error checking collection:", error);
    }
}


//await checkCollectionInDB("MailerCloud");

// Export the function if needed
module.exports = checkCollectionInDB;
