const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route to handle JVZoo IPN
app.post('/jvzoo-webhook', (req, res) => {
    const transactionType = req.body.ctransaction;
    
    // Log sale transactions
    if (transactionType === 'SALE') {
        console.log('JVZoo SALE transaction received:', req.body);
        
        // // Append the sale transaction to a log file
        // fs.appendFile('jvzoo_sales.log', JSON.stringify(req.body) + '\n', (err) => {
        //     if (err) throw err;
        // });

        res.status(200).send('SALE transaction logged');
    } else {
        res.status(200).send('Not a SALE transaction');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
