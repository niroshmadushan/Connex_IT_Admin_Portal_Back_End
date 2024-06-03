const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const multer = require('multer');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3001;

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'testdb'
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // To parse form data

const sereverRouter = require('./server2')
  ; app.use("", sereverRouter);

const upload = multer({ storage: multer.memoryStorage() });

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Unauthorized: No token provided');

  const tokenString = token.split(' ')[1];

  jwt.verify(tokenString, 'secret_key', (err, user) => {
    if (err) {
      console.error(err);
      return res.status(403).send('Forbidden: Invalid token');
    }
    req.user = user;
    next();
  });
};

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).send('Error registering user');
      } else {
        res.status(201).send('User registered');
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  pool.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send('Server Error');
    } else {
      if (results.length > 0) {
        const match = await bcrypt.compare(password, results[0].password);
        if (match) {
          const token = jwt.sign({ username: results[0].username }, 'secret_key');
          const cnt = results[0].cnt;
          console.log(cnt);
          res.json({ token, cnt });
        } else {
          res.status(401).send('Invalid username or password');
        }
      } else {
        res.status(401).send('User not found');
      }
    }
  });
});

app.post('/products', verifyToken, upload.single('image'), (req, res) => {
  const { name, category, vipCustomer, normalCustomer, specialCustomer } = req.body;
  const image = req.file ? req.file.buffer : null;

  pool.query('INSERT INTO products (product_name, category, image_data, vip_customer, normal_customer, special_customer) VALUES (?, ?, ?, ?, ?, ?)',
    [name, category, image, vipCustomer, normalCustomer, specialCustomer], (error, results) => {
      if (error) {
        console.log(error);
        res.status(500).send('Error registering product');
      } else {
        res.status(201).send('Product registered');
      }
    });
});

app.post('/addvendor', verifyToken, upload.single('image'), (req, res) => {
  const { name, link, des, status, pis, csgs, aim, sm, es, nt, dci, ssb, cnt } = req.body;
  const image = req.file ? req.file.buffer : null;

  pool.query('INSERT INTO `Vendor`(`name`, `des`, `wlink`, `image_data`, `status`, `Perimeter_and_internal_security`, `Cyber_Security_Governance_Compliance`, `Authentication_Identity_Management`, `Security_Management`, `Endpoint_Security`, `Networking`, `Data_Center_Infrastructure_and_Infrastructure_Monitoring`, `Server_Storage_Backup_Solutions`, `cnt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [name, des, link, image, status, pis, csgs, aim, sm, es, nt, dci, ssb, cnt], (error, results) => {
      if (error) {
        console.log(name, des, link, image, status, pis, csgs, aim, sm, es, nt, dci, ssb, cnt)
        console.log(error.message);
        res.status(500).send('Error registering product');
      } else {
        res.status(201).send('Product registered');
      }
    });
});


app.post('/addnews', verifyToken, upload.single('image'), (req, res) => {
  const { title, link, type_id, status_id, cnt } = req.body;
  const image = req.file ? req.file.buffer : null;

  pool.query('INSERT INTO `news`(`title`, `link`, `type`, `status`, `cnt`, `image_data`) VALUES (?,?,?,?,?,?)',
    [title, link, type_id, status_id, cnt, image], (error, results) => {
      if (error) {
        console.log(error.message, title, link, type_id, status_id, cnt, image);
        res.status(500).send('Error registering product');
      } else {
        res.status(201).send('Product registered');
      }
    });
});

app.get('/products', verifyToken, (req, res) => {
  pool.query('SELECT * FROM products', (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Error fetching products');
    }

    // Convert binary image data to base64 string
    const products = results.map(product => ({
      ...product,
      image_data: product.image_data ? Buffer.from(product.image_data).toString('base64') : null
    }));

    res.json(products);
  });
});


app.get('/products', verifyToken, (req, res) => {
  pool.query('SELECT * FROM products', (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Error fetching products');
    }

    // Convert binary image data to base64 string
    const products = results.map(product => ({
      ...product,
      image_data: product.image_data ? Buffer.from(product.image_data).toString('base64') : null
    }));

    res.json(products);
  });
});


