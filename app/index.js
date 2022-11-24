//Este arquivo configura a framework 'express''
const express = require('express');
const path = require('path');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');

const indexRouter = require('./routes.js');

const app = express();

app.use(logger('dev'));
//app.use(express.bodyParser({limit: '1mb'}))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    //Qual site tem permissão de realizar a conexão, no exemplo abaixo está o "*" indicando que qualquer site pode fazer a conexão
    res.header("Access-Control-Allow-Origin", "*");
    //Quais são os métodos que a conexão pode realizar na API
    res.header("Access-Control-Allow-Methods", 'GET,PUT,POST, PATCH, DELETE');
    app.use(cors());
    next();
});

app.use('/', indexRouter);


module.exports = app;