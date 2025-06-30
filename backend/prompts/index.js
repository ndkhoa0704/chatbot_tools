const fs = require('fs')

const perplexity = fs.readFileSync(__dirname + '/perplexity.txt', 'utf8')

module.exports = {
    perplexity,
}