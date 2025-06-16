APP_NAME="chatbot_tools"

APP_DIR="/home/koanguyn"

LOG_PATH="/home/koanguyn/chatbot_tools/deploy.log"

cd $APP_DIR

{
    echo "$(date -Iseconds): Pulling latest code from Git repository..."
    git pull
    echo "$(date -Iseconds): Pull code done!!!"
} >> $LOG_PATH 2>&1

# Restart app by PM2
{
    echo "$(date -Iseconds) Restarting application with PM2..." 
    pm2 restart $APP_NAME
    echo "$(date -Iseconds) Deployment completed." 
} >> $LOG_PATH 2>&1