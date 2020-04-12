const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'bt_app/update.html')));

//app.get('/bt_app/hk_stocks.csv', (req, res) => res.sendFile(path.resolve(__dirname, 'bt_app/update.html')));
app.get('/hk_stocks.csv', (req, res) => res.sendFile(path.resolve(__dirname, 'bt_app/hk_stocks.csv')));
app.get('/:fileName', (req, res) => {
  const { params: { fileName } } = req;
  return res.sendFile(path.resolve(__dirname, `bt_app/${fileName}`));
});
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
