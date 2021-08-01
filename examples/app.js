const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/../dist'));
app.listen(3000);