const currentTime = {
    type: "function",
    function: {
        name: "currentTime",
        description: "Get the current time"
    },
    execute: async () => {
        const now = new Date();
        return now.toLocaleString();
    }
}

module.exports = currentTime;