import { tool } from 'ai';
import { z } from 'zod';



export const webSearch = tool({
    description: 'Search the web for up-to-date information',
    parameters: z.object({
        query: z.string().min(1).max(100).describe('The search query'),
    }),
    execute: async ({ query }) => {
        const url = `https://api.search.brave.com/res/v1/web/search?$`

        
        return results.map(result => ({
            title: result.title,
            url: result.url,
            content: result.text.slice(0, 1000), // take just the first 1000 characters
            publishedDate: result.publishedDate,
        }));
    },
});