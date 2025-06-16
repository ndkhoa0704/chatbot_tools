'use strict'
const { exec } = require('child_process')
const logger = require('../utils/logger')


function WebhookController() {
    return {
        async deploy(req, res) {
            logger.info(`Received webhook deploy done: ${JSON.stringify(req.query)}`);
            try {
                if (req.query.key !== process.env.DEPLOY_KEY_WEBHOOK) {
                    return res.status(401).json({ msg: 'Permission denied' })
                }
                exec(`sh deploy.sh`, (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`exec deploy.sh error: ${error}`);
                    }
                })
                logger.info(`Deploy done`);
                return res.status(200).json({ msg: 'Deploy done' })
            } catch (error) {
                logger.error(`Received webhook deploy fail: ${error.stack}`);
                return res.status(500).json({ msg: "Deploy source fail", e: error.stack })
            }
        }
    }
}

module.exports = WebhookController()