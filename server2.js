// server.jss
const express = require('express');
const mysql = require('mysql');
const { BOOLEAN } = require('sequelize');
const router =express.Router();
const port = 5000;

//server information
const connection = mysql.createConnection({
  host: 'sql12.freemysqlhosting.net',
  user: 'sql12711372',
  password: 'MkJ88nPGsm',
  database: 'sql12711372'
});





router.post('/search', (req, res) => {
    const data=req.body
    const key=data.key
    const qry =`${data.query}`;
    connection.query(qry, (error, results) => {
        if (error) {
          console.log(error);
          return res.status(500).send('Error fetching products');
        }
    
        // Convert binary image data to base64 string
        console.log(req.body);
        const products = results.map(product => ({
          ...product,
          image_data: product.image_data ? Buffer.from(product.image_data).toString('base64') : null
        }));
    
        res.json(products);
      });
 
});

module.exports = router;
