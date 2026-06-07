const path = require('path');
const express = require('express');
require("dotenv").config();
const app = require('./src/app');
const connectDB= require('./src/config/database');
const _dirname= path.resolve();


(async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');


    app.use(express.static(path.join(_dirname, "/frontend/dist")));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(_dirname, "/frontend/dist/index.html"));
    });

    


    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } catch (error) {
    console.error('Error starting server:', error.message);
  }
})();


// app.use(express.static(path.join(_dirname, "/frontend/dist")));
