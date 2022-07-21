let http = require('http');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
let static = require('node-static');

let file = new static.Server('.');
let port = 3736;

const filesPath = './requestFiles/';

class Configurations {
    static openWeatherAPI = 'https://api.openweathermap.org';
    static openWeatherKEY = '54ff0974d3dbfc2e05f7fbf0d55a6903';
    static currentWeather = `/data/2.5/weather?lat=46.488257&lon=30.723309&appid=${Configurations.openWeatherKEY}`;
    static forecastWeather = `/data/2.5/forecast?lat=46.488257&lon=30.723309&appid=${Configurations.openWeatherKEY}`;
}

class APILayer {
    static loadCurrentWeather() {
        return fetch(Configurations.openWeatherAPI + Configurations.currentWeather)
            .then(resp => resp.json())
            .catch(err => {
                console.error(err)
            });
    }
    static load24hWeather() {
        return fetch(Configurations.openWeatherAPI + Configurations.forecastWeather)
            .then(resp => resp.json())
            .catch(err => {
                console.error(err)
            });
    }
}

function onCurrentWeatherRequest() {
    return APILayer.loadCurrentWeather();
}

function on24hWeatherRequest() {
    return APILayer.load24hWeather();
}

function writeNewFile(weatherInfo) {
    fs.writeFile(`./requestFiles/${Date.now()}.txt`, JSON.stringify(weatherInfo, null, '\t'), err => {
        if (err) {
            console.error(err);
        }
    });
}

function promiseAllP(items, block) {
    const promises = [];
    items.forEach(function (item, index) {
        promises.push(function (item, i) {
            return new Promise(function (resolve, reject) {
                return block.apply(this, [item, index, resolve, reject]);
            });
        }(item, index))
    });
    return Promise.all(promises);
}

function readFiles(dirname) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirname, function (err, filenames) {
            if (err) return reject(err);
            promiseAllP(filenames,
                (filename, index, resolve, reject) => {
                    fs.readFile(path.resolve(dirname, filename), 'utf-8', function (err, content) {
                        if (err) return reject(err);
                        return resolve({ filename, content });
                    });
                })
                .then(results => {
                    return resolve(results);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
}

http.createServer(function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const currentInfo = `http://${req.headers.host}${req.url}`

    if (req.url === '/weather/current') {
        writeNewFile(currentInfo);
        onCurrentWeatherRequest(req, res)
            .then(currentWeather => {
                res.write(JSON.stringify(currentWeather));
                res.end();
            })
            .catch(err => {
                res.statusCode = 400
                res.write(JSON.stringify(err));
                res.end();
            });
        return;
    }
    if (req.url === '/weather/forecast/24h') {
        writeNewFile(currentInfo);
        on24hWeatherRequest(req, res)
            .then(weather24h => {
                res.write(JSON.stringify(weather24h));
                res.end();
            })
            .catch(err => {
                res.statusCode = 400
                res.write(JSON.stringify(err));
                res.end();
            });
        return;
    }
    if (req.url === '/data/get') {
        readFiles(filesPath)
            .then(files => {
                let data = {};
                files.forEach((item) => {
                    let dateOfFile = new Date(Number(item.filename.split('.')[0]))
                    let key = dateOfFile.toString()
                    data[key] = JSON.parse(item.content)
                });
                res.write(JSON.stringify(data));
                res.end();
            })
            .catch(error => {
                console.log(error);
            });
        return
    }
    res.write('balancerServer is working!');
    res.end();
}).listen(port);

console.log(`balancerServer running on port ${port}`);