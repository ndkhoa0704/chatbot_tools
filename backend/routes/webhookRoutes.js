const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhookController');

router.post('/deploy', WebhookController.deploy);

module.exports = router;