"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const topicController_1 = require("../controllers/topicController");
const router = express_1.default.Router();
// Topic routes
router.post('/generate', topicController_1.generateTopic);
router.get('/', topicController_1.getTopics);
router.get('/:id', topicController_1.getTopicById);
router.get('/:id/related', topicController_1.getRelatedTopics);
router.patch('/:id', topicController_1.updateTopic);
router.delete('/:id', topicController_1.deleteTopic);
exports.default = router;
