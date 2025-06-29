APP_NAME="chatbot_tools"

APP_DIR="/root/chatbot_tool"

LOG_PATH="/root/chatbot_tool/deploy.log"

cd $APP_DIR

{
    echo "$(date -Iseconds): Pulling latest code from Git repository..."
    git pull
    echo "$(date -Iseconds): Pull code done!!!"
} >> $LOG_PATH 2>&1

{
    echo "$(date -Iseconds) Installing dependencies..."
    npm install
    echo "$(date -Iseconds) Install dependencies done!!!"
} >> $LOG_PATH 2>&1

# Restart app by PM2
{
    echo "$(date -Iseconds) Restarting application with PM2..." 
    pm2 restart $APP_NAME
    echo "$(date -Iseconds) Deployment completed." 
} >> $LOG_PATH 2>&1