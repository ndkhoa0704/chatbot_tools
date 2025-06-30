const fs = require('fs').promises

module.exports = {
    perplexity: await fs.readFile('./perplexity.txt', 'utf8'),
}