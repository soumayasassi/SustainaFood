var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mongoose = require('mongoose');
var productRouter = require('./routes/productRoutes');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var donationRouter = require('./routes/donationRoutes');
var authRouter = require('./routes/authRoutes');
var requestNeedRoutes = require('./routes/requestNeedRoutes');
var donationTransactionRoutes = require('./routes/donationTransactionRoutes');
var statsRoutes = require("./routes/statsRoutes");
var app = express();
var notificationRoutes = require('./routes/notificationRoutes');
var feedbackRoutes = require('./routes/feedbackRoutes');
var deliveryRoutes = require('./routes/deliveryRoutes');
var contactRoutes = require('./routes/ContactSubmission');
const cron = require('node-cron');
const DonationRecommender = require('./aiService/mlModel');
var preductionRoutes = require('./routes/preductions');
// var passport = require("passport");
app.use(cors());

// 🔹 Ajout pour Socket.IO
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL de votre frontend React
    methods: ["GET", "POST"],
  },
});

// 🔹 Importer le modèle Message
const Message = require('./models/Message');

// 🔹 Stocker io pour les routes
app.set('io', io);

// 🔹 Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Utilisateur connecté:', socket.id);

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`Utilisateur a rejoint le chat: ${chatId}`);
  });

  socket.on('sendMessage', async ({ chatId, sender, receiver, content }) => {
    try {
      const message = new Message({ chatId, sender, receiver, content });
      await message.save();
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name')
        .populate('receiver', 'name');
      io.to(chatId).emit('message', populatedMessage);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  });

  // New: Handle typing event
  socket.on('typing', ({ chatId, userId }) => {
    socket.to(chatId).emit('typing', { userId });
  });

  // New: Handle stop typing event
  socket.on('stopTyping', ({ chatId, userId }) => {
    socket.to(chatId).emit('stopTyping', { userId });
  });

  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);
  });
});
// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/uploads", express.static("uploads"));

// Enable CORS
app.use(cors());

// Routes
app.use('/', indexRouter);
app.use('/api/feedback', feedbackRoutes);
app.use('/api', preductionRoutes);
app.use('/users', usersRouter);
app.use('/deliveries', deliveryRoutes);
app.use('/product', productRouter);
app.use('/donation', donationRouter);
app.use('/contact', contactRoutes);
app.use('/auth', authRouter);
app.use('/notification', notificationRoutes);
app.use('/donationTransaction', donationTransactionRoutes);
app.use('/request', requestNeedRoutes);
app.use('/stats', statsRoutes);
app.use('/messages', require('./routes/messageRoutes')); // 🔹 Ajout de la route messages

// Database Connection
if (process.env.NODE_ENV !== 'test') {
  var mongoConfig = require('./config/database.json');
  app.use(cors());
  mongoose.connect(mongoConfig.url)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

  mongoose.connection.once('open', () => {
    console.log(" MongoDB connection established successfully");
  });
}

// require("./config/passportConfig");
// app.use(passport.initialize());

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

const recommender = new DonationRecommender();

// Function to train the model
const trainModel = async () => {
  console.log('Training ML model...');
  try {
    await recommender.buildInteractionMatrix();
    recommender.train(10);
    console.log('Model training completed.');
  } catch (error) {
    console.error('Error during model training:', error.message);
  }
};

// Initial Training
trainModel();

// Schedule Model Updates
cron.schedule('0 0 * * *', trainModel);

// 🔹 Exporter server
module.exports = server;