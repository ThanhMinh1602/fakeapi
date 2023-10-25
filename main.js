const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const jsonServer = require('json-server');

const server = express();
const port = process.env.PORT || 3000;

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
          image: `http://localhost:3000/images/${imageName}`,
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

server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});
