let static = require('node-static');
const fetch = require('node-fetch');
const fs = require('fs');
let port = 3141;

console.log(`Server running on port ${port}`);

const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '5459957075:AAHU-g1HjDhSJlEWlGxlPrgCOoJBvfw7mKM';
const bot = new TelegramBot(TOKEN, { polling: true });

class Configurations {
    static balancerServer = 'http://localhost:3736';
}

class APILayer {
    static getWeather() {
        return fetch(Configurations.balancerServer + '/weather/current')
            .then(resp => resp.json())
            .catch(err => {
                console.error(err)
            });
    }
    static getForecast() {
        return fetch(Configurations.balancerServer + '/weather/forecast/24h')
            .then(resp => resp.json())
            .catch(err => {
                console.error(err)
            });
    }
    static getData() {
        return fetch(Configurations.balancerServer + '/data/get')
            .then(resp => resp.json())
            .catch(err => {
                console.error(err)
            });
    }
}

bot.onText(/\/weather/, (msg) => {
    const chatId = msg.chat.id;
    const action = msg.text.split(' ')[1];

    if (action === 'current') {
        content = APILayer.getWeather()
            .then(weather => {
                bot.sendMessage(chatId, "Current weather for " + weather.name + ": " + JSON.stringify(weather.main, null, '\t'))
            })
            .catch(err => {
                console.error(err)
            });
        return;
    }

    if (action === 'forecast') {
        content = APILayer.getForecast()
            .then(weather => {
                bot.sendMessage(chatId, "Forecast for 24h for " + weather.city.name + ": ")
                let cityWeather = [];
                for (let i = 0; i <= weather.list.length; i++) {
                    cityWeather.push(weather.list[i].dt_txt)
                    cityWeather.push(weather.list[i].main)
                    if (i > 7) {
                        break;
                    }
                }
                bot.sendMessage(chatId, JSON.stringify(cityWeather, null, '\t'))
            })
            .catch(err => {
                console.error(err)
            });
        return;
    }

    if (content === '') {
        return;
    }

    bot.sendMessage(chatId, content)
});

bot.onText(/\/get/, (msg) => {
    let content = '';
    const chatId = msg.chat.id;
    const action = msg.text.split(' ')[1];

    if (action === 'data') {
        content = APILayer.getData()
            .then(dataInfo => {
                bot.sendMessage(chatId, JSON.stringify(dataInfo, null, '\t'))
            })
            .catch(err => {
                console.error(err)
            });
        return;
    }

    if (content === '') {
        return;
    }

    bot.sendMessage(chatId, content)
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text === '/weather current' ||
        msg.text === '/weather forecast' ||
        msg.text === '/get data' || 
        msg.text === '/start') {
        return
    } else {
        bot.sendMessage(chatId, 'Wrong command. Try these options 👇', {
            reply_markup: {
                'keyboard': [['/weather current', '/weather forecast'], ['/get data']],
            }
        });
        return;
    }
});