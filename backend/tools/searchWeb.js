const { tool } = require('ai');
const { z } = require('zod');



const webSearch = tool({
    description: 'Search the web for up-to-date information',
    parameters: z.object({
        query: z.string().min(1).max(100).describe('The search query'),
    }),
    execute: async ({ query }) => {
        const params = new URLSearchParams({
            q: 'how to calculate margin profit',
            country: 'ALL'
        });
        const url = `https://api.search.brave.com/res/v1/web/search?${params}`
        const headers = {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY,
        }

        const response = await fetch(url, { headers });
        const data = await response.json();
        const results = data.web.results;

        return results.map(result => ({
            title: result.title,
            url: result.url,
            content: result.text.slice(0, 1000), // take just the first 1000 characters
            publishedDate: result.publishedDate,
        }));
    },
});

module.exports = { webSearch };