app.get('/search_news',(req, res) => {
  pool.query('SELECT * FROM news', (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Error fetching products');
    }

    // Convert binary image data to base64 string
    const products = results.map(product => ({
      ...product,
      image_data: product.image_data ? Buffer.from(product.image_data).toString('base64') : null
    }));

    res.json(products);
  });
});

app.get('/newses', verifyToken, (req, res) => {
  const id = req.headers['id'];
  pool.query(`SELECT news.title as ntitle,news.link as nlink,news.image_data as image_data,news.id as nid,news.type as ntype,news.status as nstatus ,status.status as status,news_types.type as type FROM news JOIN news_types ON news.type = news_types.id JOIN status ON news.status = status.id where cnt=${id} order by nid desc;`, (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Error fetching news');
    }

    // Convert binary image data to base64 string
    const newses = results.map(newses => ({
      ...newses,
      image_data: newses.image_data ? Buffer.from(newses.image_data).toString('base64') : null
    }));

    res.json(newses);
  });
});

app.get('/vendors', verifyToken, (req, res) => {
  const id = req.headers['id'];
  pool.query(`SELECT Vendor.id as vid,name,des,wlink,image_data,Perimeter_and_internal_security,Cyber_Security_Governance_Compliance,Authentication_Identity_Management, Security_Management,Endpoint_Security,Networking,Data_Center_Infrastructure_and_Infrastructure_Monitoring,Server_Storage_Backup_Solutions,cnt, Vendor.status as vstatus ,status.status as status FROM Vendor JOIN status ON Vendor.status = status.id where cnt=${id} order by vid desc;`, (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Error fetching news');
    }

    // Convert binary image data to base64 string
    const newses = results.map(newses => ({
      ...newses,
      image_data: newses.image_data ? Buffer.from(newses.image_data).toString('base64') : null
    }));

    res.json(newses);
  });
});

app.get('/statuses', verifyToken, (req, res) => {
  pool.query('SELECT * FROM status', (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send('Error fetching statuses');
    } else {
      res.json(results);
    }
  });
});

app.get('/news_types', verifyToken, (req, res) => {
  pool.query('SELECT * FROM news_types', (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send('Error fetching new types');
    } else {
      res.json(results);
    }
  });
});

app.put('/products/:id', verifyToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, category, vipCustomer, normalCustomer, specialCustomer } = req.body;
  const image = req.file ? req.file.buffer : null;


  pool.query('UPDATE products SET product_name = ?, category = ?, image_data = ?, vip_customer = ?, normal_customer = ?, special_customer = ? WHERE id = ?',
    [name, category, image, vipCustomer, normalCustomer, specialCustomer, id], (error, results) => {
      if (error) {
        console.log(error);
        res.status(500).send('Error updating product');
      } else {
        res.status(200).send('Product updated');
      }
    });
});

app.put('/addnews/:id', verifyToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, link, status, type } = req.body;
  const image = req.file ? req.file.buffer : null;

  pool.query('UPDATE `news` SET `title`=?,`link`=?,`type`=?,`status`=?,`image_data`=? WHERE id = ?',
    [title, link, type, status, image, id], (error, results) => {
      if (error) {
        console.log(error.message);
        console.log(title, link, status, type, image, id)
        res.status(500).send('Error updating product');
      } else {
        res.status(200).send('Product updated');
      }
    });
});

app.put('/addvendor/:id', verifyToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, link, status,pis,csgc,aim,sm,es,nt,dci,ssb,des} = req.body;
  const image = req.file ? req.file.buffer : null;

  pool.query('UPDATE `Vendor` SET `name`= ?,`des`= ?,`wlink`= ?,`image_data`= ?,`status`= ?,`Perimeter_and_internal_security`= ?,`Cyber_Security_Governance_Compliance`= ?,`Authentication_Identity_Management`= ?,`Security_Management`= ?,`Endpoint_Security`= ?,`Networking`= ?,`Data_Center_Infrastructure_and_Infrastructure_Monitoring`= ?,`Server_Storage_Backup_Solutions`= ? WHERE id= ?;',
    [name,des,link,image,status,pis,csgc,aim,sm,es,nt,dci,ssb, id], (error, results) => {
      if (error) {
        console.log(error.message);
        console.log(name,des,link,image,status,pis,csgc,aim,sm,es,nt,dci,ssb, id)
        res.status(500).send('Error updating product');
      } else {
        res.status(200).send('Product updated');
      }
    });
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
