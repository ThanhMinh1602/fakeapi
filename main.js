const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser'); // Import body-parser
const { v4: uuidv4 } = require('uuid');
const jsonServer = require('json-server');

const server = express();
const port = process.env.PORT || 3000;

server.use(bodyParser.json()); // Use body-parser for JSON parsing

// Phần mềm trung gian
server.use(jsonServer.defaults());

// Thiết lập bộ định tuyến Máy chủ JSON
const jsonServerRouter = jsonServer.router('db.json');
server.use('/api', jsonServerRouter);


// Thiết lập Multer để upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// get hinhf ảnh
server.get('/images/:imageName', (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, 'uploads', imageName);

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Image not found');
  }
});

// Xử lý việc upload file và thêm sản phẩm
server.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    const imageName = req.file.originalname;
    const imagePath = path.join(__dirname, 'uploads', imageName);

    fs.readFile('db.json', 'utf8', (err, data) => {
      if (err) {
        res.status(500).send('Error reading db.json');
      } else {
        const db = JSON.parse(data);
        const products = db.products;

        const newProduct = {
          id: uuidv4(),
          name: req.body.name,
          price: req.body.price,
          description: req.body.description,
          image: `https://api-thanhminh.onrender.com/images/${imageName}`,
        };

        products.push(newProduct);

        fs.writeFile('db.json', JSON.stringify(db, null, 2), (err) => {
          if (err) {
            res.status(500).send('Error writing to db.json');
          } else {
            res.status(201).json(newProduct);
          }
        });
      }
    });
  } else {
    res.status(400).send('No file uploaded');
  }
});
// API đăng nhập http://localhost:3000/login
server.post('/login', (req, res) => {
  const { username, password } = req.body;
  const authData = JSON.parse(fs.readFileSync('auth.json', 'utf8'));

  const user = authData.users.find((u) => u.username === username && u.password === password);

  if (user) {
    // User authenticated
    res.status(200).json({ message: 'Login successful' });
  } else {
    // Authentication failed
    res.status(401).json({ message: 'Login failed' });
  }
});

// API đăng ký http://localhost:3000/register
server.post('/register', (req, res) => {
  const { username, password } = req.body;
  const authData = JSON.parse(fs.readFileSync('auth.json', 'utf8'));

  // Check if the username is already taken
  const userExists = authData.users.find((u) => u.username === username);

  if (userExists) {
    res.status(400).json({ message: 'Username already exists' });
  } else {
    const newUser = {
      username,
      password,
    };

    authData.users.push(newUser);

    fs.writeFileSync('auth.json', JSON.stringify(authData, null, 2));

    res.status(201).json({ message: 'Registration successful' });
  }
});
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});
