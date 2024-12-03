import express from 'express';
import cors from 'cors';
import topicRoutes from './routes/topicRoutes';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/topics', topicRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
