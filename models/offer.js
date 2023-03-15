const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new Schema(
  {
    tradeWithId: { type: String, required: [true, 'Title is required'] },
    tradeWithUser: { type: String },
    tradingId: { type: String, required: [true, 'Title is required'] },
    tradingUser: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);
